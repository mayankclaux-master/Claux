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
  for (const row of logs) {
    const phone = normalizePhone(row.lead_phone || row.wa_id)
    if (!phone) continue

    const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0
    const currentLatest = latestByPhone.get(phone)
    const currentLatestMs = currentLatest ? new Date(currentLatest).getTime() : 0

    if (!currentLatest || createdAt > currentLatestMs) {
      latestByPhone.set(phone, row.created_at ?? new Date(0).toISOString())
    }
  }

  const leadItems = leads.map((lead) => ({
    phone_number: lead.phone_number,
    full_name: lead.full_name ?? null,
    current_stage: lead.current_stage ?? 'unknown',
    last_interaction_at: latestByPhone.get(lead.phone_number) ?? null,
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
    .eq('lead_phone', phoneNumber)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inboundError) {
    return NextResponse.json({ error: inboundError.message }, { status: 500 })
  }

  const lastInboundAt = lastInbound?.created_at ? new Date(lastInbound.created_at).getTime() : 0
  const within24Hours = lastInboundAt > 0 && Date.now() - lastInboundAt <= 24 * 60 * 60 * 1000

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
