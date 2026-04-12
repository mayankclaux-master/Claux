import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWhatsAppTemplate } from '@/lib/whatsapp/meta-api'

type RoutingDecision = {
  templateName: string
  stage: string
  buttonUrlSuffix?: string
  buttonIndex?: number
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
    buttonUrlSuffix: 'demo',
    buttonIndex: 0,
  },
  'see what claux does': {
    templateName: 'claux_stage2_path_b',
    stage: 'features_sent',
    buttonUrlSuffix: 'features',
    buttonIndex: 0,
  },
  'see pricing': { templateName: 'claux_stage3_decision', stage: 'decision_sent' },
  'see offer price': { templateName: 'claux_stage4_path_a', stage: 'offer_sent' },
  'talk to us': { templateName: 'claux_stage4_path_b', stage: 'human_handoff' },
}

function getInboundText(message: InboundMessage): string {
  const textBody = message.text?.body?.trim()
  if (textBody) return textBody

  const buttonText = message.button?.text?.trim() || message.button?.payload?.trim()
  if (buttonText) return buttonText

  const interactiveTitle =
    message.interactive?.button_reply?.title?.trim() ||
    message.interactive?.button_reply?.id?.trim() ||
    message.interactive?.list_reply?.title?.trim() ||
    message.interactive?.list_reply?.id?.trim()

  return interactiveTitle || ''
}

function normalizeRouteKey(value: string): string {
  return value.trim().toLowerCase()
}

async function logToWaSeo(
  db: any,
  logInput: {
    waId?: string
    direction: 'inbound' | 'outbound'
    messageType?: string
    messageText?: string
    templateName?: string
    metaMessageId?: string
    payloadData: unknown
  }
): Promise<void> {
  const logMessageId = logInput.metaMessageId || logInput.waId || null

  const detailedInsert = {
    wa_id: logMessageId,
    direction: logInput.direction,
    message_type: logInput.messageType ?? null,
    message_text: logInput.messageText ?? null,
    template_name: logInput.templateName ?? null,
    meta_message_id: logInput.metaMessageId ?? null,
    payload: logInput.payloadData,
  }

  const { error } = await db.from(LOGS_TABLE).insert(detailedInsert)
  if (!error) return

  const fallbackInsert = {
    wa_id: logMessageId,
    direction: logInput.direction,
    payload: logInput.payloadData,
  }

  const { error: fallbackError } = await db.from(LOGS_TABLE).insert(fallbackInsert)
  if (fallbackError) {
    console.error('[whatsapp-webhook] Failed to insert log:', fallbackError)
  }
}

async function ensureLeadAndStage(db: any, waId: string, stage: string): Promise<void> {
  const { error: upsertError } = await db
    .from(LEADS_TABLE)
    .upsert({ phone_number: waId, current_stage: stage }, { onConflict: 'phone_number' })

  if (upsertError) {
    console.error('[whatsapp-webhook] Failed to upsert lead stage:', upsertError)
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

    await logToWaSeo(db, {
      waId,
      direction: 'inbound',
      messageType: message.type ?? 'unknown',
      messageText: inboundText,
      metaMessageId: message.id,
      payloadData: message,
    })

    const { data: lead } = await db
      .from(LEADS_TABLE)
      .select('phone_number, current_stage')
      .eq('phone_number', waId)
      .maybeSingle()

    const detectedAction = normalizeRouteKey(inboundText)
    const route = ROUTING_TABLE[detectedAction]
    const currentStage = (lead?.current_stage as string | null | undefined) ?? null

    console.log('[STAGE_CHECK]', { waId, detectedAction, currentStage })

    if (route) {
      const routeButtonSuffix = route.buttonUrlSuffix

      await ensureLeadAndStage(db, waId, route.stage)

      try {
        const sendResult = await sendWhatsAppTemplate({
          to: waId,
          templateName: route.templateName,
          ...(routeButtonSuffix ? { buttonUrlSuffix: routeButtonSuffix } : {}),
          ...(route.buttonIndex !== undefined ? { buttonIndex: route.buttonIndex } : {}),
        })

        await logToWaSeo(db, {
          waId,
          direction: 'outbound',
          messageType: 'template',
          templateName: route.templateName,
          metaMessageId: sendResult.messages?.[0]?.id,
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

        await ensureLeadAndStage(db, waId, 'welcome')

        await logToWaSeo(db, {
          waId,
          direction: 'outbound',
          messageType: 'template',
          templateName: 'claux_stage1_welcome',
          metaMessageId: sendResult.messages?.[0]?.id,
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
