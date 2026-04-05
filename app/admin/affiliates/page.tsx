'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type AffiliateRow = {
  affiliate_code: string
  full_name: string
  email: string
  content_niche?: string
  current_tier: string
  total_earnings: number
  pending_payout: number
  status: string
  created_at: string
}

type CommissionRow = {
  id: string
  affiliate_code: string
  payment_id: string | null
  amount: number
  commission_amount: number
  rate: number
  payer_email: string | null
  payout_status: string
  created_at: string
}

type Stats = {
  totalAffiliates: number
  totalCommissions: number
  pendingPayouts: number
}

// ── Supabase singleton ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

const TIERS = ['BRONZE', 'SILVER', 'GOLD'] as const

function tierBadge(tier: string) {
  const t = tier?.toUpperCase()
  if (t === 'GOLD')
    return { bg: 'rgba(250,189,0,0.12)', color: '#FABD00', label: 'Gold' }
  if (t === 'SILVER')
    return { bg: 'rgba(180,180,180,0.12)', color: '#B4B4B4', label: 'Silver' }
  return { bg: 'rgba(29,158,117,0.12)', color: '#1D9E75', label: 'Bronze' }
}

function statusBadge(status: string) {
  const s = status?.toLowerCase()
  if (s === 'active')
    return { bg: 'rgba(29,158,117,0.12)', color: '#1D9E75', label: 'Active' }
  if (s === 'pending')
    return { bg: 'rgba(250,189,0,0.12)', color: '#FABD00', label: 'Pending' }
  return { bg: 'rgba(136,146,164,0.12)', color: '#8892A4', label: status }
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminAffiliatesPage() {
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([])
  const [commissions, setCommissions] = useState<CommissionRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Per-row action state
  const [tierSelections, setTierSelections] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({})

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '7smedtech@gmail.com'

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.location.href = '/login'
        return
      }

      if (session.user.email !== ADMIN_EMAIL) {
        setAccessDenied(true)
        setAuthChecked(true)
        return
      }

      setAuthToken(session.access_token)
      setAuthChecked(true)
    }
    check()
  }, [])

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (token: string) => {
    setLoading(true)
    setError('')
    try {
      const [affRes, commRes] = await Promise.all([
        fetch('/api/admin/affiliates', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/commissions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [affData, commData] = await Promise.all([affRes.json(), commRes.json()])

      if (!affRes.ok) {
        throw new Error(
          affData?.error
            ? `Affiliates API: ${affData.error}`
            : `Affiliates API returned ${affRes.status}`
        )
      }
      if (!commRes.ok) {
        throw new Error(
          commData?.error
            ? `Commissions API: ${commData.error}`
            : `Commissions API returned ${commRes.status}`
        )
      }

      setAffiliates(affData.affiliates ?? [])
      setStats(affData.stats ?? null)
      setCommissions(commData.commissions ?? [])

      // Pre-populate tier selections with current tier
      const tiers: Record<string, string> = {}
      for (const a of affData.affiliates ?? []) {
        tiers[a.affiliate_code] = a.current_tier ?? 'BRONZE'
      }
      setTierSelections(tiers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authChecked && authToken) fetchAll(authToken)
  }, [authChecked, authToken, fetchAll])

  // ── Actions ─────────────────────────────────────────────────────────────────
  const setRowLoading = (key: string, val: boolean) =>
    setActionLoading((prev) => ({ ...prev, [key]: val }))

  const setRowMsg = (key: string, msg: string) =>
    setActionMsg((prev) => ({ ...prev, [key]: msg }))

  const handleApprove = async (code: string) => {
    if (!authToken) return
    setRowLoading(code, true)
    setRowMsg(code, '')
    try {
      const res = await fetch(`/api/admin/affiliates/${code}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRowMsg(code, '✓ Approved')
      setAffiliates((prev) =>
        prev.map((a) => (a.affiliate_code === code ? { ...a, status: 'active' } : a))
      )
    } catch (e) {
      setRowMsg(code, e instanceof Error ? e.message : 'Error')
    } finally {
      setRowLoading(code, false)
    }
  }

  const handleChangeTier = async (code: string) => {
    if (!authToken) return
    const tier = tierSelections[code]
    setRowLoading(`tier-${code}`, true)
    setRowMsg(`tier-${code}`, '')
    try {
      const res = await fetch(`/api/admin/affiliates/${code}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'change_tier', tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRowMsg(`tier-${code}`, `✓ Set to ${tier}`)
      setAffiliates((prev) =>
        prev.map((a) => (a.affiliate_code === code ? { ...a, current_tier: tier } : a))
      )
    } catch (e) {
      setRowMsg(`tier-${code}`, e instanceof Error ? e.message : 'Error')
    } finally {
      setRowLoading(`tier-${code}`, false)
    }
  }

  const handleMarkPaid = async (commissionId: string) => {
    if (!authToken) return
    setRowLoading(`comm-${commissionId}`, true)
    setRowMsg(`comm-${commissionId}`, '')
    try {
      const res = await fetch(`/api/admin/commissions/${commissionId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRowMsg(`comm-${commissionId}`, '✓ Paid')
      setCommissions((prev) => prev.filter((c) => c.id !== commissionId))
      // Refresh stats
      if (authToken) fetchAll(authToken)
    } catch (e) {
      setRowMsg(`comm-${commissionId}`, e instanceof Error ? e.message : 'Error')
    } finally {
      setRowLoading(`comm-${commissionId}`, false)
    }
  }

  // ── Render states ────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0D1B2A' }}
      >
        <p style={{ color: '#8892A4' }}>Verifying access…</p>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5 px-4"
        style={{ background: '#0D1B2A' }}
      >
        <div
          className="rounded-2xl border p-8 max-w-sm w-full text-center"
          style={{ background: '#091525', borderColor: 'rgba(239,68,68,0.25)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#F87171" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm mb-6" style={{ color: '#8892A4' }}>
            You are signed in but your account does not have admin privileges.
            Sign in with the admin email to continue.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(to right, #1D9E75, #10b981)' }}
          >
            Sign Out &amp; Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans" style={{ background: '#0D1B2A', color: '#F0F2F8' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#091525' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-semibold px-2 py-1 rounded"
            style={{ background: 'rgba(29,158,117,0.15)', color: '#1D9E75' }}
          >
            ADMIN
          </span>
          <h1 className="text-lg font-bold">Affiliate Control Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => authToken && fetchAll(authToken)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{ borderColor: 'rgba(29,158,117,0.3)', color: '#1D9E75' }}
          >
            Refresh
          </button>
          <Link href="/" className="text-xs" style={{ color: '#8892A4' }}>
            ← Back to Site
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            {error}
          </div>
        )}

        {/* ── Stats Ribbon ── */}
        {stats && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Affiliates', value: stats.totalAffiliates, mono: false },
              { label: 'Total Sales Credited', value: fmt(stats.totalCommissions), mono: true },
              { label: 'Pending Payouts', value: fmt(stats.pendingPayouts), mono: true, highlight: true },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl px-5 py-5 border"
                style={{
                  background: '#091525',
                  borderColor: card.highlight
                    ? 'rgba(250,189,0,0.25)'
                    : 'rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8892A4' }}>
                  {card.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: card.highlight ? '#FABD00' : '#1D9E75' }}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* ── Affiliates Table ── */}
        <section>
          <h2 className="text-base font-semibold mb-4">
            All Partners &amp; Influencers
            <span className="ml-2 text-sm font-normal" style={{ color: '#8892A4' }}>
              ({affiliates.length})
            </span>
          </h2>

          {loading ? (
            <div className="text-sm" style={{ color: '#8892A4' }}>
              Loading…
            </div>
          ) : affiliates.length === 0 ? (
            <div className="text-sm" style={{ color: '#8892A4' }}>
              No partners or influencers found.
            </div>
          ) : (
            <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#091525' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Name / Email', 'Niche / Specialty', 'Tier', 'Total Earnings', 'Unpaid', 'Status', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#8892A4' }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((aff) => {
                    const tb = tierBadge(aff.current_tier)
                    const sb = statusBadge(aff.status)
                    const approveKey = aff.affiliate_code
                    const tierKey = `tier-${aff.affiliate_code}`
                    return (
                      <tr
                        key={aff.affiliate_code}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        {/* Name / Email */}
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: '#F0F2F8' }}>
                            {aff.full_name || '—'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#8892A4' }}>
                            {aff.email}
                          </p>
                          <p className="text-xs mt-0.5 font-mono" style={{ color: '#8892A4' }}>
                            {aff.affiliate_code}
                          </p>
                        </td>

                        {/* Niche */}
                        <td className="px-4 py-3" style={{ color: '#8892A4' }}>
                          {aff.content_niche || '—'}
                        </td>

                        {/* Tier badge */}
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ background: tb.bg, color: tb.color }}
                          >
                            {tb.label}
                          </span>
                        </td>

                        {/* Total Earnings */}
                        <td className="px-4 py-3 font-medium" style={{ color: '#1D9E75' }}>
                          {fmt(Number(aff.total_earnings) || 0)}
                        </td>

                        {/* Pending Payout */}
                        <td className="px-4 py-3" style={{ color: '#FABD00' }}>
                          {fmt(Number(aff.pending_payout) || 0)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ background: sb.bg, color: sb.color }}
                          >
                            {sb.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            {/* Approve (only for non-active) */}
                            {aff.status?.toLowerCase() !== 'active' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(aff.affiliate_code)}
                                  disabled={actionLoading[approveKey]}
                                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                                  style={{
                                    background: 'rgba(29,158,117,0.15)',
                                    color: '#1D9E75',
                                    border: '1px solid rgba(29,158,117,0.3)',
                                  }}
                                >
                                  {actionLoading[approveKey] ? '…' : 'Approve'}
                                </button>
                                {actionMsg[approveKey] && (
                                  <span className="text-xs" style={{ color: '#1D9E75' }}>
                                    {actionMsg[approveKey]}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Change Tier */}
                            <div className="flex items-center gap-2">
                              <select
                                value={tierSelections[aff.affiliate_code] ?? aff.current_tier}
                                onChange={(e) =>
                                  setTierSelections((prev) => ({
                                    ...prev,
                                    [aff.affiliate_code]: e.target.value,
                                  }))
                                }
                                className="text-xs rounded-lg px-2 py-1.5 border outline-none"
                                style={{
                                  background: '#0D1B2A',
                                  borderColor: 'rgba(255,255,255,0.12)',
                                  color: '#F0F2F8',
                                }}
                              >
                                {TIERS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleChangeTier(aff.affiliate_code)}
                                disabled={actionLoading[tierKey]}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                                style={{
                                  background: 'rgba(99,102,241,0.15)',
                                  color: '#818CF8',
                                  border: '1px solid rgba(99,102,241,0.3)',
                                }}
                              >
                                {actionLoading[tierKey] ? '…' : 'Set'}
                              </button>
                              {actionMsg[tierKey] && (
                                <span className="text-xs" style={{ color: '#818CF8' }}>
                                  {actionMsg[tierKey]}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Pending Commissions Table ── */}
        <section>
          <h2 className="text-base font-semibold mb-4">
            Pending Payouts
            <span className="ml-2 text-sm font-normal" style={{ color: '#8892A4' }}>
              ({commissions.length})
            </span>
          </h2>

          {loading ? (
            <div className="text-sm" style={{ color: '#8892A4' }}>
              Loading…
            </div>
          ) : commissions.length === 0 ? (
            <div
              className="rounded-xl px-5 py-6 text-center text-sm border"
              style={{ background: '#091525', borderColor: 'rgba(255,255,255,0.06)', color: '#8892A4' }}
            >
              No pending payouts. All commissions have been cleared.
            </div>
          ) : (
            <div
              className="rounded-2xl border overflow-x-auto"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#091525' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Affiliate', 'Payer Email', 'Sale Amount', 'Commission', 'Rate', 'Date', 'Action'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#8892A4' }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => {
                    const commKey = `comm-${c.id}`
                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        {/* Affiliate */}
                        <td className="px-4 py-3">
                          <p className="font-medium font-mono text-xs" style={{ color: '#F0F2F8' }}>
                            {c.affiliate_code}
                          </p>
                          {c.payment_id && (
                            <p className="text-xs mt-0.5 font-mono" style={{ color: '#8892A4' }}>
                              {c.payment_id}
                            </p>
                          )}
                        </td>

                        {/* Payer Email */}
                        <td className="px-4 py-3" style={{ color: '#8892A4' }}>
                          {c.payer_email || '—'}
                        </td>

                        {/* Sale Amount */}
                        <td className="px-4 py-3" style={{ color: '#F0F2F8' }}>
                          {fmt(Number(c.amount) || 0)}
                        </td>

                        {/* Commission */}
                        <td className="px-4 py-3 font-semibold" style={{ color: '#1D9E75' }}>
                          {fmt(Number(c.commission_amount) || 0)}
                        </td>

                        {/* Rate */}
                        <td className="px-4 py-3" style={{ color: '#8892A4' }}>
                          {c.rate ? `${Math.round(Number(c.rate) * 100)}%` : '—'}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3" style={{ color: '#8892A4' }}>
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>

                        {/* Mark as Paid */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleMarkPaid(c.id)}
                              disabled={actionLoading[commKey]}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                              style={{
                                background: 'rgba(250,189,0,0.12)',
                                color: '#FABD00',
                                border: '1px solid rgba(250,189,0,0.3)',
                              }}
                            >
                              {actionLoading[commKey] ? '…' : 'Mark Paid'}
                            </button>
                            {actionMsg[commKey] && (
                              <span className="text-xs" style={{ color: '#1D9E75' }}>
                                {actionMsg[commKey]}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
