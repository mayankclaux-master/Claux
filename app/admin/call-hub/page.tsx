'use client'

import { useEffect, useMemo, useState } from 'react'

type HandoffLead = {
  phone_number: string
  full_name: string | null
  current_stage: string
  call_intelligence_notes?: string | null
  handover_at?: string | null
  last_interaction_at: string | null
  interaction_count: number
}

type HandoffMessage = {
  id?: string | number
  direction?: string | null
  message_body?: string | null
  template_name?: string | null
  created_at?: string | null
}

type HandoffDetailResponse = {
  lead: {
    phone_number: string
    full_name: string | null
    current_stage: string
    call_intelligence_notes?: string | null
    handover_at?: string | null
  } | null
  messages: HandoffMessage[]
}

const BG = '#F8FAFC'
const SEA_GREEN = '#075E54'

function fmtDate(value: string | null | undefined): string {
  if (!value) return 'No activity yet'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'No activity yet'
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function parseNoteSections(notes: string | null | undefined): { context: string; strategy: string; closing: string } {
  const value = String(notes ?? '').trim()
  if (!value) {
    return {
      context: 'No context brief generated yet.',
      strategy: 'No call strategy generated yet.',
      closing: 'No closing tip generated yet.',
    }
  }

  const contextMatch = value.match(/context\s*brief\s*[:\-]\s*([\s\S]*?)(?=\n\s*(?:call\s*strategy|closing\s*tip)\s*[:\-]|$)/i)
  const strategyMatch = value.match(/call\s*strategy\s*[:\-]\s*([\s\S]*?)(?=\n\s*(?:closing\s*tip)\s*[:\-]|$)/i)
  const closingMatch = value.match(/closing\s*tip\s*[:\-]\s*([\s\S]*?)$/i)

  return {
    context: contextMatch?.[1]?.trim() || 'No context brief generated yet.',
    strategy: strategyMatch?.[1]?.trim() || 'Use the lead context to position a clear ROI-first call hook.',
    closing: closingMatch?.[1]?.trim() || 'Confirm next step and lock a specific follow-up action.',
  }
}

export default function CallHubPage() {
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [leads, setLeads] = useState<HandoffLead[]>([])
  const [updatingPhone, setUpdatingPhone] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [timeRange, setTimeRange] = useState<'today' | '7d'>('today')
  const [selectedPhone, setSelectedPhone] = useState('')
  const [detail, setDetail] = useState<HandoffDetailResponse | null>(null)

  const fetchHandoffLeads = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/whatsapp/crm?mode=handoff&time_range=${timeRange}`, { cache: 'no-store' })
      const data = (await response.json().catch(() => ({}))) as { leads?: HandoffLead[]; error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch handoff leads.')
      }

      setLeads(Array.isArray(data.leads) ? data.leads : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch handoff leads.')
    } finally {
      setLoading(false)
    }
  }

  const fetchHandoffDetail = async (phoneNumber: string) => {
    if (!phoneNumber) return

    setSelectedPhone(phoneNumber)
    setDetailLoading(true)
    setDetailError('')

    try {
      const response = await fetch(`/api/whatsapp/crm?mode=handoff_detail&phone=${encodeURIComponent(phoneNumber)}`, { cache: 'no-store' })
      const data = (await response.json().catch(() => ({}))) as HandoffDetailResponse & { error?: string }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load lead details.')
      }

      setDetail({
        lead: data.lead ?? null,
        messages: Array.isArray(data.messages) ? data.messages : [],
      })
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load lead details.')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    void fetchHandoffLeads()

    const handleVisibility = () => {
      if (!document.hidden) {
        void fetchHandoffLeads()
      }
    }

    const handleFocus = () => {
      void fetchHandoffLeads()
    }

    const timer = window.setInterval(fetchHandoffLeads, 8000)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [timeRange])

  const markConverted = async (phoneNumber: string) => {
    if (!phoneNumber || updatingPhone) return

    setUpdatingPhone(phoneNumber)
    setError('')

    try {
      const response = await fetch('/api/whatsapp/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, current_stage: 'Converted' }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark lead as converted.')
      }

      await fetchHandoffLeads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark lead as converted.')
    } finally {
      setUpdatingPhone('')
    }
  }

  const orderedLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (debugMode) return true
        return String(lead.current_stage ?? '').trim().toLowerCase() === 'human_handoff'
      })
      .sort((a, b) => {
      const aTime = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0
      const bTime = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0
      return bTime - aTime
    })
  }, [leads, debugMode])

  return (
    <div className="min-h-screen px-4 py-6 md:px-8" style={{ background: BG }}>
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border px-5 py-4" style={{ borderColor: '#D7E4E0', background: '#FFFFFF' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: SEA_GREEN }}>
                Sales Command · Call Intelligence Hub
              </h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Human handoff queue with AI briefing notes
              </p>
            </div>

            <button
              type="button"
              onClick={fetchHandoffLeads}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
              style={{ background: SEA_GREEN }}
            >
              Refresh Queue
            </button>

            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value === '7d' ? '7d' : 'today')}
              className="rounded-lg border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: '#CBD5E1', color: '#0F172A', background: '#FFFFFF' }}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
            </select>

            <button
              type="button"
              onClick={() => setDebugMode((prev) => !prev)}
              className="rounded-lg border px-3 py-2 text-xs font-semibold"
              style={{
                borderColor: '#CBD5E1',
                color: debugMode ? '#991B1B' : '#1E293B',
                background: debugMode ? '#FEE2E2' : '#FFFFFF',
              }}
            >
              {debugMode ? 'Debug Mode: ON (All Leads)' : 'Debug Mode: OFF'}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: '#6B7280' }}>
            <span>Open Calls: {orderedLeads.length}</span>
            {loading && <span style={{ color: SEA_GREEN }}>Refreshing…</span>}
            {error && <span style={{ color: '#DC2626' }}>{error}</span>}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {orderedLeads.map((lead) => {
            const notes = parseNoteSections(lead.call_intelligence_notes)

            return (
              <article
                key={lead.phone_number}
                className="rounded-2xl border bg-white p-4 shadow-sm"
                onClick={() => {
                  void fetchHandoffDetail(lead.phone_number)
                }}
                style={{
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>
                      {lead.full_name || lead.phone_number}
                    </h2>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {lead.phone_number}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: '#64748B' }}>
                      Last Active: {fmtDate(lead.last_interaction_at)}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: '#64748B' }}>
                      Handover At: {fmtDate(lead.handover_at ?? null)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: '#F1F5F9', color: '#334155' }}>
                      Interactions: {lead.interaction_count || 0}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <section className="rounded-lg border p-3" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#1E293B' }}>
                      Context Brief
                    </p>
                    <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#334155' }}>
                      {notes.context}
                    </p>
                  </section>

                  <section className="rounded-lg border p-3" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#1E293B' }}>
                      Call Strategy
                    </p>
                    <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#334155' }}>
                      {notes.strategy}
                    </p>
                  </section>

                  <section className="rounded-lg border p-3" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#1E293B' }}>
                      Closing Tip
                    </p>
                    <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#334155' }}>
                      {notes.closing}
                    </p>
                  </section>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`tel:${lead.phone_number}`}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: '#EA580C' }}
                  >
                    Call Now
                  </a>

                  <button
                    type="button"
                    onClick={() => markConverted(lead.phone_number)}
                    disabled={updatingPhone === lead.phone_number}
                    onMouseDown={(event) => event.stopPropagation()}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: SEA_GREEN }}
                  >
                    {updatingPhone === lead.phone_number ? 'Updating…' : 'Mark Converted'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {!orderedLeads.length && !loading && (
          <div className="mt-5 rounded-xl border px-4 py-8 text-center text-sm" style={{ borderColor: '#E2E8F0', background: '#FFFFFF', color: '#6B7280' }}>
            No leads in human handoff queue.
          </div>
        )}

        {selectedPhone && (
          <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/30 p-0 md:p-4" onClick={() => setSelectedPhone('')}>
            <aside
              className="h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-2xl border bg-white shadow-2xl md:h-full md:rounded-2xl"
              style={{ borderColor: '#E2E8F0' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>
                    Lead Detail · {detail?.lead?.full_name || detail?.lead?.phone_number || selectedPhone}
                  </h3>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    Handover At: {fmtDate(detail?.lead?.handover_at ?? null)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhone('')}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                  style={{ borderColor: '#CBD5E1', color: '#1E293B' }}
                >
                  Close
                </button>
              </div>

              <div className="grid h-[calc(100%-58px)] grid-cols-1 gap-0 md:grid-cols-2">
                <div className="border-r p-4" style={{ borderColor: '#E2E8F0' }}>
                  <h4 className="text-xs font-semibold uppercase" style={{ color: '#334155' }}>
                    Call Intelligence Notes
                  </h4>
                  <pre className="mt-2 max-h-[70vh] whitespace-pre-wrap text-xs leading-relaxed" style={{ color: '#334155' }}>
                    {detail?.lead?.call_intelligence_notes || 'No call intelligence notes available.'}
                  </pre>
                </div>

                <div className="p-4">
                  <h4 className="text-xs font-semibold uppercase" style={{ color: '#334155' }}>
                    Full Chat Log
                  </h4>

                  {detailLoading && (
                    <p className="mt-2 text-xs" style={{ color: '#64748B' }}>
                      Loading conversation…
                    </p>
                  )}

                  {detailError && (
                    <p className="mt-2 text-xs" style={{ color: '#DC2626' }}>
                      {detailError}
                    </p>
                  )}

                  <div className="mt-2 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                    {(detail?.messages || []).map((message, index) => {
                      const inbound = String(message.direction ?? '').toLowerCase() === 'inbound'
                      const body = String(message.message_body ?? '').trim()
                      const template = String(message.template_name ?? '').trim()

                      return (
                        <div
                          key={String(message.id ?? `${message.created_at ?? ''}-${index}`)}
                          className="rounded-lg border px-3 py-2"
                          style={{
                            borderColor: inbound ? '#BAE6FD' : '#BBF7D0',
                            background: inbound ? '#F0F9FF' : '#F0FDF4',
                          }}
                        >
                          <p className="text-[10px] font-semibold uppercase" style={{ color: '#475569' }}>
                            {inbound ? 'Lead' : 'Pooja'} · {fmtDate(message.created_at ?? null)}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs" style={{ color: '#0F172A' }}>
                            {body || (template ? `[Template: ${template}]` : '[No text]')}
                          </p>
                        </div>
                      )
                    })}

                    {!detailLoading && !(detail?.messages || []).length && (
                      <p className="text-xs" style={{ color: '#64748B' }}>
                        No logs found for this lead.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
