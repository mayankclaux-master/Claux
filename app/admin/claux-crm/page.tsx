'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

type LeadItem = {
  phone_number: string
  full_name: string | null
  current_stage: string
  last_interaction_at: string | null
  interaction_count: number
  button_click_count: number
}

type MessageItem = {
  id?: string | number
  direction?: string | null
  message_body?: string | null
  template_name?: string | null
  created_at?: string | null
}

type CrmResponse = {
  leads: LeadItem[]
  selectedPhone: string
  messages: MessageItem[]
}

const ADMIN_ID = 'mayank_admin'
const ADMIN_PASS = 'claux_war_room_2026'
const SESSION_KEY = 'claux_crm_session'

const BG = '#F8FAFC'
const SEA_GREEN = '#075E54'
const WA_GREEN = '#25D366'
const HOT_ORANGE = '#FF8C00'

const QUICK_EMOJIS = ['😀', '👍', '🔥', '✅', '💬', '🚀', '🙂', '🎯']

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

  if (outbound) {
    if (message.message_body && message.message_body.trim()) {
      return message.message_body.trim()
    }
    if (message.template_name) {
      return templatePreview(message.template_name)
    }
    return '[Sent message]'
  }

  if (message.message_body && message.message_body.trim()) {
    return message.message_body.trim()
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
  const [emojiPopoverPos, setEmojiPopoverPos] = useState<{ top: number; left: number } | null>(null)

  const emojiTriggerRef = useRef<HTMLButtonElement | null>(null)
  const emojiPopoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing === 'ok') setAuthed(true)
  }, [])

  const selectedLead = useMemo(() => leads.find((lead) => lead.phone_number === selectedPhone) ?? null, [leads, selectedPhone])

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

      setLeads(nextLeads)
      setSelectedPhone(nextSelected)
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CRM data.')
    } finally {
      setLoading(false)
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
    if (!showEmojiPicker) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (emojiPopoverRef.current?.contains(target)) return
      if (emojiTriggerRef.current?.contains(target)) return
      setShowEmojiPicker(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [showEmojiPicker])

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim()
    const filtered = query
      ? leads.filter((lead) => lead.phone_number.toLowerCase().includes(query.toLowerCase()))
      : leads

    return [...filtered].sort((a, b) => {
      const aHot = (a.interaction_count || 0) > 5 ? 1 : 0
      const bHot = (b.interaction_count || 0) > 5 ? 1 : 0
      if (aHot !== bHot) return bHot - aHot

      const aTime = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0
      const bTime = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0
      if (aTime !== bTime) return bTime - aTime

      return (b.interaction_count || 0) - (a.interaction_count || 0)
    })
  }, [leads, searchQuery])

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
    if (!selectedPhone || !text || sending) return

    setSending(true)
    setError('')
    setWarning('')

    try {
      const response = await fetch('/api/whatsapp/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: selectedPhone, text }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string; requires_template?: boolean }
      if (!response.ok) {
        if (response.status === 409 && data.requires_template) {
          setWarning(data.error || 'Last user message is older than 24 hours. Use a template.')
          return
        }
        throw new Error(data.error || 'Failed to send message.')
      }

      setDraft('')
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
    <div className="h-screen flex" style={{ background: BG }}>
      <aside className="w-full max-w-sm border-r flex flex-col" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: '#E2E8F0' }}>
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
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredLeads.map((lead) => {
            const active = selectedPhone === lead.phone_number
            const hasHighInteractions = (lead.interaction_count || 0) > 5
            const displayName = lead.full_name || lead.phone_number
            const stageBadge = getStageBadge(lead.current_stage)

            return (
              <button
                key={lead.phone_number}
                onClick={() => setSelectedPhone(lead.phone_number)}
                className="w-full text-left px-4 py-3 border-b"
                style={{
                  borderColor: '#F1F5F9',
                  background: active ? '#E7F7EF' : '#FFFFFF',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-bold tracking-tight" style={{ color: hasHighInteractions ? HOT_ORANGE : '#0F172A' }}>
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
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: stageBadge.background, color: stageBadge.color }}>
                    {stageBadge.label}
                  </span>
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
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
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

          <div className="flex items-end gap-2">
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

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type message..."
              rows={2}
              className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: '#D1D5DB' }}
            />

            <button
              onClick={handleSend}
              disabled={!selectedPhone || !draft.trim() || sending}
              className="h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: SEA_GREEN }}
              type="button"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px]" style={{ color: '#6B7280' }}>
              Sends as text only if user messaged in last 24h.
            </p>
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
