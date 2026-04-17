import { createClient } from '@supabase/supabase-js'
import { after, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { sendWhatsAppText } from '@/lib/whatsapp/meta-api'

type InboundMessage = {
  id?: string
  from?: string
  type?: string
  text?: { body?: string }
  referral?: {
    source_id?: string
    ad_id?: string
    source_type?: string
    source_url?: string
    headline?: string
    body?: string
    media_type?: string
    ctwa_clid?: string
  }
  location?: {
    latitude?: number
    longitude?: number
    name?: string
    address?: string
  }
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
  payload?: unknown
}

type ClaudeAgentOutput = {
  reply_text: string
  needs_human_handoff: boolean
  call_intelligence_notes?: string
}

const LEADS_TABLE = 'wa_seo_leads'
const LOGS_TABLE = 'wa_seo_logs'
const PROCESSED_WEBHOOKS_TABLE = 'processed_webhooks'

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

  const locationName = String(message.location?.name ?? '').trim()
  const locationAddress = String(message.location?.address ?? '').trim()
  if (locationName || locationAddress || message.type === 'location') {
    return `Shared location: ${locationName || locationAddress || 'Location received'}`
  }

  const buttonText = message.button?.text?.trim() || prettifyButtonLabel(message.button?.payload)
  if (buttonText) return buttonText

  const interactiveTitle =
    message.interactive?.button_reply?.title?.trim() ||
    prettifyButtonLabel(message.interactive?.button_reply?.id) ||
    message.interactive?.list_reply?.title?.trim() ||
    prettifyButtonLabel(message.interactive?.list_reply?.id)

  return interactiveTitle || ''
}

function hasUrl(text: string): boolean {
  return /(https?:\/\/\S+|www\.\S+)/i.test(String(text ?? '').trim())
}

function isLocationShared(message: InboundMessage): boolean {
  return Boolean(message.location) || String(message.type ?? '').toLowerCase() === 'location'
}

function normalizeForSimilarity(value: string): string[] {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function similarityRatio(a: string, b: string): number {
  const aTokens = new Set(normalizeForSimilarity(a))
  const bTokens = new Set(normalizeForSimilarity(b))
  if (!aTokens.size || !bTokens.size) return 0

  let intersection = 0
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1
  }

  const union = new Set([...aTokens, ...bTokens]).size
  if (!union) return 0
  return intersection / union
}

function isTooSimilarToRecentOutbound(candidate: string, recentOutbounds: string[]): boolean {
  return recentOutbounds.some((prev) => similarityRatio(candidate, prev) > 0.6)
}

function hasGenericOpener(text: string): boolean {
  return /^\s*(thanks|thank you|noted|okay|ok|sure|great|got it)\b/i.test(String(text ?? '').trim())
}

function extractMeaningfulTokens(text: string): string[] {
  const stopwords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'your',
    'have',
    'will',
    'you',
    'about',
    'just',
    'want',
    'need',
    'like',
    'are',
    'was',
    'were',
    'our',
    'can',
  ])

  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !stopwords.has(token))
}

function startsWithBusinessAssessment(replyText: string, inboundText: string): boolean {
  const firstSentence = String(replyText ?? '').trim().split(/[.!?\n]/)[0]?.toLowerCase() ?? ''
  if (!firstSentence) return false

  if (/(from what you shared|from your message|given your|for your|looking at your|based on your|i can see)/i.test(firstSentence)) {
    return true
  }

  const inboundTokens = extractMeaningfulTokens(inboundText).slice(0, 6)
  return inboundTokens.some((token) => firstSentence.includes(token))
}

type ConversionMilestone = 'work_hours_edge' | 'demo_video' | 'roi_anchor' | 'none'

function detectMilestone(text: string): ConversionMilestone {
  const value = String(text ?? '').toLowerCase()
  if (!value) return 'none'

  if (/(2400|2,400|300\s*hours|100\+\s*sop|work-hour edge|execution edge)/i.test(value)) return 'work_hours_edge'
  if (/(watch demo|demo|5 minute ka demo|live demo)/i.test(value)) return 'demo_video'
  if (/(2\.1\s*lakh|save|saving|₹\s*7,499|roi)/i.test(value)) return 'roi_anchor'
  return 'none'
}

function nextMilestone(milestone: ConversionMilestone): ConversionMilestone {
  if (milestone === 'work_hours_edge') return 'demo_video'
  if (milestone === 'demo_video') return 'roi_anchor'
  return 'none'
}

function buildMilestoneGuard(recentOutbounds: string[]): { forbidden: ConversionMilestone; forced: ConversionMilestone } {
  const counts = new Map<ConversionMilestone, number>()
  for (const message of recentOutbounds) {
    const milestone = detectMilestone(message)
    if (milestone === 'none') continue
    counts.set(milestone, (counts.get(milestone) ?? 0) + 1)
  }

  for (const milestone of ['work_hours_edge', 'demo_video', 'roi_anchor'] as ConversionMilestone[]) {
    if ((counts.get(milestone) ?? 0) >= 2) {
      return { forbidden: milestone, forced: nextMilestone(milestone) }
    }
  }

  return { forbidden: 'none', forced: 'none' }
}

function mentionsMilestone(text: string, milestone: ConversionMilestone): boolean {
  if (milestone === 'none') return false
  return detectMilestone(text) === milestone
}

function isFallbackOrRescueLog(log: ConversationLog): boolean {
  if (String(log.direction ?? '').toLowerCase() !== 'outbound') return false
  const payload = log.payload as Record<string, unknown> | null
  if (payload && typeof payload === 'object') {
    if (payload.rescue_mode === true) return true
    const reason = String(payload.reason ?? '').toLowerCase()
    if (reason.includes('fallback') || reason.includes('ai_provider')) return true
  }

  const body = String(log.message_body ?? '').toLowerCase()
  return body.includes('thanks for your message') || body.includes('i can help you with plans')
}

type VerticalProfile = {
  key: 'hospitality' | 'healthcare' | 'legal' | 'finance' | 'generic'
  roiInstruction: string
}

function detectVerticalProfile(inboundText: string, memoryLogs: ConversationLog[]): VerticalProfile {
  const corpus = [inboundText, ...memoryLogs.map((log) => String(log.message_body ?? ''))].join(' ').toLowerCase()

  if (/(hotel|resort|stay|homestay|villa|guest\s*house|hostel|booking\.com|makemytrip|mmt|ota)/i.test(corpus)) {
    return {
      key: 'hospitality',
      roiInstruction:
        'Use hospitality ROI framing: agencies cost money, OTAs (Booking/MMT) can take ~20% commission, and Claux SEO drives direct booking revenue.',
    }
  }

  if (/(doctor|clinic|hospital|dentist|physio|patient)/i.test(corpus)) {
    return {
      key: 'healthcare',
      roiInstruction: 'Use healthcare ROI framing: stronger local search visibility increases qualified patient inquiries and lowers dependency on paid ads.',
    }
  }

  if (/(lawyer|law firm|advocate|legal)/i.test(corpus)) {
    return {
      key: 'legal',
      roiInstruction: 'Use legal ROI framing: trust-first discoverability captures high-intent consultation demand and reduces referral volatility.',
    }
  }

  if (/(ca\b|chartered accountant|tax|gst|audit firm)/i.test(corpus)) {
    return {
      key: 'finance',
      roiInstruction: 'Use CA/finance ROI framing: predictable inbound around compliance seasons lowers acquisition cost and improves client quality.',
    }
  }

  return {
    key: 'generic',
    roiInstruction: 'Use role-specific business ROI framing, not generic claims.',
  }
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
    .select('direction, message_body, template_name, created_at, payload')
    .or(`lead_phone.eq.${waId},wa_id.eq.${waId}`)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) {
    console.error('[whatsapp-webhook] Failed fetching lead memory:', error)
    return []
  }

  const rows = (Array.isArray(data) ? data : []) as ConversationLog[]
  return rows.filter((row) => !isFallbackOrRescueLog(row)).reverse()
}

async function runManagedSalesAgent(phoneNumber: string, userMessage: string): Promise<ClaudeAgentOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing Anthropic configuration: ANTHROPIC_API_KEY')
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/agents/agent_011Ca8w3KeKPJ1xLuEC31FPR/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'managed-agents-2026-04-01',
      },
      body: JSON.stringify({
        metadata: {
          session_id: phoneNumber,
        },
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as {
      content?: Array<{ type?: string; text?: string }>
      output_text?: string
      output?: Array<{ type?: string; text?: string }>
      error?: { message?: string }
      message?: string
    }

    if (!response.ok) {
      const anthopicErrorMessage = payload?.error?.message || payload?.message || 'Managed Agent request failed.'
      console.error('[whatsapp-webhook] Managed Agent API non-OK response:', {
        status: response.status,
        message: anthopicErrorMessage,
      })
      throw new Error(anthopicErrorMessage)
    }

    const outputFromContent = (payload.content ?? [])
      .filter((item) => item?.type === 'text')
      .map((item) => String(item.text ?? ''))
      .join('\n')
      .trim()

    const outputFromOutput = (payload.output ?? [])
      .filter((item) => item?.type === 'text')
      .map((item) => String(item.text ?? ''))
      .join('\n')
      .trim()

    const textOutput = String(payload.output_text ?? '').trim() || outputFromContent || outputFromOutput

    if (!textOutput) {
      throw new Error('Managed Agent returned empty output.')
    }

    const parsed = parseClaudeOutput(textOutput)
    if (parsed) return parsed

    return {
      reply_text: textOutput,
      needs_human_handoff: false,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.error('[whatsapp-webhook] Managed Agent call failed:', reason)
    throw error
  }
}

async function runClaudeSalesAgent(input: {
  profileName?: string
  inboundText: string
  memoryLogs: ConversationLog[]
  latestMessageHasUrlOrLocation: boolean
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

  // Local prompting + manual-injection path is intentionally retired in favor of Anthropic Managed Agent.
  // const { salesManual, intelligenceManual } = await getTrainingManuals()
  // Similarity Shield and Milestone Pivot guards are disabled under managed-agent orchestration.
  return runManagedSalesAgent(String(input.profileName ?? '').trim() || 'unknown', input.inboundText)
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

function runInBackground(taskFactory: () => Promise<void>): void {
  const runTask = async () => {
    try {
      await taskFactory()
    } catch (error) {
      console.error('[whatsapp-webhook] background task failed:', error)
    }
  }

  try {
    after(runTask)
    return
  } catch {
    console.warn('[whatsapp-webhook] next.after unavailable, falling back to waitUntil/direct execution')
  }

  const globalWaitUntil = (globalThis as { waitUntil?: (promise: Promise<unknown>) => void }).waitUntil
  if (typeof globalWaitUntil === 'function') {
    globalWaitUntil(runTask())
    return
  }

  void runTask()
}

async function markWebhookProcessed(
  db: any,
  input: { messageId: string; waId: string; payload: unknown }
): Promise<'updated' | 'missing' | 'error'> {
  const { data, error } = await db
    .from(PROCESSED_WEBHOOKS_TABLE)
    .update({
      wa_id: input.waId,
      payload: input.payload,
      processed_at: new Date().toISOString(),
    })
    .eq('message_id', input.messageId)
    .select('message_id')
    .maybeSingle()

  if (error) {
    console.error('[whatsapp-webhook] processed_webhooks update failed:', error)
    return 'error'
  }

  if (!data) return 'missing'
  return 'updated'
}

async function claimWebhookProcessing(
  db: any,
  input: { messageId: string; waId: string; payload: unknown }
): Promise<'claimed' | 'duplicate' | 'error'> {
  const { error } = await db.from(PROCESSED_WEBHOOKS_TABLE).insert({
    message_id: input.messageId,
    wa_id: input.waId,
    payload: {
      status: 'processing',
      lock_created_at: new Date().toISOString(),
      raw: input.payload,
    },
    processed_at: new Date().toISOString(),
  })

  if (!error) return 'claimed'
  if (String((error as { code?: string }).code ?? '') === '23505') return 'duplicate'

  console.error('[whatsapp-webhook] processed_webhooks lock insert failed:', error)
  return 'error'
}

async function processWebhookEvents(db: any, events: WebhookMessageEvent[]): Promise<void> {
  for (const event of events) {
    const { message, profileName, valuePayload } = event
    const waId = String(message.from ?? '').trim()
    const messageId = String(message.id ?? '').trim()
    if (!waId) {
      console.log('[whatsapp-webhook][trace] webhook:event-skipped-no-waid')
      continue
    }

    const inboundDirection = 'inbound'
    const inboundText = getInboundText(message)
    const highIntentFromUrlOrLocation = hasUrl(inboundText) || isLocationShared(message)
    const referral = message.referral
    const hasMetaAdReferral = Boolean(referral && typeof referral === 'object')
    const adId = hasMetaAdReferral
      ? String(referral?.ad_id ?? referral?.source_id ?? '').trim() || null
      : null
    console.log('[whatsapp-webhook][trace] webhook:event-start', {
      waId,
      messageType: message.type ?? 'unknown',
      messageId: messageId || null,
      hasInboundText: Boolean(inboundText),
      inboundLength: inboundText.length,
      highIntentFromUrlOrLocation,
      hasMetaAdReferral,
      adId,
      profileName: profileName ?? null,
    })

    const leadMetadata = {
      message_id: message.id ?? null,
      message_type: message.type ?? 'unknown',
      last_inbound_text: inboundText || null,
      high_intent: highIntentFromUrlOrLocation,
      source: hasMetaAdReferral ? 'Meta Ad' : 'WhatsApp',
      lead_status: hasMetaAdReferral ? 'New (Welcome)' : 'welcome',
      ad_id: adId,
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

      // const ai = await runClaudeSalesAgent({
      //   profileName,
      //   inboundText,
      //   memoryLogs,
      //   latestMessageHasUrlOrLocation: highIntentFromUrlOrLocation,
      // })
      const ai = await runManagedSalesAgent(waId, inboundText)

      const forcedHighIntentReply =
        "Got the link! I'm sharing this with Mayank ji right now so he can prepare your custom 200-point audit."
      const needsHumanHandoff = ai.needs_human_handoff || highIntentFromUrlOrLocation
      const outboundText = String(highIntentFromUrlOrLocation ? forcedHighIntentReply : ai.reply_text ?? '').trim()
      const callNotes = String(ai.call_intelligence_notes ?? '').trim()
      const handoffNotes = highIntentFromUrlOrLocation
        ? [
            'Context Brief: Lead shared a URL/location signal and is high-intent for audit-level conversation.',
            'Call Strategy: Open with gratitude for the asset shared, confirm quick review findings, and move to a strategy call with Mayank ji.',
            'Closing Tip: Lock a specific call slot and ask one qualifying business-goal question.',
          ].join('\n')
        : callNotes

      if (needsHumanHandoff) {
        await ensureLeadAndStage(
          db,
          waId,
          'human_handoff',
          {
            ...leadMetadata,
            handover_at: new Date().toISOString(),
            high_intent: highIntentFromUrlOrLocation,
            handoff_reason: highIntentFromUrlOrLocation ? 'url_or_location_shared' : 'ai_handoff',
          },
          profileName
        )
        if (handoffNotes) {
          await saveCallIntelligenceNotes(db, waId, handoffNotes)
        }
      }

      if (!outboundText) {
        console.log('[whatsapp-webhook][trace] ai-flow:skip-send-empty-reply', { waId })
        continue
      }

      const sendResult = await sendWhatsAppText({ to: waId, text: outboundText })
      await logToWaSeo(db, {
        waId,
        direction: 'outbound',
        messageText: outboundText,
        payloadData: sendResult,
      })

      if (messageId) {
        await markWebhookProcessed(db, {
          messageId,
          waId,
          payload: sendResult,
        })
      }
    } catch (error) {
      console.error('[whatsapp-webhook] AI response flow failed:', error)
      const rescueReply = highIntentFromUrlOrLocation
        ? "Got the link! I'm sharing this with Mayank ji right now so he can prepare your custom 200-point audit."
        : "Hi, I'm Pooja. I'm analyzing your business details to see how our 9 AI agents can scale your growth. What is your primary goal for this month?"

      await ensureLeadAndStage(
        db,
        waId,
        'human_handoff',
        {
          ...leadMetadata,
          handover_at: new Date().toISOString(),
          high_intent: highIntentFromUrlOrLocation,
          handoff_reason: highIntentFromUrlOrLocation ? 'url_or_location_shared' : 'ai_provider_fallback',
        },
        profileName
      )

      const sendResult = await sendWhatsAppText({ to: waId, text: rescueReply })
      await logToWaSeo(db, {
        waId,
        direction: 'outbound',
        messageText: rescueReply,
        payloadData: {
          rescue_mode: true,
          reason: 'ai_provider_unavailable',
          send_result: sendResult,
        },
      })

      if (messageId) {
        await markWebhookProcessed(db, {
          messageId,
          waId,
          payload: sendResult,
        })
      }
    }
  }
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

  const events = getWebhookMessages(body)
  for (const event of events) {
    const messageId = String(event.message.id ?? '').trim()
    if (!messageId) continue

    const waId = String(event.message.from ?? '').trim()
    const lockState = await claimWebhookProcessing(db, {
      messageId,
      waId,
      payload: event.valuePayload ?? event.message,
    })

    if (lockState === 'duplicate') {
      return NextResponse.json({ success: true, deduped: true })
    }
  }

  runInBackground(() => processWebhookEvents(db, events))
  return NextResponse.json({ success: true })
}
