import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWhatsAppText } from '@/lib/whatsapp/meta-api'

const LEADS_TABLE = 'wa_seo_leads'
const LOGS_TABLE = 'wa_seo_logs'

type LeadRow = {
  phone_number: string
  current_stage: string | null
  full_name?: string | null
}

type LeadItem = {
  phone_number: string
  full_name: string | null
  current_stage: string
  last_interaction_at: string | null
  interaction_count: number
  button_click_count: number
}

type LogRow = {
  id?: string | number
  lead_phone?: string | null
  wa_id?: string | null
  direction?: 'inbound' | 'outbound' | string | null
  message_body?: string | null
  template_name?: string | null
  payload?: unknown
  created_at?: string | null
}

function makeDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as any
}

function normalizePhone(input: unknown): string {
  return String(input ?? '').trim()
}

function isInboundButtonClick(log: LogRow): boolean {
  if (log.direction !== 'inbound') return false
  const payload = log.payload
  if (!payload || typeof payload !== 'object') return false

  const value = payload as {
    button?: unknown
    interactive?: { type?: string }
  }

  if (value.button) return true

  const interactiveType = String(value.interactive?.type ?? '').trim().toLowerCase()
  return interactiveType === 'button_reply' || interactiveType === 'list_reply'
}

export async function GET(request: Request): Promise<NextResponse> {
  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const selectedPhone = normalizePhone(searchParams.get('phone'))

  const [leadsResult, logsResult] = await Promise.all([
    db.from(LEADS_TABLE).select('phone_number, current_stage, full_name'),
    db
      .from(LOGS_TABLE)
      .select('id, lead_phone, wa_id, direction, message_body, template_name, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(1500),
  ])

  if (leadsResult.error) {
    return NextResponse.json({ error: leadsResult.error.message }, { status: 500 })
  }

  if (logsResult.error) {
    return NextResponse.json({ error: logsResult.error.message }, { status: 500 })
  }

  const leads = (leadsResult.data ?? []) as LeadRow[]
  const logs = (logsResult.data ?? []) as LogRow[]

  const latestByPhone = new Map<string, string>()
  const interactionCountByPhone = new Map<string, number>()
  const buttonClicksByPhone = new Map<string, number>()
  for (const row of logs) {
    const phone = normalizePhone(row.lead_phone || row.wa_id)
    if (!phone) continue

    interactionCountByPhone.set(phone, (interactionCountByPhone.get(phone) ?? 0) + 1)

    if (isInboundButtonClick(row)) {
      buttonClicksByPhone.set(phone, (buttonClicksByPhone.get(phone) ?? 0) + 1)
    }

    const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0
    const currentLatest = latestByPhone.get(phone)
    const currentLatestMs = currentLatest ? new Date(currentLatest).getTime() : 0

    if (!currentLatest || createdAt > currentLatestMs) {
      latestByPhone.set(phone, row.created_at ?? new Date(0).toISOString())
    }
  }

  const leadItems: LeadItem[] = leads.map((lead) => ({
    phone_number: lead.phone_number,
    full_name: lead.full_name ?? null,
    current_stage: lead.current_stage ?? 'unknown',
    last_interaction_at: latestByPhone.get(lead.phone_number) ?? null,
    interaction_count: interactionCountByPhone.get(lead.phone_number) ?? 0,
    button_click_count: buttonClicksByPhone.get(lead.phone_number) ?? 0,
  }))

  leadItems.sort((a, b) => {
    const aTime = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0
    const bTime = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0
    return bTime - aTime
  })

  const phoneForMessages = selectedPhone || leadItems[0]?.phone_number || ''
  const messages = logs
    .filter((log) => normalizePhone(log.lead_phone || log.wa_id) === phoneForMessages)
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return aTime - bTime
    })

  return NextResponse.json({ leads: leadItems, selectedPhone: phoneForMessages, messages })
}

export async function POST(request: Request): Promise<NextResponse> {
  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })

  const body = (await request.json().catch(() => ({}))) as { phone_number?: string; text?: string }
  const phoneNumber = normalizePhone(body.phone_number)
  const text = String(body.text ?? '').trim()

  if (!phoneNumber || !text) {
    return NextResponse.json({ error: 'phone_number and text are required.' }, { status: 400 })
  }

  const { data: lastInbound, error: inboundError } = await db
    .from(LOGS_TABLE)
    .select('created_at')
    .eq('direction', 'inbound')
    .or(`lead_phone.eq.${phoneNumber},wa_id.eq.${phoneNumber}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inboundError) {
    return NextResponse.json({ error: inboundError.message }, { status: 500 })
  }

  const nowMs = Date.now()
  const windowMs = 24 * 60 * 60 * 1000
  const cutoffMs = nowMs - windowMs
  const parsedLastInboundMs = lastInbound?.created_at ? new Date(lastInbound.created_at).getTime() : Number.NaN
  const lastInboundMs = Number.isFinite(parsedLastInboundMs) ? parsedLastInboundMs : null
  const hoursSinceInbound = lastInboundMs === null ? null : Number(((nowMs - lastInboundMs) / (60 * 60 * 1000)).toFixed(2))
  const within24Hours = lastInboundMs !== null && lastInboundMs >= cutoffMs

  console.log('[crm-24h-check]', {
    phoneNumber,
    lastInboundAt: lastInbound?.created_at ?? null,
    now: new Date(nowMs).toISOString(),
    cutoff: new Date(cutoffMs).toISOString(),
    hoursSinceInbound,
    within24Hours,
  })

  if (!within24Hours) {
    return NextResponse.json(
      { error: 'Last user message is older than 24 hours. Use an approved template message.', requires_template: true },
      { status: 409 }
    )
  }

  const metaResponse = await sendWhatsAppText({ to: phoneNumber, text })

  await db.from(LOGS_TABLE).insert({
    wa_id: phoneNumber,
    direction: 'outbound',
    message_body: text,
    template_name: null,
    payload: metaResponse,
    lead_phone: phoneNumber,
  })

  return NextResponse.json({ success: true, metaResponse })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })

  const body = (await request.json().catch(() => ({}))) as { phone_number?: string; current_stage?: string }
  const phoneNumber = normalizePhone(body.phone_number)
  const currentStage = String(body.current_stage ?? '').trim()

  if (!phoneNumber || !currentStage) {
    return NextResponse.json({ error: 'phone_number and current_stage are required.' }, { status: 400 })
  }

  const { error } = await db
    .from(LEADS_TABLE)
    .upsert({ phone_number: phoneNumber, current_stage: currentStage, full_name: phoneNumber, metadata: {} }, { onConflict: 'phone_number' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
