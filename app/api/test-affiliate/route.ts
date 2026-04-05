import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type UntypedSupabase = {
  from: (table: string) => {
    insert: (values: Record<string, unknown> | Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>
  }
}

type Payload = {
  affiliate_code?: string
  commission_amount?: number
}

async function tryInsertWithFallback(
  db: UntypedSupabase,
  table: string,
  candidates: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string }> {
  for (const candidate of candidates) {
    const { error } = await db.from(table).insert(candidate)
    if (!error) {
      return { success: true }
    }
  }

  return { success: false, error: `Failed insert for ${table}` }
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
  }

  const body = (await request.json().catch(() => ({}))) as Payload
  const affiliateCode = String(body.affiliate_code ?? 'MAYANK2026-X7K2').trim()
  const commissionAmount = Number(body.commission_amount ?? 1250)

  if (!affiliateCode) {
    return NextResponse.json({ error: 'affiliate_code is required' }, { status: 400 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  }) as unknown as UntypedSupabase

  const nowIso = new Date().toISOString()
  const orderId = `test-${randomUUID()}`

  const referralInsert = await tryInsertWithFallback(db, 'affiliates.referrals', [
    {
      affiliate_code: affiliateCode,
      status: 'Paid',
      commission_amount: commissionAmount,
      created_at: nowIso,
      conversion_source: 'test_route',
      order_id: orderId
    },
    {
      affiliate_code: affiliateCode,
      status: 'Paid',
      commission: commissionAmount,
      created_at: nowIso,
      order_id: orderId
    },
    {
      affiliate_code: affiliateCode,
      status: 'Paid',
      commission_amount: commissionAmount,
      created_at: nowIso
    },
    {
      affiliate_code: affiliateCode,
      status: 'Paid',
      commission: commissionAmount,
      created_at: nowIso
    }
  ])

  if (!referralInsert.success) {
    return NextResponse.json({ error: referralInsert.error }, { status: 500 })
  }

  const commissionInsert = await tryInsertWithFallback(db, 'affiliates.commissions', [
    {
      affiliate_code: affiliateCode,
      status: 'Paid',
      amount: commissionAmount,
      created_at: nowIso,
      source: 'test_route',
      order_id: orderId
    },
    {
      affiliate_code: affiliateCode,
      status: 'Paid',
      commission_amount: commissionAmount,
      created_at: nowIso,
      order_id: orderId
    },
    {
      affiliate_code: affiliateCode,
      amount: commissionAmount,
      created_at: nowIso
    }
  ])

  if (!commissionInsert.success) {
    return NextResponse.json({ error: commissionInsert.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    affiliate_code: affiliateCode,
    commission_amount: commissionAmount,
    message: 'Mock paid conversion inserted into affiliates.referrals and affiliates.commissions'
  })
}
