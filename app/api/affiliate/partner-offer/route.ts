import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type PartnerLeadBody = {
  full_name: string
  website_url?: string
  email: string
  whatsapp: string
  affiliate_code?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: PartnerLeadBody

  try {
    body = (await request.json()) as PartnerLeadBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { full_name, website_url, email, whatsapp, affiliate_code } = body

  if (!full_name?.trim() || !email?.trim() || !whatsapp?.trim()) {
    return NextResponse.json({ error: 'Full name, email and WhatsApp are required.' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'affiliates' },
    auth: { persistSession: false, autoRefreshToken: false },
  }) as any

  const { error } = await db.from('referrals').insert({
    affiliate_code: affiliate_code ?? null,
    full_name: full_name.trim(),
    website_url: website_url?.trim() || null,
    email: email.trim(),
    whatsapp: whatsapp.trim(),
    referral_status: 'signed_up',
    status: 'signed_up',
    source: 'partner_offer',
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[partner-offer] DB insert error:', error.message)
  }

  return NextResponse.json({ success: true })
}
