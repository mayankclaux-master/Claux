import { createHash, randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const HOME_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const PARTNER_OFFER_URL =
  process.env.NEXT_PUBLIC_PARTNER_OFFER_URL ?? `${HOME_URL}/partner-offer`
const COOKIE_NAME = 'claux_ref'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const LOOKUP_TABLE = 'affiliate_links'
const CLICKS_TABLE = 'affiliate_clicks'

type AffiliateLookupRow = {
  affiliate_code: string
  is_active: boolean
}

type UntypedSupabase = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: AffiliateLookupRow | null; error: { message: string } | null }>
      }
    }
    insert: (values: Record<string, unknown>) => Promise<unknown>
  }
}

function redirectHome(): NextResponse {
  const response = NextResponse.redirect(PARTNER_OFFER_URL, { status: 307 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  const realIp = request.headers.get('x-real-ip')
  return realIp?.trim() || 'unknown'
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

async function tryLogClick(
  supabase: UntypedSupabase,
  affiliateCode: string,
  ipHash: string,
  sessionToken: string,
  userAgent: string,
  referrer: string
): Promise<void> {
  const insertPromise = supabase.from(CLICKS_TABLE).insert({
    affiliate_code: affiliateCode,
    ip_hash: ipHash,
    session_token: sessionToken,
    user_agent: userAgent,
    referrer,
    clicked_at: new Date().toISOString()
  })

  const cappedWait = new Promise((resolve) => {
    setTimeout(resolve, 50)
  })

  await Promise.race([insertPromise, cappedWait])
}

export async function GET(
  request: Request,
  { params }: { params: { code?: string } | Promise<{ code?: string }> }
): Promise<NextResponse> {
  const resolvedParams = await Promise.resolve(params)
  const code = resolvedParams.code?.trim()

  if (!code) {
    return redirectHome()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return redirectHome()
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'affiliates' },
    auth: { persistSession: false, autoRefreshToken: false }
  })
  const db = supabase as unknown as UntypedSupabase

  const { data, error } = await db
    .from(LOOKUP_TABLE)
    .select('affiliate_code, is_active')
    .eq('affiliate_code', code)
    .maybeSingle()

  if (error || !data || !data.is_active) {
    return redirectHome()
  }

  const ipHash = hashIp(getClientIp(request))
  const sessionToken = randomUUID()
  const userAgent = request.headers.get('user-agent') ?? ''
  const referrer = request.headers.get('referer') ?? ''

  try {
    await tryLogClick(db, code, ipHash, sessionToken, userAgent, referrer)
  } catch {
  }

  const response = NextResponse.redirect(PARTNER_OFFER_URL, { status: 307 })
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set({
    name: COOKIE_NAME,
    value: code,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
    secure: true,
    sameSite: 'lax'
  })

  return response
}
