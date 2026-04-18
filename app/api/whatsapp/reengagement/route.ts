import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWhatsAppText } from '@/lib/whatsapp/meta-api'

const LEADS_TABLE = 'wa_seo_leads'
const LOGS_TABLE = 'wa_seo_logs'

const REENGAGEMENT_TEMPLATE_NAME = 'reengagement_24hr'
const REENGAGEMENT_TEXT = `Hi! I didn't get a response to my earlier message. 😊

Sharing the Claux demo link in case it helps 👇
🎥 https://claux.automizemedialabs.com/demo

I can assure you — you've never seen an SEO system this powerful. All 9 agents are trained on 100+ SOPs by global SEO leaders and deliver ~6,000 hours of work in 30 days. No agency in the world can match that.

Let me know if you need any help! 🙏`

type LogRow = {
  lead_phone?: string | null
  wa_id?: string | null
  direction?: string | null
  message_body?: string | null
  template_name?: string | null
  created_at?: string | null
  payload?: unknown
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

function toMs(iso: string | null | undefined): number {
  if (!iso) return Number.NaN
  return new Date(iso).getTime()
}

function hasAlreadyReengaged(thread: LogRow[]): boolean {
  return thread.some((row) => {
    const direction = String(row.direction ?? '').toLowerCase()
    if (direction !== 'outbound') return false

    const templateName = String(row.template_name ?? '').trim().toLowerCase()
    if (templateName === REENGAGEMENT_TEMPLATE_NAME) return true

    const body = String(row.message_body ?? '').toLowerCase()
    return body.includes("didn't get a response")
  })
}

function getDirectionRows(thread: LogRow[], direction: 'inbound' | 'outbound'): LogRow[] {
  return thread.filter((row) => String(row.direction ?? '').toLowerCase() === direction)
}

export async function POST(request: Request): Promise<NextResponse> {
  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })

  const expectedSecret = String(process.env.REENGAGEMENT_CRON_SECRET ?? '').trim()
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Server configuration missing: REENGAGEMENT_CRON_SECRET' }, { status: 500 })
  }

  const authHeader = String(request.headers.get('authorization') ?? '').trim()
  const requestSecret = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''

  if (!authHeader.toLowerCase().startsWith('bearer ') || requestSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  console.log('[CRON-TRIGGER] Re-engagement cycle started')

  const nowMs = Date.now()
  const neverReplyMinAgeMs = 30 * 60 * 1000
  const goneColdMinAgeMs = 2 * 60 * 60 * 1000
  const maxWindowMs = 23 * 60 * 60 * 1000

  const [leadsResult, logsResult] = await Promise.all([
    db.from(LEADS_TABLE).select('phone_number, full_name').limit(5000),
    db
      .from(LOGS_TABLE)
      .select('lead_phone, wa_id, direction, message_body, template_name, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(5000),
  ])

  if (leadsResult.error) {
    return NextResponse.json({ error: leadsResult.error.message }, { status: 500 })
  }

  if (logsResult.error) {
    return NextResponse.json({ error: logsResult.error.message }, { status: 500 })
  }

  const leads = Array.isArray(leadsResult.data) ? leadsResult.data : []
  const logs = (Array.isArray(logsResult.data) ? logsResult.data : []) as LogRow[]
  const logsByPhone = new Map<string, LogRow[]>()

  for (const row of logs) {
    const phone = normalizePhone(row.lead_phone || row.wa_id)
    if (!phone) continue
    const existing = logsByPhone.get(phone) ?? []
    existing.push(row)
    logsByPhone.set(phone, existing)
  }

  const nudged: Array<{ phone: string; cohort: 'gone_cold' | 'never_replied' }> = []
  const skipped: Array<{ phone: string; reason: string }> = []

  for (const lead of leads) {
    const phone = normalizePhone((lead as { phone_number?: string }).phone_number)
    if (!phone) continue

    const thread = (logsByPhone.get(phone) ?? []).slice().sort((a, b) => {
      const aMs = a.created_at ? new Date(a.created_at).getTime() : 0
      const bMs = b.created_at ? new Date(b.created_at).getTime() : 0
      return bMs - aMs
    })

    if (!thread.length) {
      skipped.push({ phone, reason: 'no_logs' })
      continue
    }

    if (hasAlreadyReengaged(thread)) {
      skipped.push({ phone, reason: 'already_reengaged' })
      continue
    }

    const inboundRows = getDirectionRows(thread, 'inbound')
    const outboundRows = getDirectionRows(thread, 'outbound')

    if (!outboundRows.length) {
      skipped.push({ phone, reason: 'no_outbound_history' })
      continue
    }

    const latest = thread[0]
    const latestMs = toMs(latest.created_at)
    const latestAgeMs = nowMs - latestMs
    const latestDirection = String(latest.direction ?? '').toLowerCase()

    const goneColdEligible =
      inboundRows.length > 0 &&
      latestDirection === 'inbound' &&
      Number.isFinite(latestMs) &&
      latestAgeMs >= goneColdMinAgeMs &&
      latestAgeMs <= maxWindowMs

    const firstOutboundMs =
      outboundRows
        .map((row) => toMs(row.created_at))
        .filter((ms) => Number.isFinite(ms))
        .sort((a, b) => a - b)[0] ?? Number.NaN

    const firstOutboundAgeMs = nowMs - firstOutboundMs
    const neverRepliedEligible =
      inboundRows.length === 0 &&
      Number.isFinite(firstOutboundMs) &&
      firstOutboundAgeMs >= neverReplyMinAgeMs &&
      firstOutboundAgeMs <= maxWindowMs

    if (!goneColdEligible && !neverRepliedEligible) {
      skipped.push({ phone, reason: 'outside_target_window_or_pattern' })
      continue
    }

    try {
      const sendResult = await sendWhatsAppText({ to: phone, text: REENGAGEMENT_TEXT })

      await db.from(LOGS_TABLE).insert({
        wa_id: phone,
        lead_phone: phone,
        direction: 'outbound',
        message_body: REENGAGEMENT_TEXT,
        template_name: REENGAGEMENT_TEMPLATE_NAME,
        payload: {
          automated_nudge: true,
          nudge_type: goneColdEligible ? 'reengagement_gone_cold_2h_23h' : 'reengagement_never_replied_30m_23h',
          send_result: sendResult,
        },
      })

      nudged.push({
        phone,
        cohort: goneColdEligible ? 'gone_cold' : 'never_replied',
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('[reengagement] failed for lead', { phone, error })
      skipped.push({ phone, reason: 'send_failed' })
    }
  }

  return NextResponse.json({
    success: true,
    scanned: leads.length,
    nudged_count: nudged.length,
    nudged,
    skipped,
  })
}
