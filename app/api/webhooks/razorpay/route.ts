import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ── Tier → commission rate map ──────────────────────────────────────────────
const TIER_RATES: Record<string, number> = {
  BRONZE: 0.2,
  SILVER: 0.25,
  GOLD: 0.3,
}
const DEFAULT_RATE = 0.2

function getRate(tier: unknown): number {
  if (!tier) return DEFAULT_RATE
  return TIER_RATES[String(tier).toUpperCase()] ?? DEFAULT_RATE
}

// ── Razorpay HMAC-SHA256 signature verification ──────────────────────────────
function isValidSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return expected === signature
}

// ── Razorpay payload types ────────────────────────────────────────────────────
type RazorpayNotes = Record<string, string | undefined> | null | undefined

type RazorpayPaymentEntity = {
  id?: string
  order_id?: string
  amount?: number
  email?: string
  contact?: string
  notes?: RazorpayNotes
}

type RazorpayEvent = {
  event?: string
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity
    }
  }
}

type AffiliateRow = {
  affiliate_code: string
  current_tier: string | null
  total_earnings: number | null
  pending_payout: number | null
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Read raw body — must happen before any other body parsing
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 })
  }

  // 2. Verify signature — reject spoofed requests immediately
  if (!isValidSignature(rawBody, signature, webhookSecret)) {
    console.warn('[razorpay-webhook] Signature mismatch — possible spoofed request')
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  // 3. Parse event
  let event: RazorpayEvent
  try {
    event = JSON.parse(rawBody) as RazorpayEvent
  } catch {
    return NextResponse.json({ error: 'Malformed JSON.' }, { status: 400 })
  }

  // 4. Only act on payment.captured — acknowledge all other events with 200
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const payment = event.payload?.payment?.entity
  if (!payment) {
    console.error('[razorpay-webhook] payment.captured received but entity is missing')
    return NextResponse.json({ received: true })
  }

  const paymentId = String(payment.id ?? '').trim()
  const orderId = String(payment.order_id ?? '').trim() || null
  const amountPaise = Number(payment.amount ?? 0)
  const amountINR = amountPaise / 100
  const payerEmail = String(payment.email ?? payment.contact ?? '').trim()

  // 5. Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      '[razorpay-webhook] Missing env vars — supabaseUrl:',
      Boolean(supabaseUrl),
      '| serviceRoleKey:',
      Boolean(serviceRoleKey)
    )
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'affiliates' },
    auth: { persistSession: false, autoRefreshToken: false },
  }) as any

  // 6. Idempotency — skip if this payment was already processed
  if (paymentId) {
    const { data: existing } = await db
      .from('commissions')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (existing) {
      console.log(`[razorpay-webhook] Duplicate event — payment ${paymentId} already processed`)
      return NextResponse.json({ received: true })
    }
  }

  // 7. Attribution
  let affiliateCode: string | null = null

  // Step A: notes.affiliate_code (appended by partner-offer page at checkout)
  const notes = payment.notes
  const notesCode =
    notes && typeof notes === 'object' ? (notes as Record<string, unknown>).affiliate_code : undefined

  if (notesCode && String(notesCode).trim()) {
    affiliateCode = String(notesCode).trim()
    console.log(`[razorpay-webhook] Step A hit — affiliate_code from notes: ${affiliateCode}`)
  }

  // Step B: Fallback — query affiliates.referrals by payer email
  if (!affiliateCode && payerEmail) {
    const { data: referralRow } = await db
      .from('referrals')
      .select('affiliate_code')
      .eq('email', payerEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (referralRow?.affiliate_code) {
      affiliateCode = String(referralRow.affiliate_code).trim()
      console.log(`[razorpay-webhook] Step B hit — affiliate_code from referrals: ${affiliateCode}`)
    }
  }

  // Step C: No affiliate — standard sale, nothing to credit
  if (!affiliateCode) {
    console.log(
      `[razorpay-webhook] Step C — Standard Sale | payment ${paymentId} | ₹${amountINR} | email: ${payerEmail || 'n/a'}`
    )
    return NextResponse.json({ received: true })
  }

  // 8. Fetch affiliate record for tier + current running totals
  const { data: affiliate, error: affiliateError } = await db
    .from('affiliates')
    .select('affiliate_code, current_tier, total_earnings, pending_payout')
    .eq('affiliate_code', affiliateCode)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    console.error(
      `[razorpay-webhook] Affiliate record not found for code "${affiliateCode}":`,
      JSON.stringify(affiliateError)
    )
    return NextResponse.json({ received: true })
  }

  const row = affiliate as AffiliateRow

  // 9. Commission calculation
  const rate = getRate(row.current_tier)
  const commission = Math.round(amountINR * rate * 100) / 100

  console.log(
    `[razorpay-webhook] Crediting | payment=${paymentId} | ₹${amountINR} | affiliate=${affiliateCode}` +
      ` | tier=${row.current_tier ?? 'BRONZE'} | rate=${rate * 100}% | commission=₹${commission}`
  )

  // 10. Insert commission row (idempotency guarantee via payment_id)
  const { error: commissionInsertError } = await db.from('commissions').insert({
    affiliate_code: affiliateCode,
    payment_id: paymentId || null,
    order_id: orderId,
    amount: amountINR,
    commission_amount: commission,
    rate,
    payer_email: payerEmail || null,
    payout_status: 'pending',
    created_at: new Date().toISOString(),
  })

  if (commissionInsertError) {
    console.error(
      '[razorpay-webhook] Failed to insert commission:',
      JSON.stringify(commissionInsertError)
    )
  }

  // 11. Update affiliate running totals
  const newTotalEarnings = (Number(row.total_earnings) || 0) + commission
  const newPendingPayout = (Number(row.pending_payout) || 0) + commission

  const { error: updateError } = await db
    .from('affiliates')
    .update({
      total_earnings: newTotalEarnings,
      pending_payout: newPendingPayout,
    })
    .eq('affiliate_code', affiliateCode)

  if (updateError) {
    console.error(
      '[razorpay-webhook] Failed to update affiliate balances:',
      JSON.stringify(updateError)
    )
  }

  console.log(
    `[razorpay-webhook] Done — ₹${commission} credited to ${affiliateCode}` +
      ` | new total_earnings=₹${newTotalEarnings} | new pending_payout=₹${newPendingPayout}`
  )

  return NextResponse.json({ received: true })
}
