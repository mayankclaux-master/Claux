'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import QuickRepliesMenu from '@/components/QuickRepliesMenu'

type LeadItem = {
  phone_number: string
  full_name: string | null
  current_stage: string
  last_interaction_at: string | null
  interaction_count: number
  button_click_count: number
}

function normalizeMessages(items: MessageItem[]): MessageItem[] {
  return items.map((item) => ({
    ...item,
    direction: String(item.direction ?? '').trim().toLowerCase(),
    message_text: String(item.message_text ?? item.message_body ?? '').trim() || null,
    message_body: String(item.message_body ?? item.message_text ?? '').trim() || null,
  }))
}

function getLeadIntentState(thread: MessageItem[]): LeadIntentState {
  let demoLinkSeen = false
  let inboundAfterLink = 0

  for (const message of thread) {
    const direction = String(message.direction ?? '').toLowerCase()
    const text = String(message.message_text ?? message.message_body ?? '').toLowerCase()

    if (!demoLinkSeen && direction === 'outbound' && text.includes(DEMO_LINK)) {
      demoLinkSeen = true
      continue
    }

    if (demoLinkSeen && direction === 'inbound') {
      inboundAfterLink += 1
    }
  }

  if (!demoLinkSeen || inboundAfterLink === 0) return 'COLD'
  if (inboundAfterLink <= 3) return 'WARM'
  return 'HOT'
}

function isActiveWithin24h(value: string | null | undefined): boolean {
  if (!value) return false
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return false
  return Date.now() - timestamp < 24 * 60 * 60 * 1000
}

function getIntentBadge(intent: LeadIntentState): { background: string; color: string } {
  if (intent === 'HOT') return { background: '#FEE2E2', color: '#B91C1C' }
  if (intent === 'WARM') return { background: '#FEF3C7', color: '#B45309' }
  return { background: '#E2E8F0', color: '#334155' }
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

type MessageItem = {
  id?: string | number
  direction?: string | null
  message_text?: string | null
  message_body?: string | null
  template_name?: string | null
  created_at?: string | null
}

type CrmResponse = {
  leads: LeadItem[]
  selectedPhone: string
  messages: MessageItem[]
}

type QuickReplyItem = {
  id: string
  label: string
  content: string
}

type TemplateItem = {
  id?: string
  name: string
  language?: string
  category?: string
  previewText?: string
}

type LeadFilterKey = 'all' | 'hot' | 'new' | 'pipeline' | 'action' | 'converted'

const ADMIN_ID = 'mayank_admin'
const ADMIN_PASS = 'claux_war_room_2026'
const SESSION_KEY = 'claux_crm_session'

const BG = '#F4F7F9'
const SEA_GREEN = '#075E54'
const WA_GREEN = '#25D366'
const HOT_ORANGE = '#FF8C00'
const DEMO_LINK = 'claux.automizemedialabs.com/demo'

type LeadIntentState = 'COLD' | 'WARM' | 'HOT'

const QUICK_EMOJIS = ['😀', '👍', '🔥', '✅', '💬', '🚀', '🙂', '🎯']

const FILTER_PILLS: Array<{
  key: LeadFilterKey
  label: string
  accent: string
  background: string
  border: string
}> = [
  { key: 'all', label: 'All', accent: '#334155', background: '#F8FAFC', border: '#E2E8F0' },
  { key: 'hot', label: 'Hot (5+ clicks)', accent: '#C2410C', background: '#FFF7ED', border: '#FED7AA' },
  { key: 'new', label: 'New (Welcome)', accent: '#1D4ED8', background: '#EFF6FF', border: '#BFDBFE' },
  { key: 'pipeline', label: 'Pipeline (Demo/Offer)', accent: '#C2410C', background: '#FFF7ED', border: '#FED7AA' },
  { key: 'action', label: 'Action (Human Handoff)', accent: '#B91C1C', background: '#FEF2F2', border: '#FECACA' },
  { key: 'converted', label: 'Converted', accent: '#15803D', background: '#F0FDF4', border: '#BBF7D0' },
]

function fmtDate(value: string | null | undefined): string {
  if (!value) return 'No activity yet'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'No activity yet'
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function fmtRelativeTime(value: string | null | undefined): string {
  if (!value) return 'Inactive'
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Inactive'

  const deltaMs = Date.now() - timestamp
  if (deltaMs < 0) return 'Active just now'

  const mins = Math.floor(deltaMs / (60 * 1000))
  if (mins < 1) return 'Active just now'
  if (mins < 60) return `Active ${mins} min${mins === 1 ? '' : 's'} ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Active ${hours} hr${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `Active ${days} day${days === 1 ? '' : 's'} ago`
}

function templatePreview(templateName: string | null | undefined): string {
  const key = String(templateName ?? '').trim().toLowerCase()
  if (!key) return 'Sent: Template Message'

  const map: Record<string, string> = {
    claux_stage1_welcome: 'Sent: Welcome Message',
    claux_stage2_path_a: 'Sent: Demo Link',
    claux_stage2_path_b: 'Sent: Features Overview',
    claux_stage3_decision: 'Sent: Pricing',
    claux_stage4_path_a: 'Sent: Offer Price',
    claux_stage4_path_b: 'Sent: Human Handoff',
  }

  return map[key] || 'Sent: Template Message'
}

function messagePreview(message: MessageItem): string {
  const outbound = message.direction === 'outbound'
  const text = String(message.message_text ?? message.message_body ?? '').trim()

  if (outbound) {
    if (text) {
      return text
    }
    if (message.template_name) {
      return templatePreview(message.template_name)
    }
    return '[Sent message]'
  }

  if (text) {
    return text
  }

  return '[No inbound text]'
}

function getStageBadge(stage: string | null | undefined): { label: string; background: string; color: string } {
  const normalized = String(stage ?? '').trim().toLowerCase()

  if (normalized === 'welcome') return { label: 'welcome', background: '#DBEAFE', color: '#1D4ED8' }
  if (normalized === 'demo_sent') return { label: 'demo_sent', background: '#F3E8FF', color: '#7E22CE' }
  if (normalized === 'offer_sent') return { label: 'offer_sent', background: '#FFEDD5', color: '#C2410C' }
  if (normalized === 'converted') return { label: 'converted', background: '#DCFCE7', color: '#15803D' }
  if (normalized === 'human_handoff') return { label: 'human_handoff', background: '#FEE2E2', color: '#B91C1C' }

  return {
    label: normalized || 'unknown',
    background: '#E6F4EE',
    color: SEA_GREEN,
  }
}

export default function ClauxCrmPage() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const [leads, setLeads] = useState<LeadItem[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [selectedPhone, setSelectedPhone] = useState('')

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStage, setUpdatingStage] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [show24hActivity, setShow24hActivity] = useState(false)
  const [showHighIntentOnly, setShowHighIntentOnly] = useState(false)
  const [emojiPopoverPos, setEmojiPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [templatePopoverPos, setTemplatePopoverPos] = useState<{ top: number; left: number } | null>(null)

  const [quickReplies, setQuickReplies] = useState<QuickReplyItem[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null)
  const [leadMessagesByPhone, setLeadMessagesByPhone] = useState<Record<string, MessageItem[]>>({})

  const emojiTriggerRef = useRef<HTMLButtonElement | null>(null)
  const emojiPopoverRef = useRef<HTMLDivElement | null>(null)
  const templateTriggerRef = useRef<HTMLButtonElement | null>(null)
  const templatePopoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing === 'ok') setAuthed(true)
  }, [])

  const selectedLead = useMemo(() => leads.find((lead) => lead.phone_number === selectedPhone) ?? null, [leads, selectedPhone])

  const quickReplyQuery = useMemo(() => {
    const value = draft.trimStart()
    if (!value.startsWith('/')) return null
    return value.slice(1).trim().toLowerCase()
  }, [draft])

  const filteredQuickReplies = useMemo(() => {
    if (quickReplyQuery === null) return []
    if (!quickReplyQuery) return quickReplies.slice(0, 8)

    return quickReplies
      .filter((item) => {
        const target = `${item.label} ${item.content}`.toLowerCase()
        return target.includes(quickReplyQuery)
      })
      .slice(0, 8)
  }, [quickReplyQuery, quickReplies])

  const fetchCrm = async (phone = selectedPhone) => {
    setLoading(true)
    setError('')

    try {
      const endpoint = phone ? `/api/whatsapp/crm?phone=${encodeURIComponent(phone)}` : '/api/whatsapp/crm'
      const response = await fetch(endpoint, { cache: 'no-store' })
      const data = (await response.json().catch(() => ({}))) as Partial<CrmResponse> & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch CRM data.')
      }

      const nextLeads = Array.isArray(data.leads) ? data.leads : []
      const nextSelected = data.selectedPhone || phone || nextLeads[0]?.phone_number || ''
      const nextMessages = normalizeMessages(Array.isArray(data.messages) ? data.messages : [])

      setLeads(nextLeads)
      setSelectedPhone(nextSelected)
      setMessages(nextMessages)
      if (nextSelected) {
        setLeadMessagesByPhone((prev) => ({ ...prev, [nextSelected]: nextMessages }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CRM data.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTemplatePicker = async () => {
    if (showTemplatePicker) {
      setShowTemplatePicker(false)
      return
    }

    const rect = templateTriggerRef.current?.getBoundingClientRect()
    if (rect) {
      setTemplatePopoverPos({
        top: Math.max(12, rect.top - 320),
        left: Math.max(12, rect.left - 180),
      })
    }

    setShowTemplatePicker(true)

    if (templates.length) return

    setTemplatesLoading(true)
    try {
      const response = await fetch('/api/whatsapp/crm?mode=templates', { cache: 'no-store' })
      const data = (await response.json().catch(() => ({}))) as { templates?: TemplateItem[]; error?: string }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }
      setTemplates(Array.isArray(data.templates) ? data.templates : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setTemplatesLoading(false)
    }
  }

  useEffect(() => {
    if (!authed) return

    fetchCrm()
    const timer = window.setInterval(() => {
      fetchCrm(selectedPhone)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [authed, selectedPhone])

  useEffect(() => {
    if (!authed || !leads.length) return

    const missingPhones = leads.map((lead) => lead.phone_number).filter((phone) => !leadMessagesByPhone[phone])
    if (!missingPhones.length) return

    let cancelled = false

    const hydrateLeadThreads = async () => {
      const chunkSize = 8
      for (let i = 0; i < missingPhones.length; i += chunkSize) {
        const chunk = missingPhones.slice(i, i + chunkSize)
        const results = await Promise.all(
          chunk.map(async (phone) => {
            try {
              const response = await fetch(`/api/whatsapp/crm?phone=${encodeURIComponent(phone)}`, { cache: 'no-store' })
              const data = (await response.json().catch(() => ({}))) as Partial<CrmResponse>
              if (!response.ok) return { phone, messages: [] as MessageItem[] }
              return {
                phone,
                messages: normalizeMessages(Array.isArray(data.messages) ? data.messages : []),
              }
            } catch {
              return { phone, messages: [] as MessageItem[] }
            }
          })
        )

        if (cancelled) return

        setLeadMessagesByPhone((prev) => {
          const next = { ...prev }
          for (const result of results) {
            if (!next[result.phone]) {
              next[result.phone] = result.messages
            }
          }
          return next
        })
      }
    }

    hydrateLeadThreads()

    return () => {
      cancelled = true
    }
  }, [authed, leads, leadMessagesByPhone])

  useEffect(() => {
    if (!authed) return

    const fetchQuickReplies = async () => {
      try {
        const response = await fetch('/api/whatsapp/crm?mode=quick_replies', { cache: 'no-store' })
        const data = (await response.json().catch(() => ({}))) as { quickReplies?: QuickReplyItem[] }
        if (!response.ok) return
        setQuickReplies(Array.isArray(data.quickReplies) ? data.quickReplies : [])
      } catch {
      }
    }

    fetchQuickReplies()
  }, [authed])

  useEffect(() => {
    if (!showEmojiPicker && !showTemplatePicker) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node

      const inEmojiPopover = emojiPopoverRef.current?.contains(target)
      const inEmojiTrigger = emojiTriggerRef.current?.contains(target)
      const inTemplatePopover = templatePopoverRef.current?.contains(target)
      const inTemplateTrigger = templateTriggerRef.current?.contains(target)

      if (inEmojiPopover || inEmojiTrigger || inTemplatePopover || inTemplateTrigger) return

      setShowEmojiPicker(false)
      setShowTemplatePicker(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [showEmojiPicker, showTemplatePicker])

  const leadIntentByPhone = useMemo(() => {
    const intentMap = new Map<string, LeadIntentState>()

    for (const lead of leads) {
      const phone = lead.phone_number
      const thread = phone === selectedPhone ? messages : leadMessagesByPhone[phone] ?? []
      intentMap.set(phone, getLeadIntentState(thread))
    }

    return intentMap
  }, [leads, selectedPhone, messages, leadMessagesByPhone])

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const byFilter = leads.filter((lead) => {
      const intent = leadIntentByPhone.get(lead.phone_number) ?? 'COLD'
      if (showHighIntentOnly && intent !== 'HOT') return false
      if (show24hActivity && !isActiveWithin24h(lead.last_interaction_at)) return false
      return true
    })

    const filtered = query
      ? byFilter.filter((lead) => {
          const phone = lead.phone_number.toLowerCase()
          const name = String(lead.full_name ?? '').toLowerCase()
          return phone.includes(query) || name.includes(query)
        })
      : byFilter

    return [...filtered].sort((a, b) => {
      const aTime = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0
      const bTime = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0
      if (aTime !== bTime) return bTime - aTime

      return (b.interaction_count || 0) - (a.interaction_count || 0)
    })
  }, [leads, searchQuery, show24hActivity, showHighIntentOnly, leadIntentByPhone])

  const selectedLeadWithin24h = useMemo(() => isActiveWithin24h(selectedLead?.last_interaction_at), [selectedLead])

  const exportFilteredLeadsCsv = () => {
    const header = ['Name', 'Phone', 'Calculated State', 'Last Active']
    const rows = filteredLeads.map((lead) => {
      const displayName = String(lead.full_name ?? '').trim() || lead.phone_number
      const state = leadIntentByPhone.get(lead.phone_number) ?? 'COLD'
      const lastActive = fmtDate(lead.last_interaction_at)
      return [displayName, lead.phone_number, state, lastActive]
    })

    const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `claux-crm-leads-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (userId.trim() === ADMIN_ID && password === ADMIN_PASS) {
      setAuthed(true)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_KEY, 'ok')
      }
      setError('')
      return
    }

    setError('Invalid admin credentials.')
  }

  const handleSend = async () => {
    const text = draft.trim()
    const templateToSend = selectedTemplate
    if (!selectedPhone || sending) return
    if (!templateToSend && !text) return

    setSending(true)
    setError('')
    setWarning('')

    try {
      const payload = templateToSend
        ? {
            phone_number: selectedPhone,
            type: 'template',
            template_name: templateToSend.name,
            language_code: templateToSend.language || 'en',
          }
        : {
            phone_number: selectedPhone,
            type: 'text',
            text,
          }

      const response = await fetch('/api/whatsapp/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string; requires_template?: boolean }
      if (!response.ok) {
        if (!templateToSend && response.status === 409 && data.requires_template) {
          setWarning(data.error || 'Last user message is older than 24 hours. Use a template.')
          return
        }
        throw new Error(data.error || 'Failed to send message.')
      }

      setDraft('')
      setSelectedTemplate(null)
      setShowTemplatePicker(false)
      await fetchCrm(selectedPhone)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const updateStage = async (nextStage: string) => {
    if (!selectedPhone || updatingStage) return

    setUpdatingStage(true)
    setError('')

    try {
      const response = await fetch('/api/whatsapp/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: selectedPhone, current_stage: nextStage }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update stage.')
      }

      await fetchCrm(selectedPhone)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage.')
    } finally {
      setUpdatingStage(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border p-6 shadow-sm" style={{ borderColor: '#D7E4E0', background: '#FFFFFF' }}>
          <h1 className="text-xl font-semibold" style={{ color: SEA_GREEN }}>
            CLAUX CRM Access
          </h1>
          <p className="text-sm mt-1 mb-5" style={{ color: '#4B5563' }}>
            Enter war room credentials
          </p>

          <div className="space-y-3">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Admin ID"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#D1D5DB' }}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#D1D5DB' }}
            />
          </div>

          {error && (
            <p className="text-sm mt-3" style={{ color: HOT_ORANGE }}>
              {error}
            </p>
          )}

          <button type="submit" className="w-full mt-5 rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: SEA_GREEN }}>
            Enter CRM
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="h-screen flex" style={{ background: BG, fontFamily: 'Inter, sans-serif' }}>
      <aside className="w-full max-w-sm border-r flex flex-col" style={{ borderColor: '#DCE3EA', background: '#F8FBFD' }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: '#DCE3EA' }}>
          <h2 className="text-base font-semibold" style={{ color: SEA_GREEN }}>
            CLAUX CRM
          </h2>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            Leads ({filteredLeads.length})
          </p>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone number"
            className="mt-3 w-full rounded-lg border px-3 py-2 text-xs outline-none"
            style={{ borderColor: '#D1D5DB' }}
          />

          <div className="mt-4 rounded-lg border p-3" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>
              Activity Filters
            </p>
            <label className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#334155' }}>
              <input type="checkbox" checked={show24hActivity} onChange={(e) => setShow24hActivity(e.target.checked)} />
              Show 24h Activity
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#334155' }}>
              <input type="checkbox" checked={showHighIntentOnly} onChange={(e) => setShowHighIntentOnly(e.target.checked)} />
              Show High Intent (HOT)
            </label>

            <button
              type="button"
              onClick={exportFilteredLeadsCsv}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: '#CBD5E1', background: '#F8FAFC', color: '#0F172A' }}
            >
              Export to CSV
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-3 py-3 space-y-2">
          {filteredLeads.map((lead) => {
            const active = selectedPhone === lead.phone_number
            const displayName = lead.full_name || lead.phone_number
            const stageBadge = getStageBadge(lead.current_stage)
            const intent = leadIntentByPhone.get(lead.phone_number) ?? 'COLD'
            const intentBadge = getIntentBadge(intent)

            return (
              <button
                key={lead.phone_number}
                onClick={() => setSelectedPhone(lead.phone_number)}
                className="w-full text-left px-4 py-3 rounded-xl border"
                style={{
                  borderColor: active ? '#86EFAC' : '#DCE3EA',
                  background: '#FFFFFF',
                  boxShadow: active ? '0 0 0 1px #86EFAC' : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold tracking-tight" style={{ color: '#0F172A' }}>
                    {displayName}
                  </p>
                  <span
                    className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                    style={{ background: '#DCFCE7', color: SEA_GREEN }}
                  >
                    {lead.interaction_count || 0}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {lead.phone_number}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: intentBadge.background, color: intentBadge.color }}>
                    {intent}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: stageBadge.background, color: stageBadge.color }}>
                    {stageBadge.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: '#6B7280' }}>
                    {fmtDate(lead.last_interaction_at)}
                  </span>
                </div>
              </button>
            )
          })}

          {!filteredLeads.length && (
            <p className="px-4 py-6 text-sm" style={{ color: '#6B7280' }}>
              No matching leads.
            </p>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#DCE3EA', background: '#FFFFFF' }}>
          <div>
            <h3 className="text-lg font-bold tracking-tight" style={{ color: '#0F172A' }}>
              {selectedLead?.full_name || selectedPhone || 'Select a lead'}
            </h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {selectedLead?.phone_number || ''}
            </p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#E6F4EE', color: SEA_GREEN }}>
                Button Clicks: {selectedLead?.button_click_count || 0}
              </span>
              <span className="text-[11px]" style={{ color: '#6B7280' }}>
                {fmtRelativeTime(selectedLead?.last_interaction_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateStage('Hot')}
              disabled={!selectedPhone || updatingStage}
              className="px-3 py-1.5 text-xs rounded-lg text-white disabled:opacity-50"
              style={{ background: HOT_ORANGE }}
            >
              Mark Hot
            </button>
            <button
              onClick={() => updateStage('Converted')}
              disabled={!selectedPhone || updatingStage}
              className="px-3 py-1.5 text-xs rounded-lg text-white disabled:opacity-50"
              style={{ background: SEA_GREEN }}
            >
              Mark Converted
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((message, idx) => {
            const outbound = message.direction === 'outbound'
            const text = messagePreview(message)

            return (
              <div key={`${message.id ?? idx}-${message.created_at ?? ''}`} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[70%] rounded-2xl px-3 py-2 text-sm"
                  style={{
                    background: outbound ? WA_GREEN : '#FFFFFF',
                    color: outbound ? '#FFFFFF' : '#0F172A',
                    border: outbound ? 'none' : '1px solid #E2E8F0',
                  }}
                >
                  <p>{text}</p>
                  <p className="text-[10px] mt-1 opacity-80">{fmtDate(message.created_at)}</p>
                </div>
              </div>
            )
          })}

          {!messages.length && (
            <p className="text-sm" style={{ color: '#6B7280' }}>
              No messages yet.
            </p>
          )}
        </div>

        <div className="border-t px-5 py-3" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
          {warning && (
            <p className="text-xs mb-2" style={{ color: HOT_ORANGE }}>
              {warning}
            </p>
          )}
          {error && (
            <p className="text-xs mb-2" style={{ color: '#DC2626' }}>
              {error}
            </p>
          )}

          {selectedTemplate && (
            <div className="mb-2 rounded-lg border px-3 py-2" style={{ borderColor: '#CFE8E1', background: '#F7FCFA' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold" style={{ color: SEA_GREEN }}>
                  Template Preview: {selectedTemplate.name}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="text-xs"
                  style={{ color: '#6B7280' }}
                >
                  Clear
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: '#4B5563' }}>
                {selectedTemplate.previewText || 'Template message will be sent as approved in Meta.'}
              </p>
            </div>
          )}

          <div className="relative">
            <QuickRepliesMenu
              open={quickReplyQuery !== null}
              items={filteredQuickReplies}
              onSelect={(item) => {
                setDraft(item.content)
              }}
            />

            <div className="flex items-end gap-2 rounded-xl border p-2" style={{ borderColor: '#D7E4E0', background: '#FFFFFF' }}>
              <div className="relative">
              <button
                ref={emojiTriggerRef}
                onClick={() => {
                  if (showEmojiPicker) {
                    setShowEmojiPicker(false)
                    return
                  }

                  const rect = emojiTriggerRef.current?.getBoundingClientRect()
                  if (rect) {
                    setEmojiPopoverPos({
                      top: Math.max(12, rect.top - 146),
                      left: Math.max(12, rect.left),
                    })
                  }
                  setShowEmojiPicker(true)
                }}
                className="h-10 w-10 rounded-lg border text-lg"
                style={{ borderColor: '#D1D5DB', background: '#FFFFFF' }}
                type="button"
              >
                🙂
              </button>
              {showEmojiPicker && (
                <div
                  ref={emojiPopoverRef}
                  className="fixed rounded-lg border p-2 grid grid-cols-4 gap-1 shadow-sm"
                  style={{
                    borderColor: '#E5E7EB',
                    background: '#FFFFFF',
                    top: emojiPopoverPos?.top ?? 12,
                    left: emojiPopoverPos?.left ?? 12,
                    zIndex: 80,
                  }}
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setDraft((prev) => `${prev}${emoji}`)
                        setShowEmojiPicker(false)
                      }}
                      className="h-8 w-8 rounded hover:bg-slate-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

              <div className="relative">
                <button
                  ref={templateTriggerRef}
                  onClick={toggleTemplatePicker}
                  className="h-10 w-10 rounded-lg border text-base"
                  style={{ borderColor: '#D1D5DB', background: '#FFFFFF' }}
                  type="button"
                  title="Send Template"
                >
                  📄
                </button>
                {showTemplatePicker && (
                  <div
                    ref={templatePopoverRef}
                    className="fixed w-80 rounded-lg border shadow-sm"
                    style={{
                      borderColor: '#E5E7EB',
                      background: '#FFFFFF',
                      top: templatePopoverPos?.top ?? 12,
                      left: templatePopoverPos?.left ?? 12,
                      zIndex: 85,
                    }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
                      <p className="text-xs font-semibold" style={{ color: SEA_GREEN }}>
                        Approved Templates
                      </p>
                      <p className="text-[11px]" style={{ color: '#6B7280' }}>
                        Showing all approved Meta templates.
                      </p>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-1">
                      {templatesLoading && (
                        <p className="px-2 py-2 text-xs" style={{ color: '#6B7280' }}>
                          Loading templates...
                        </p>
                      )}
                      {!templatesLoading && !templates.length && (
                        <p className="px-2 py-2 text-xs" style={{ color: '#6B7280' }}>
                          No eligible templates found.
                        </p>
                      )}
                      {!templatesLoading &&
                        templates.map((template) => (
                          <button
                            key={`${template.id ?? template.name}-${template.language ?? ''}`}
                            type="button"
                            onClick={() => {
                              setSelectedTemplate(template)
                              setShowTemplatePicker(false)
                            }}
                            className="w-full text-left rounded-md px-2 py-2 hover:bg-slate-50"
                          >
                            <p className="text-xs font-semibold" style={{ color: '#0F172A' }}>
                              {template.name}
                            </p>
                            <p className="text-[11px]" style={{ color: '#6B7280' }}>
                              {(template.category || 'UTILITY').toUpperCase()} • {(template.language || 'en').toLowerCase()}
                            </p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: '#4B5563' }}>
                              {template.previewText || 'No preview text'}
                            </p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type message... (use / for quick replies)"
                rows={2}
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: '#D1D5DB' }}
              />

              <button
                onClick={handleSend}
                disabled={!selectedPhone || (!draft.trim() && !selectedTemplate) || sending}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: SEA_GREEN }}
                type="button"
              >
                {sending ? 'Sending…' : selectedTemplate ? 'Send Template' : 'Send'}
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px]" style={{ color: '#6B7280' }}>
              Sends as text only if user messaged in last 24h.
            </p>
            {selectedLeadWithin24h && (
              <p className="text-[11px]" style={{ color: SEA_GREEN }}>
                24h window active: message + template controls available.
              </p>
            )}
            {loading && (
              <p className="text-[11px]" style={{ color: SEA_GREEN }}>
                Refreshing…
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
