import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWhatsAppTemplate } from '@/lib/whatsapp/meta-api'

type RoutingDecision = {
  templateName: string
  stage: string
}

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

const LEADS_TABLE = 'wa_seo_leads'
const LOGS_TABLE = 'wa_seo_logs'

const ROUTING_TABLE: Record<string, RoutingDecision> = {
  'watch demo': {
    templateName: 'claux_stage2_path_a',
    stage: 'demo_sent',
  },
  'see what claux does': {
    templateName: 'claux_stage2_path_b',
    stage: 'features_sent',
  },
  'see pricing': { templateName: 'claux_stage3_decision', stage: 'decision_sent' },
  'see offer price': { templateName: 'claux_stage4_path_a', stage: 'offer_sent' },
  'talk to us': { templateName: 'claux_stage4_path_b', stage: 'human_handoff' },
}

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

function normalizeRouteKey(value: string): string {
  return value.trim().toLowerCase()
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
  try {
    const { error: upsertError } = await db
      .from(LEADS_TABLE)
      .upsert(
        {
          phone_number: waId,
          current_stage: stage,
          metadata,
          full_name: (fullName || '').trim() || waId,
        },
        { onConflict: 'phone_number' }
      )

    if (upsertError) {
      console.error('[whatsapp-webhook] Failed to upsert lead stage:', upsertError)
    }
  } catch (error) {
    console.error('[whatsapp-webhook] Lead stage update threw error:', error)
  }
}

function getWebhookMessages(body: any): InboundMessage[] {
  const entries = Array.isArray(body?.entry) ? body.entry : []
  const messages: InboundMessage[] = []

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : []
    for (const change of changes) {
      const incoming = Array.isArray(change?.value?.messages) ? change.value.messages : []
      for (const message of incoming) {
        messages.push(message as InboundMessage)
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

  const messages = getWebhookMessages(body)

  for (const message of messages) {
    const waId = String(message.from ?? '').trim()
    if (!waId) continue

    const inboundText = getInboundText(message)
    const leadMetadata = {
      message_id: message.id ?? null,
      message_type: message.type ?? 'unknown',
      last_inbound_text: inboundText || null,
    }

    await logToWaSeo(db, {
      waId,
      direction: 'inbound',
      messageText: inboundText,
      payloadData: message,
    })

    const { data: lead } = await db
      .from(LEADS_TABLE)
      .select('phone_number, current_stage')
      .eq('phone_number', waId)
      .maybeSingle()

    const detectedAction = normalizeRouteKey(inboundText)
    console.log('[DEBUG_FLOW] Step 1: Action detected:', detectedAction)
    const route = ROUTING_TABLE[detectedAction]
    const currentStage = (lead?.current_stage as string | null | undefined) ?? null

    console.log('[STAGE_CHECK]', { waId, detectedAction, currentStage })

    if (route) {
      console.log('[DEBUG_FLOW] Step 2: Attempting DB write for:', waId)
      await ensureLeadAndStage(db, waId, route.stage, leadMetadata)

      try {
        console.log('[DEBUG_FLOW] Step 3: Meta Send Start for template:', route.templateName)
        const metaRes = await sendWhatsAppTemplate({
          to: waId,
          templateName: route.templateName,
        })
        console.log('[DEBUG_FLOW] Step 4: Meta Response Status:', (metaRes as any)?.status)

        const sendResult = metaRes

        await logToWaSeo(db, {
          waId,
          direction: 'outbound',
          messageText: undefined,
          templateName: route.templateName,
          payloadData: sendResult,
        })
      } catch (error) {
        console.error('[whatsapp-webhook] Failed sending routed template:', error)
      }

      continue
    }

    if (!lead) {
      try {
        const sendResult = await sendWhatsAppTemplate({ to: waId, templateName: 'claux_stage1_welcome' })

        await ensureLeadAndStage(db, waId, 'welcome', leadMetadata)

        await logToWaSeo(db, {
          waId,
          direction: 'outbound',
          messageText: undefined,
          templateName: 'claux_stage1_welcome',
          payloadData: sendResult,
        })
      } catch (error) {
        console.error('[whatsapp-webhook] Failed sending welcome template:', error)
      }

      continue
    }
  }

  return NextResponse.json({ received: true })
}
