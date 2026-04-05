'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { JetBrains_Mono } from 'next/font/google'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'] })

type KpiItem = {
  label: string
  value: number
  prefix?: string
  suffix?: string
  isCurrency?: boolean
}

type ReferralRow = {
  date: string
  customer: string
  status: string
  commission: number
}

type DashboardResponse = {
  affiliateName: string
  affiliateCode: string
  affiliateLink: string
  currentTier: string
  kpis: {
    totalEarnings: number
    thisMonthEarnings: number
    totalReferrals: number
    activeSubscribers: number
  }
  linkStats: {
    clicks: number
    signUps: number
    paid: number
    conversionRate: number
  }
  dailyEarnings: { day: string; amount: number }[]
  recentReferrals: ReferralRow[]
}

const EMPTY_RESPONSE: DashboardResponse = {
  affiliateName: 'Affiliate',
  affiliateCode: '',
  affiliateLink: '',
  currentTier: 'BRONZE',
  kpis: {
    totalEarnings: 0,
    thisMonthEarnings: 0,
    totalReferrals: 0,
    activeSubscribers: 0
  },
  linkStats: {
    clicks: 0,
    signUps: 0,
    paid: 0,
    conversionRate: 0
  },
  dailyEarnings: [],
  recentReferrals: []
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function formatKpiNumber(item: KpiItem, count: number): string {
  return Math.round(count).toLocaleString('en-IN') + (item.suffix ?? '')
}

function statusBadge(status: ReferralRow['status']): string {
  if (status === 'Paid') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (status === 'Trial') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
}

export default function AffiliateDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse>(EMPTY_RESPONSE)
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const kpiItems: KpiItem[] = useMemo(
    () => [
      { label: 'Total Earnings', value: dashboard.kpis.totalEarnings, prefix: '₹', isCurrency: true },
      { label: 'This Month', value: dashboard.kpis.thisMonthEarnings, prefix: '₹', isCurrency: true },
      { label: 'Total Referrals', value: dashboard.kpis.totalReferrals },
      { label: 'Active Subscribers', value: dashboard.kpis.activeSubscribers }
    ],
    [dashboard.kpis]
  )

  const linkStats = useMemo(
    () => [
      { label: 'Clicks', value: dashboard.linkStats.clicks.toLocaleString('en-IN') },
      { label: 'Sign-ups', value: dashboard.linkStats.signUps.toLocaleString('en-IN') },
      { label: 'Paid', value: dashboard.linkStats.paid.toLocaleString('en-IN') },
      { label: 'Conv. Rate', value: `${dashboard.linkStats.conversionRate.toFixed(1)}%` }
    ],
    [dashboard.linkStats]
  )

  useEffect(() => {
    let isMounted = true

    const fetchDashboard = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          window.location.href = '/affiliate/login'
          return
        }

        const response = await fetch('/api/affiliate/dashboard', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/affiliate/login'
            return
          }

          const data = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error || 'Unable to load dashboard data.')
        }

        const data = (await response.json()) as DashboardResponse
        if (isMounted) {
          setDashboard(data)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load dashboard.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (loading) {
      setAnimatedValues([0, 0, 0, 0])
      return
    }

    const targets = kpiItems.map((item) => item.value)
    const duration = 1200
    const start = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = easeOutCubic(progress)

      setAnimatedValues(targets.map((value) => value * eased))

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [loading, kpiItems])

  const chartGeometry = useMemo(() => {
    const pointsSource = dashboard.dailyEarnings.length > 0
      ? dashboard.dailyEarnings
      : [{ day: '01', amount: 0 }, { day: '02', amount: 0 }]

    const width = 860
    const height = 260
    const padX = 28
    const padY = 22
    const usableWidth = width - padX * 2
    const usableHeight = height - padY * 2
    const maxY = Math.max(...pointsSource.map((d) => d.amount), 1)

    const denominator = Math.max(pointsSource.length - 1, 1)

    const points = pointsSource.map((entry, index) => {
      const x = padX + (index * usableWidth) / denominator
      const y = height - padY - (entry.amount / maxY) * usableHeight
      return { x, y, day: entry.day, amount: entry.amount }
    })

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`

    return { width, height, padX, padY, points, linePath, areaPath }
  }, [dashboard.dailyEarnings])

  const copyLink = async () => {
    if (!dashboard.affiliateLink) return

    try {
      await navigator.clipboard.writeText(dashboard.affiliateLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className="h-screen overflow-hidden bg-[#0D1B2A] text-claux-text"
      style={{ ['--color-primary' as string]: '#1D9E75' }}
    >
      <div className="flex h-full">
        <aside className="w-[240px] shrink-0 border-r border-white/[0.07] sticky top-0 h-screen bg-[#091525] p-5">
          <div className="h-full flex flex-col">
            <p className="text-xs uppercase tracking-[0.2em] text-claux-teal/70">Claux Affiliate</p>
            <h2 className="mt-2 text-xl font-semibold">Partner Hub</h2>

            <nav className="mt-10 space-y-2 text-sm">
              <a href="#overview" className="block rounded-lg bg-claux-teal/10 border border-claux-teal/25 px-3 py-2 text-claux-teal font-medium">Overview</a>
              <a href="#link" className="block rounded-lg px-3 py-2 text-claux-muted hover:bg-claux-teal/5 hover:text-claux-teal transition-colors">Affiliate Link</a>
              <a href="#performance" className="block rounded-lg px-3 py-2 text-claux-muted hover:bg-claux-teal/5 hover:text-claux-teal transition-colors">Performance</a>
              <a href="#referrals" className="block rounded-lg px-3 py-2 text-claux-muted hover:bg-claux-teal/5 hover:text-claux-teal transition-colors">Referrals</a>
            </nav>

            <div className="mt-auto rounded-xl border border-claux-teal/20 bg-claux-teal/5 p-4">
              <p className="text-xs uppercase tracking-wide text-claux-teal/60">Current Tier</p>
              <p className="text-lg font-semibold mt-1 text-claux-teal">{dashboard.currentTier}</p>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0D1B2A]/95 backdrop-blur-md px-6 py-4">
            <h1 className="text-xl sm:text-2xl font-semibold">Hi, <span className="text-claux-teal">{dashboard.affiliateName}</span></h1>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6 space-y-8" id="overview">
            {loadError && (
              <section className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loadError}
              </section>
            )}

            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-claux-muted mb-4">Performance Overview</p>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
              >
                {kpiItems.map((item, index) => (
                  <article key={item.label} className="rounded-2xl border border-white/[0.07] bg-[#091525] p-5 hover:border-claux-teal/20 transition-colors">
                    <p className="text-xs uppercase tracking-wide text-claux-muted">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold tabular-nums">
                      {loading ? (
                        <span className="opacity-25">—</span>
                      ) : (
                        <>
                          {item.prefix && <span className="text-claux-teal">{item.prefix}</span>}
                          {formatKpiNumber(item, animatedValues[index] ?? 0)}
                        </>
                      )}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section id="link" className="rounded-2xl border border-white/[0.07] bg-[#091525] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-claux-teal">Your Affiliate Link</p>

              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className={`break-all text-base sm:text-lg text-claux-teal ${jetbrainsMono.className}`}>
                  {dashboard.affiliateLink ? dashboard.affiliateLink : <span className="text-claux-muted opacity-40">—</span>}
                </p>
                <button
                  type="button"
                  onClick={copyLink}
                  disabled={!dashboard.affiliateLink}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-40 ${
                    copied
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-claux-teal/30 text-claux-teal hover:bg-claux-teal/10'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {linkStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/[0.07] bg-[#0D1B2A]/60 p-3">
                    <p className="text-xs text-claux-muted">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">{loading ? '—' : stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="performance" className="rounded-2xl border border-white/[0.07] bg-[#091525] p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Earnings</h2>
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`} className="min-w-[760px] w-full h-auto" role="img" aria-label="Daily earnings area line chart">
                  <defs>
                    <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="color-mix(in srgb, var(--color-primary) 15%, transparent)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>

                  <rect x="0" y="0" width={chartGeometry.width} height={chartGeometry.height} fill="transparent" />

                  <path d={chartGeometry.areaPath} fill="url(#earningsFill)" />
                  <path d={chartGeometry.linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" />

                  {chartGeometry.points.map((point) => (
                    <g key={point.day}>
                      <circle cx={point.x} cy={point.y} r="4" fill="var(--color-primary)" />
                      <text x={point.x} y={chartGeometry.height - 6} textAnchor="middle" className="fill-[#8892A4] text-[11px]">
                        {point.day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </section>

            <section id="referrals" className="rounded-2xl border border-white/[0.07] bg-[#091525] p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Referrals</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-claux-muted">
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentReferrals.map((row) => (
                      <tr key={`${row.date}-${row.customer}`} className="border-b border-white/5 last:border-b-0">
                        <td className="px-3 py-3 text-gray-300">{row.date}</td>
                        <td className="px-3 py-3 text-gray-300">{row.customer}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusBadge(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 tabular-nums text-gray-200">{row.commission > 0 ? `₹${row.commission.toLocaleString('en-IN')}` : '—'}</td>
                      </tr>
                    ))}
                    {!loading && dashboard.recentReferrals.length === 0 && (
                      <tr>
                        <td className="px-3 py-4 text-claux-muted" colSpan={4}>No referrals yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
