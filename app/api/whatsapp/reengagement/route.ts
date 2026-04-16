import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { sendWhatsAppText } from '@/lib/whatsapp/meta-api'

const LEADS_TABLE = 'wa_seo_leads'
const LOGS_TABLE = 'wa_seo_logs'

const SALES_MANUAL_PATH = path.join(process.cwd(), 'lib/ai-training/claux_sales_manual.md')
const INTEL_MANUAL_PATH = path.join(process.cwd(), 'lib/ai-training/claux_intelligence_manual.md')

type LogRow = {
  lead_phone?: string | null
  wa_id?: string | null
  direction?: string | null
  message_body?: string | null
  template_name?: string | null
  created_at?: string | null
  payload?: unknown
}

type ClaudeReengagementOutput = {
  reply_text: string
  value_prop_used?: string
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

function parseClaudeOutput(rawText: string): ClaudeReengagementOutput | null {
  const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

  try {
    const parsed = JSON.parse(cleaned) as ClaudeReengagementOutput
    const reply = String(parsed.reply_text ?? '').trim()
    if (!reply) return null
    return {
      reply_text: reply,
      value_prop_used: String(parsed.value_prop_used ?? '').trim() || undefined,
    }
  } catch {
    return null
  }
}

function renderMemory(logs: LogRow[]): string {
  return logs
    .map((row) => {
      const direction = String(row.direction ?? '').toLowerCase() === 'inbound' ? 'Lead' : 'Pooja'
      const body = String(row.message_body ?? '').trim()
      const template = String(row.template_name ?? '').trim()
      const value = body || (template ? `[Template: ${template}]` : '[No text]')
      return `${direction}: ${value}`
    })
    .join('\n')
}

async function getTrainingManuals(): Promise<{ salesManual: string; intelligenceManual: string }> {
  const [salesManual, intelligenceManual] = await Promise.all([
    readFile(SALES_MANUAL_PATH, 'utf8').catch(() => ''),
    readFile(INTEL_MANUAL_PATH, 'utf8').catch(() => ''),
  ])

  return { salesManual, intelligenceManual }
}

async function runReengagementClaude(input: {
  phone: string
  leadName?: string | null
  memoryLogs: LogRow[]
  lastOutboundText: string
}): Promise<ClaudeReengagementOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing Anthropic configuration: ANTHROPIC_API_KEY')
  }

  const { salesManual, intelligenceManual } = await getTrainingManuals()

  const systemPrompt = [
    'You are Pooja from the Claux Team writing a 24-hour re-engagement ping.',
    'Task:',
    '1) Generate a short, warm, high-conversion Hinglish ping.',
    '2) Use a DIFFERENT value proposition than your last outbound message.',
    '3) Prioritize one of these value props: 2,400-hour execution edge, 100+ SOP authority, or ~₹2.1L yearly saving math.',
    '4) Ask one high-intent question at the end.',
    '5) No long explanations. Keep it under 320 characters.',
    '6) Output strict JSON with keys: reply_text, value_prop_used.',
    '',
    '=== CLAUX SALES MANUAL ===',
    salesManual,
    '',
    '=== CLAUX INTELLIGENCE MANUAL ===',
    intelligenceManual,
  ].join('\n')

  const userPrompt = [
    `Lead phone: ${input.phone}`,
    `Lead name: ${String(input.leadName ?? '').trim() || 'Unknown'}`,
    `Last outbound message from Pooja: ${input.lastOutboundText || 'N/A'}`,
    '',
    'Recent conversation memory:',
    renderMemory(input.memoryLogs),
    '',
    'Pooja, generate a Smart Re-engagement Ping using a DIFFERENT value-prop than your last message. Use the 2,400-hour edge, the 100+ SOP authority, or the ₹2.1L saving math.',
  ].join('\n')

  const primaryModel = 'claude-3-5-sonnet-20240620'
  const fallbackModel = String(process.env.ANTHROPIC_FALLBACK_MODEL ?? '').trim() || 'claude-sonnet-4-6'

  let lastError = 'Claude re-engagement generation failed.'

  for (const model of Array.from(new Set([primaryModel, fallbackModel]))) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as {
      content?: Array<{ type?: string; text?: string }>
      error?: { message?: string }
    }

    if (!response.ok) {
      lastError = payload?.error?.message || `Claude API failed for model ${model}`
      continue
    }

    const rawText = (payload.content ?? [])
      .filter((c) => c?.type === 'text')
      .map((c) => String(c.text ?? ''))
      .join('\n')
      .trim()

    const parsed = parseClaudeOutput(rawText)
    if (parsed) return parsed

    if (rawText) {
      return {
        reply_text: rawText,
      }
    }
  }

  throw new Error(lastError)
}

export async function POST(request: Request): Promise<NextResponse> {
  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })

  const expectedSecret = String(process.env.REENGAGEMENT_CRON_SECRET ?? '').trim()
  const authHeader = String(request.headers.get('authorization') ?? '').trim()
  const requestSecret = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''

  if (expectedSecret && requestSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const nowMs = Date.now()
  const minAgeMs = 2 * 60 * 60 * 1000
  const maxAgeMs = 24 * 60 * 60 * 1000

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

  const nudged: Array<{ phone: string; value_prop_used?: string }> = []
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

    const latest = thread[0]
    const latestAtMs = latest.created_at ? new Date(latest.created_at).getTime() : Number.NaN
    if (!Number.isFinite(latestAtMs)) {
      skipped.push({ phone, reason: 'invalid_latest_timestamp' })
      continue
    }

    const ageMs = nowMs - latestAtMs
    if (ageMs < minAgeMs) {
      skipped.push({ phone, reason: 'not_stalled_yet' })
      continue
    }

    if (ageMs > maxAgeMs) {
      skipped.push({ phone, reason: 'outside_24h_window' })
      continue
    }

    const latestDirection = String(latest.direction ?? '').toLowerCase()
    if (latestDirection !== 'inbound') {
      skipped.push({ phone, reason: 'latest_not_inbound' })
      continue
    }

    const lastOutbound = thread.find((row) => String(row.direction ?? '').toLowerCase() === 'outbound')
    const lastOutboundText = String(lastOutbound?.message_body ?? '').trim()

    try {
      const memoryLogs = thread.slice(0, 15).reverse()
      const ai = await runReengagementClaude({
        phone,
        leadName: String((lead as { full_name?: string | null }).full_name ?? '').trim() || null,
        memoryLogs,
        lastOutboundText,
      })

      const outboundText = String(ai.reply_text ?? '').trim()
      if (!outboundText) {
        skipped.push({ phone, reason: 'empty_ai_reply' })
        continue
      }

      const sendResult = await sendWhatsAppText({ to: phone, text: outboundText })

      await db.from(LOGS_TABLE).insert({
        wa_id: phone,
        lead_phone: phone,
        direction: 'outbound',
        message_body: outboundText,
        template_name: null,
        payload: {
          automated_nudge: true,
          nudge_type: 'reengagement_2h_24h',
          value_prop_used: ai.value_prop_used ?? null,
          send_result: sendResult,
        },
      })

      nudged.push({ phone, value_prop_used: ai.value_prop_used })
    } catch (error) {
      console.error('[reengagement] failed for lead', { phone, error })
      skipped.push({ phone, reason: 'send_or_ai_failed' })
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
