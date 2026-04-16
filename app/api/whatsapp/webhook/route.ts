import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { sendWhatsAppText } from '@/lib/whatsapp/meta-api'

type InboundMessage = {
  id?: string
  from?: string
  type?: string
  text?: { body?: string }
  button?: { text?: string; payload?: string }
  interactive?: {
    type?: 'button_reply' | 'list_reply'
    button_reply?: { id?: string; title?: string }
    list_reply?: { id?: string; title?: string }
  }
}

type InboundContact = {
  wa_id?: string
  profile?: { name?: string }
}

type WebhookMessageEvent = {
  message: InboundMessage
  profileName?: string
  valuePayload?: unknown
}

type ConversationLog = {
  direction?: string | null
  message_body?: string | null
  template_name?: string | null
  created_at?: string | null
}

type ClaudeAgentOutput = {
  reply_text: string
  needs_human_handoff: boolean
  call_intelligence_notes?: string
}

const LEADS_TABLE = 'wa_seo_leads'
const LOGS_TABLE = 'wa_seo_logs'

const SALES_MANUAL_PATH = path.join(process.cwd(), 'lib/ai-training/claux_sales_manual.md')
const INTEL_MANUAL_PATH = path.join(process.cwd(), 'lib/ai-training/claux_intelligence_manual.md')

function prettifyButtonLabel(value: string | undefined): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getInboundText(message: InboundMessage): string {
  const textBody = message.text?.body?.trim()
  if (textBody) return textBody

  const buttonText = message.button?.text?.trim() || prettifyButtonLabel(message.button?.payload)
  if (buttonText) return buttonText

  const interactiveTitle =
    message.interactive?.button_reply?.title?.trim() ||
    prettifyButtonLabel(message.interactive?.button_reply?.id) ||
    message.interactive?.list_reply?.title?.trim() ||
    prettifyButtonLabel(message.interactive?.list_reply?.id)

  return interactiveTitle || ''
}

async function getTrainingManuals(): Promise<{ salesManual: string; intelligenceManual: string }> {
  const [salesManual, intelligenceManual] = await Promise.all([
    readFile(SALES_MANUAL_PATH, 'utf8').catch(() => ''),
    readFile(INTEL_MANUAL_PATH, 'utf8').catch(() => ''),
  ])

  if (!salesManual || !intelligenceManual) {
    console.warn('[whatsapp-webhook] AI training manuals missing or empty from lib/ai-training.')
  }

  return {
    salesManual,
    intelligenceManual,
  }
}

function cleanClaudeJson(input: string): string {
  const trimmed = input.trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

function parseClaudeOutput(text: string): ClaudeAgentOutput | null {
  try {
    const parsed = JSON.parse(cleanClaudeJson(text)) as ClaudeAgentOutput
    const replyText = String(parsed.reply_text ?? '').trim()
    if (!replyText) return null

    return {
      reply_text: replyText,
      needs_human_handoff: Boolean(parsed.needs_human_handoff),
      call_intelligence_notes: String(parsed.call_intelligence_notes ?? '').trim() || undefined,
    }
  } catch {
    return null
  }
}

function renderConversationMemory(logs: ConversationLog[]): string {
  if (!logs.length) return 'No prior messages found.'

  return logs
    .map((log) => {
      const direction = String(log.direction ?? '').toLowerCase() === 'inbound' ? 'Lead' : 'Agent'
      const body = String(log.message_body ?? '').trim()
      const templateName = String(log.template_name ?? '').trim()
      const value = body || (templateName ? `[Template: ${templateName}]` : '[No text]')
      return `${direction}: ${value}`
    })
    .join('\n')
}

async function getRecentLeadMemory(db: any, waId: string): Promise<ConversationLog[]> {
  const { data, error } = await db
    .from(LOGS_TABLE)
    .select('direction, message_body, template_name, created_at')
    .or(`lead_phone.eq.${waId},wa_id.eq.${waId}`)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) {
    console.error('[whatsapp-webhook] Failed fetching lead memory:', error)
    return []
  }

  return (Array.isArray(data) ? data : []).reverse() as ConversationLog[]
}

async function runClaudeSalesAgent(input: {
  profileName?: string
  inboundText: string
  memoryLogs: ConversationLog[]
}): Promise<ClaudeAgentOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing Anthropic configuration: ANTHROPIC_API_KEY')
  }

  const { salesManual, intelligenceManual } = await getTrainingManuals()
  const systemPrompt = [
    'You are the CLAUX WhatsApp Sales Agent.',
    'Rules:',
    '1) Match user language and tone naturally (English/Hinglish/Hindi).',
    '2) Follow One Question Rule: ask at most one question in each reply.',
    '3) Be concise, clear, and sales-focused.',
    '4) Detect human handoff if lead asks for a call, shows frustration, or has complex objections/requirements.',
    '5) Output strict JSON only with keys: reply_text, needs_human_handoff, call_intelligence_notes.',
    '6) call_intelligence_notes must be concise markdown with sections: Context Brief, Call Strategy (Hook + ROI Script), Closing Tip.',
    '7) Execute this 8-step activation sequence before every reply: read full memory, identify segment, identify journey stage, identify emotional state, identify unresolved thread, identify relevant milestone, select best approach, craft original response.',
    '8) Anti-Amnesia Rule: reference specific earlier details from chat memory when relevant.',
    '',
    '=== CLAUX SALES MANUAL ===',
    salesManual,
    '',
    '=== CLAUX INTELLIGENCE MANUAL ===',
    intelligenceManual,
  ].join('\n')

  const userPrompt = [
    `Lead Name: ${String(input.profileName ?? '').trim() || 'Unknown'}`,
    `Latest inbound message: ${input.inboundText}`,
    '',
    'Recent conversation memory (last 15 logs):',
    renderConversationMemory(input.memoryLogs),
  ].join('\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    content?: Array<{ type?: string; text?: string }>
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Claude API request failed.')
  }

  const textOutput = (payload.content ?? [])
    .filter((item) => item?.type === 'text')
    .map((item) => String(item.text ?? ''))
    .join('\n')
    .trim()

  const parsed = parseClaudeOutput(textOutput)
  if (!parsed) {
    return {
      reply_text: textOutput || 'Thanks for your message. Our team will assist you shortly.',
      needs_human_handoff: false,
    }
  }

  return parsed
}

async function saveCallIntelligenceNotes(db: any, waId: string, notes: string): Promise<void> {
  const trimmedNotes = String(notes ?? '').trim()
  if (!trimmedNotes) return

  try {
    const { error } = await db.from(LEADS_TABLE).update({ call_intelligence_notes: trimmedNotes }).eq('phone_number', waId)
    if (error) {
      console.error('[whatsapp-webhook] Failed to save call intelligence notes:', error)
    }
  } catch (error) {
    console.error('[whatsapp-webhook] Saving call intelligence notes threw error:', error)
  }
}

async function logToWaSeo(
  db: any,
  logInput: {
    waId: string
    direction: 'inbound' | 'outbound'
    messageText?: string
    templateName?: string
    payloadData: unknown
  }
): Promise<void> {
  const detailedInsert = {
    wa_id: logInput.waId,
    direction: logInput.direction,
    message_body: logInput.messageText ?? null,
    template_name: logInput.templateName ?? null,
    lead_phone: logInput.waId,
    payload: logInput.payloadData,
  }

  const { error } = await db.from(LOGS_TABLE).insert(detailedInsert)
  if (!error) return

  const fallbackInsert = {
    wa_id: logInput.waId,
    direction: logInput.direction,
    lead_phone: logInput.waId,
    payload: logInput.payloadData,
  }

  const { error: fallbackError } = await db.from(LOGS_TABLE).insert(fallbackInsert)
  if (fallbackError) {
    console.error('[whatsapp-webhook] Failed to insert log:', fallbackError)
  }
}

async function ensureLeadAndStage(
  db: any,
  waId: string,
  stage: string,
  metadata: Record<string, unknown>,
  fullName?: string
): Promise<void> {
  const trimmedFullName = String(fullName ?? '').trim()
  console.log('Final Name Check:', trimmedFullName || null)

  const upsertPayload: Record<string, unknown> = {
    phone_number: waId,
    current_stage: stage,
    metadata,
  }

  if (trimmedFullName) {
    upsertPayload.full_name = trimmedFullName
  }

  try {
    const { error: upsertError } = await db
      .from(LEADS_TABLE)
      .upsert(upsertPayload, { onConflict: 'phone_number' })

    if (upsertError) {
      console.error('[whatsapp-webhook] Failed to upsert lead stage:', upsertError)
    }

    if (trimmedFullName) {
      const { error: forceNameError } = await db.from(LEADS_TABLE).update({ full_name: trimmedFullName }).eq('phone_number', waId)
      if (forceNameError) {
        console.error('[whatsapp-webhook] Failed force-updating lead name:', forceNameError)
      }
    }
  } catch (error) {
    console.error('[whatsapp-webhook] Lead stage update threw error:', error)
  }
}

async function ensureLeadName(db: any, waId: string, fullName?: string): Promise<void> {
  const trimmedFullName = String(fullName ?? '').trim()
  if (!trimmedFullName) return

  try {
    const { error } = await db.from(LEADS_TABLE).update({ full_name: trimmedFullName }).eq('phone_number', waId)
    if (error) {
      console.error('[whatsapp-webhook] Failed to update lead name:', error)
    }
  } catch (error) {
    console.error('[whatsapp-webhook] Lead name update threw error:', error)
  }
}

function getWebhookMessages(body: any): WebhookMessageEvent[] {
  const entries = Array.isArray(body?.entry) ? body.entry : []
  const messages: WebhookMessageEvent[] = []

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : []
    for (const change of changes) {
      const contacts = Array.isArray(change?.value?.contacts) ? (change.value.contacts as InboundContact[]) : []
      const firstContactName = String(contacts[0]?.profile?.name ?? '').trim()
      const profileNameByWaId = new Map<string, string>()
      const valuePayload = change?.value ?? null

      for (const contact of contacts) {
        const waId = String(contact?.wa_id ?? '').trim()
        const profileName = String(contact?.profile?.name ?? '').trim()
        if (!waId || !profileName) continue
        profileNameByWaId.set(waId, profileName)
      }

      const incoming = Array.isArray(change?.value?.messages) ? change.value.messages : []
      for (const message of incoming) {
        const inbound = message as InboundMessage
        const fromWaId = String(inbound.from ?? '').trim()
        const profileName = profileNameByWaId.get(fromWaId) || firstContactName || undefined

        messages.push({
          message: inbound,
          profileName,
          valuePayload,
        })
      }
    }
  }

  return messages
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const verifyToken = searchParams.get('hub.verify_token')
  const hubChallenge = searchParams.get('hub.challenge') ?? ''

  console.log(`DEBUG: Expected [${process.env.WHATSAPP_VERIFY_TOKEN}] - Received [${verifyToken}]`)

  if (mode === 'subscribe' && verifyToken && verifyToken.trim() === process.env.WHATSAPP_VERIFY_TOKEN?.trim()) {
    return new Response(hubChallenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return new Response('Verification failed', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as any

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }

  console.log('[whatsapp-webhook] Incoming POST body:', JSON.stringify(body))

  const events = getWebhookMessages(body)

  for (const event of events) {
    const { message, profileName, valuePayload } = event
    const waId = String(message.from ?? '').trim()
    if (!waId) continue

    const inboundDirection = 'inbound'

    const inboundText = getInboundText(message)
    const leadMetadata = {
      message_id: message.id ?? null,
      message_type: message.type ?? 'unknown',
      last_inbound_text: inboundText || null,
    }

    await logToWaSeo(db, {
      waId,
      direction: inboundDirection,
      messageText: inboundText,
      payloadData: valuePayload ?? message,
    })

    const { data: lead } = await db
      .from(LEADS_TABLE)
      .select('phone_number, current_stage')
      .eq('phone_number', waId)
      .maybeSingle()

    if (!lead) {
      await ensureLeadAndStage(db, waId, 'welcome', leadMetadata, profileName)
    } else {
      await ensureLeadName(db, waId, profileName)
    }

    if (!inboundText) {
      continue
    }

    try {
      const memoryLogs = await getRecentLeadMemory(db, waId)
      const ai = await runClaudeSalesAgent({
        profileName,
        inboundText,
        memoryLogs,
      })

      if (ai.needs_human_handoff) {
        await ensureLeadAndStage(db, waId, 'human_handoff', leadMetadata, profileName)
        if (ai.call_intelligence_notes) {
          await saveCallIntelligenceNotes(db, waId, ai.call_intelligence_notes)
        }
      }

      const outboundText = String(ai.reply_text ?? '').trim()
      if (!outboundText) continue

      const sendResult = await sendWhatsAppText({ to: waId, text: outboundText })
      await logToWaSeo(db, {
        waId,
        direction: 'outbound',
        messageText: outboundText,
        payloadData: sendResult,
      })
    } catch (error) {
      console.error('[whatsapp-webhook] AI response flow failed:', error)
    }
  }

  return NextResponse.json({ received: true })
}
