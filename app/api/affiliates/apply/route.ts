import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type ApplyPayload = {
  full_name: string
  email: string
  whatsapp_number: string
  country: string
  primary_platform: string
  social_handle: string
  content_niche: string
}

const AFFILIATES_TABLE = 'affiliates'
const AFFILIATE_LINKS_TABLE = 'affiliate_links'

function normalizePayload(raw: unknown): ApplyPayload {
  const source = (raw ?? {}) as Record<string, unknown>
  return {
    full_name: String(source.full_name ?? '').trim(),
    email: String(source.email ?? '').trim().toLowerCase(),
    whatsapp_number: String(source.whatsapp_number ?? '').trim(),
    country: String(source.country ?? '').trim(),
    primary_platform: String(source.primary_platform ?? '').trim(),
    social_handle: String(source.social_handle ?? '').trim(),
    content_niche: String(source.content_niche ?? '').trim()
  }
}

function buildAffiliateCode(fullName: string): string {
  const base = fullName.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 10) || 'CLAUX'
  const randomSuffix = randomBytes(2).toString('hex').toUpperCase()
  return `${base}2026-${randomSuffix}`
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })
  }

  const payload = normalizePayload(await request.json().catch(() => ({})))
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'affiliates' },
    auth: { persistSession: false, autoRefreshToken: false }
  })

  // 1. Uniqueness check
  const { data: existing } = await supabase.from(AFFILIATES_TABLE).select('id').eq('email', payload.email).maybeSingle()
  if (existing) return NextResponse.json({ error: 'An affiliate with this email already exists.' }, { status: 409 })

  const affiliateCode = buildAffiliateCode(payload.full_name)

  // 2. Create Affiliate (FIXED: Using uppercase 'BRONZE' to satisfy the constraint)
  const { data: newAff, error: affErr } = await supabase.from(AFFILIATES_TABLE).insert({
    full_name: payload.full_name,
    email: payload.email,
    whatsapp_number: payload.whatsapp_number,
    country: payload.country,
    primary_platform: payload.primary_platform,
    social_handle: payload.social_handle,
    content_niche: payload.content_niche,
    affiliate_code: affiliateCode,
    status: 'PENDING',        // Matches database expectation
    current_tier: 'BRONZE',   // THE CRITICAL FIX: Must be Uppercase
    total_earnings: 0,
    pending_payout: 0,
    currency: 'INR'
  }).select('id').single()

  if (affErr) {
    console.error('DATABASE ERROR:', affErr)
    return NextResponse.json({ error: affErr.message }, { status: 500 })
  }

  // 3. Create Link
  const { error: linkErr } = await supabase.from(AFFILIATE_LINKS_TABLE).insert({
    affiliate_id: newAff.id,
    affiliate_code: affiliateCode,
    is_active: false,
    destination_url: '/',
    total_clicks: 0,
    total_signups: 0,
    total_paid: 0
  })

  if (linkErr) {
    return NextResponse.json({ error: 'Link generation failed.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, affiliate_code: affiliateCode }, { status: 201 })
}