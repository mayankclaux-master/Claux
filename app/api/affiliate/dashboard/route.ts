import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type GenericRow = Record<string, unknown>

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (!auth) return null
  if (!auth.toLowerCase().startsWith('bearer ')) return null
  return auth.slice(7).trim() || null
}

function monthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0))
  return { start, end }
}

export async function GET(request: Request): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
  }

  const accessToken = getBearerToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser(accessToken)

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'affiliates' },
    auth: { persistSession: false, autoRefreshToken: false }
  }) as any

  let affiliateRecord: GenericRow | null = null

  const byUserId = await db
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!byUserId.error && byUserId.data) {
    affiliateRecord = byUserId.data
  } else if (user.email) {
    const byEmail = await db
      .from('affiliates')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()

    if (!byEmail.error && byEmail.data) {
      affiliateRecord = byEmail.data
    }
  }

  if (!affiliateRecord) {
    return NextResponse.json({ error: 'Affiliate record not found' }, { status: 404 })
  }

  const affiliateCode = String(affiliateRecord.affiliate_code ?? '')
  if (!affiliateCode) {
    return NextResponse.json({ error: 'Affiliate code missing' }, { status: 500 })
  }

  const { start, end } = monthRange()

  const [linkStatsResult, referralsResult, monthReferralsResult] = await Promise.all([
    db
      .from('affiliate_links')
      .select('*')
      .eq('affiliate_code', affiliateCode)
      .maybeSingle(),
    db
      .from('referrals')
      .select('*')
      .eq('affiliate_code', affiliateCode)
      .order('created_at', { ascending: false })
      .limit(10),
    db
      .from('referrals')
      .select('created_at,commission,commission_amount')
      .eq('affiliate_code', affiliateCode)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
  ])

  const referralRows: GenericRow[] = Array.isArray(referralsResult.data) ? referralsResult.data : []
  const monthRows: GenericRow[] = Array.isArray(monthReferralsResult.data) ? monthReferralsResult.data : []

  const totalReferrals = toNumber(affiliateRecord.total_referrals) || referralRows.length
  const activeSubscribers = toNumber(affiliateRecord.active_subscribers)
  const totalEarnings = toNumber(affiliateRecord.total_earnings)

  const thisMonthEarnings = monthRows.reduce((sum, row) => {
    return sum + toNumber(row.commission_amount ?? row.commission)
  }, 0)

  const dailyMap = new Map<string, number>()
  for (const row of monthRows) {
    const date = new Date(String(row.created_at ?? ''))
    if (Number.isNaN(date.getTime())) continue
    const day = String(date.getUTCDate()).padStart(2, '0')
    const prev = dailyMap.get(day) ?? 0
    dailyMap.set(day, prev + toNumber(row.commission_amount ?? row.commission))
  }

  const dailyEarnings = Array.from(dailyMap.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([day, amount]) => ({ day, amount }))

  const recentReferrals = referralRows.map((row, index) => ({
    date: new Date(String(row.created_at ?? row.date ?? new Date().toISOString())).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    customer: `Customer #${index + 1}`,
    status: String(row.status ?? 'Pending'),
    commission: toNumber(row.commission_amount ?? row.commission)
  }))

  const clicks = toNumber(linkStatsResult.data?.clicks)
  const signUps = toNumber(linkStatsResult.data?.sign_ups ?? linkStatsResult.data?.signups)
  const paid = toNumber(linkStatsResult.data?.paid)
  const conversionRate = signUps > 0 ? (paid / signUps) * 100 : toNumber(linkStatsResult.data?.conversion_rate)

  return NextResponse.json({
    affiliateName: String(affiliateRecord.full_name ?? user.user_metadata?.full_name ?? 'Affiliate'),
    affiliateCode,
    affiliateLink: `claux.io/ref/${affiliateCode}`,
    currentTier: String(affiliateRecord.current_tier ?? 'BRONZE'),
    kpis: {
      totalEarnings,
      thisMonthEarnings,
      totalReferrals,
      activeSubscribers
    },
    linkStats: {
      clicks,
      signUps,
      paid,
      conversionRate
    },
    dailyEarnings,
    recentReferrals
  })
}
