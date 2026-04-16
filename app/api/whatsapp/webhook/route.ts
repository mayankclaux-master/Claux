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
  console.log('[whatsapp-webhook][trace] getTrainingManuals:start', {
    salesPath: SALES_MANUAL_PATH,
    intelligencePath: INTEL_MANUAL_PATH,
  })

  const [salesManual, intelligenceManual] = await Promise.all([
    readFile(SALES_MANUAL_PATH, 'utf8').catch(() => ''),
    readFile(INTEL_MANUAL_PATH, 'utf8').catch(() => ''),
  ])

  console.log('[whatsapp-webhook][trace] getTrainingManuals:loaded', {
    salesLength: salesManual.length,
    intelligenceLength: intelligenceManual.length,
  })

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
    const replyMatch = text.match(/"reply_text"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/i)
    const rawReply = replyMatch?.[1]
    if (!rawReply) return null

    const replyText = rawReply
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t')
      .trim()

    if (!replyText) return null

    const handoffMatch = text.match(/"needs_human_handoff"\s*:\s*(true|false)/i)
    const notesMatch = text.match(/"call_intelligence_notes"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/i)

    return {
      reply_text: replyText,
      needs_human_handoff: String(handoffMatch?.[1] ?? '').toLowerCase() === 'true',
      call_intelligence_notes: notesMatch?.[1]
        ?.replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\t/g, '\t')
        .trim() || undefined,
    }
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
  console.log('[whatsapp-webhook][trace] runClaudeSalesAgent:start', {
    hasAnthropicKey: Boolean(apiKey),
    inboundLength: input.inboundText.length,
    memoryCount: input.memoryLogs.length,
  })

  if (!apiKey) {
    throw new Error('Missing Anthropic configuration: ANTHROPIC_API_KEY')
  }

  const { salesManual, intelligenceManual } = await getTrainingManuals()
  const leadReplyCount = input.memoryLogs.filter((log) => String(log.direction ?? '').toLowerCase() === 'inbound').length

  const systemPrompt = [
    'You are Pooja from the Claux Team.',
    'Rules:',
    '1) Identity lock: You are a sharp, wise, high-energy 25-year-old woman named Pooja from the Claux Team.',
    '2) Gender grammar lock: always use feminine Hindi phrasing (e.g., "karti hoon", never "karta hoon").',
    '3) Never mention AI, bot, model, system, or agent. You are always a human consultant from Claux.',
    '4) Tone calibration: warm Hinglish for rapport + Bandra-style professional English for authority and clarity.',
    '5) One high-intent question per message to keep momentum. Never ask multiple questions.',
    '6) Keep replies concise, direct, and conversion-focused. No long technical lectures.',
    '7) Conversion Hierarchy Goal 1 (Diagnosis): use CARS (Context, Assess, Relate, Sell) and validate pain immediately. Example: "Agency ne budget waste kiya, I totally get that frustration."',
    '8) Conversion Hierarchy Goal 2 (Value-Gap): use Work-Hour Edge clearly — agencies roughly 300 hours/month vs Claux 2,400 hours/month execution powered by 100+ global SEO SOPs.',
    '9) Conversion Hierarchy Goal 3 (Demo Pivot): if skeptical, push demo line: "Sir, 5 minute ka demo dekh lijiye, aapko khud dikh jayega ki agents live kaam kaise karte hain" and share https://claux.automizemedialabs.com/demo.',
    '10) Conversion Hierarchy Goal 4 (Pricing Anchor): frame ₹7,499 as approximately ₹2.1 lakh/year saving versus traditional agencies.',
    '11) Objection handling - Too Expensive: use ROI math that one new patient/client can recover the monthly fee.',
    '12) Objection handling - Need to talk to Mayank: agree to arrange it, but qualify first by asking growth goals so Mr. Mayank is fully prepared.',
    '13) Objection handling - Last agency failed: reframe Claux as a structural fix with transparent live agents, not a black-box agency.',
    '14) If unsure, use this exact escalation line: "Sir, I’m not sure about this and don’t want to misguide you. Let me check and revert. Meanwhile, should I arrange a call with our Support Head, Mr. Mayank? He can help you with anything regarding Claux."',
    '15) Conversion links to use naturally when relevant: Demo https://claux.automizemedialabs.com/demo | Pricing https://claux.automizemedialabs.com/pricing | Landing https://claux.automizemedialabs.com | Unlock Offer https://claux.automizemedialabs.com/partner-offer | FAQs https://claux.automizemedialabs.com/#faq',
    '16) Detect human handoff if lead asks for a call, shows frustration, asks advanced customization, or requests Mr. Mayank.',
    '17) Internal brain rule: use an internal <thinking> block for Value-Gap Analysis and Objection Pre-emption before drafting final output. Never expose <thinking> in reply_text.',
    '18) Never say "I am confused".',
    '19) Output strict JSON only with keys: reply_text, needs_human_handoff, call_intelligence_notes.',
    '20) call_intelligence_notes must be concise markdown with sections: Context Brief, Call Strategy (Hook + ROI Script), Closing Tip.',
    '21) Execute this 8-step activation sequence before every reply: read full memory, identify segment, identify journey stage, identify emotional state, identify unresolved thread, identify relevant milestone, select best approach, craft original response.',
    '22) Anti-Amnesia Rule: reference specific earlier details from chat memory when relevant.',
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
    `Lead inbound reply count so far: ${leadReplyCount}`,
    '',
    'Recent conversation memory (last 15 logs):',
    renderConversationMemory(input.memoryLogs),
  ].join('\n')

  const primaryModel = 'claude-3-5-sonnet-20240620'
  const envFallbackModel = String(process.env.ANTHROPIC_FALLBACK_MODEL ?? '').trim()
  const fallbackModel = envFallbackModel || 'claude-sonnet-4-6'
  const modelCandidates = Array.from(new Set([primaryModel, fallbackModel]))

  let lastError = 'Claude API request failed.'

  for (const model of modelCandidates) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as {
      content?: Array<{ type?: string; text?: string }>
      error?: { message?: string }
    }

    console.log('[whatsapp-webhook][trace] claude:response', {
      model,
      status: response.status,
      ok: response.ok,
      errorMessage: payload?.error?.message ?? null,
      contentBlocks: Array.isArray(payload?.content) ? payload.content.length : 0,
    })

    if (!response.ok) {
      lastError = payload?.error?.message || `Claude API request failed for model ${model}.`
      continue
    }

    const textOutput = (payload.content ?? [])
      .filter((item) => item?.type === 'text')
      .map((item) => String(item.text ?? ''))
      .join('\n')
      .trim()

    const parsed = parseClaudeOutput(textOutput)
    console.log('[whatsapp-webhook][trace] claude:parsed', {
      model,
      parsed: Boolean(parsed),
      textOutputLength: textOutput.length,
    })

    if (!parsed) {
      return {
        reply_text: 'Thanks for your message. I can help you with plans, pricing, or a quick strategy call. What would you like to know first?',
        needs_human_handoff: false,
      }
    }

    return parsed
  }

  throw new Error(lastError)
}

async function saveCallIntelligenceNotes(db: any, waId: string, notes: string): Promise<void> {
  const trimmedNotes = String(notes ?? '').trim()
  if (!trimmedNotes) return

  try {
    const { error } = await db.from(LEADS_TABLE).update({ call_intelligence_notes: trimmedNotes }).eq('phone_number', waId)
    if (error) {
      console.error('[whatsapp-webhook] Failed to save call intelligence notes:', error)
    } else {
      console.log('[whatsapp-webhook][trace] call-intelligence:save-ok', {
        waId,
        notesLength: trimmedNotes.length,
      })
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
  console.log('[whatsapp-webhook][trace] webhook:events-extracted', { eventsCount: events.length })

  for (const event of events) {
    const { message, profileName, valuePayload } = event
    const waId = String(message.from ?? '').trim()
    if (!waId) {
      console.log('[whatsapp-webhook][trace] webhook:event-skipped-no-waid')
      continue
    }

    const inboundDirection = 'inbound'

    const inboundText = getInboundText(message)
    console.log('[whatsapp-webhook][trace] webhook:event-start', {
      waId,
      messageType: message.type ?? 'unknown',
      hasInboundText: Boolean(inboundText),
      inboundLength: inboundText.length,
      profileName: profileName ?? null,
    })

    const leadMetadata = {
      message_id: message.id ?? null,
      message_type: message.type ?? 'unknown',
      last_inbound_text: inboundText || null,
    }

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

    await logToWaSeo(db, {
      waId,
      direction: inboundDirection,
      messageText: inboundText,
      payloadData: valuePayload ?? message,
    })

    if (!inboundText) {
      console.log('[whatsapp-webhook][trace] webhook:event-skipped-empty-text', { waId })
      continue
    }

    try {
      console.log('[whatsapp-webhook][trace] ai-flow:start', { waId })
      const memoryLogs = await getRecentLeadMemory(db, waId)
      console.log('[whatsapp-webhook][trace] ai-flow:memory-loaded', { waId, memoryCount: memoryLogs.length })

      const ai = await runClaudeSalesAgent({
        profileName,
        inboundText,
        memoryLogs,
      })
      console.log('[whatsapp-webhook][trace] ai-flow:claude-output', {
        waId,
        needs_human_handoff: ai.needs_human_handoff,
        replyLength: String(ai.reply_text ?? '').trim().length,
        hasCallNotes: Boolean(String(ai.call_intelligence_notes ?? '').trim()),
      })

      if (ai.needs_human_handoff) {
        await ensureLeadAndStage(db, waId, 'human_handoff', leadMetadata, profileName)
        if (ai.call_intelligence_notes) {
          await saveCallIntelligenceNotes(db, waId, ai.call_intelligence_notes)
        }
      }

      const outboundText = String(ai.reply_text ?? '').trim()
      if (!outboundText) {
        console.log('[whatsapp-webhook][trace] ai-flow:skip-send-empty-reply', { waId })
        continue
      }

      console.log('[whatsapp-webhook][trace] ai-flow:send-whatsapp:start', { waId, outboundLength: outboundText.length })
      const sendResult = await sendWhatsAppText({ to: waId, text: outboundText })
      console.log('[whatsapp-webhook][trace] ai-flow:send-whatsapp:ok', {
        waId,
        messageId: sendResult?.messages?.[0]?.id ?? null,
      })

      await logToWaSeo(db, {
        waId,
        direction: 'outbound',
        messageText: outboundText,
        payloadData: sendResult,
      })
      console.log('[whatsapp-webhook][trace] ai-flow:outbound-log:ok', { waId })
    } catch (error) {
      console.error('[whatsapp-webhook] AI response flow failed:', error)
    }
  }

  return NextResponse.json({ received: true })
}
