import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, makeDb } from '../../_auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!(await checkAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await Promise.resolve(params)
  if (!id) return NextResponse.json({ error: 'Missing commission id' }, { status: 400 })

  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  // Fetch the commission row first to get affiliate_code + commission_amount
  const { data: commission, error: fetchError } = await db
    .from('commissions')
    .select('id, affiliate_code, commission_amount, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !commission) {
    return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
  }

  if (commission.status === 'paid') {
    return NextResponse.json({ error: 'Already marked as paid' }, { status: 409 })
  }

  const commissionAmount = Number(commission.commission_amount) || 0

  // Mark commission as paid
  const { error: updateCommError } = await db
    .from('commissions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)

  if (updateCommError) {
    console.error('[admin/commissions] mark-paid error:', JSON.stringify(updateCommError))
    return NextResponse.json({ error: updateCommError.message }, { status: 500 })
  }

  // Subtract from affiliate unpaid_balance
  const { data: affiliate, error: affiliateFetchError } = await db
    .from('affiliates')
    .select('unpaid_balance')
    .eq('affiliate_code', commission.affiliate_code)
    .maybeSingle()

  if (!affiliateFetchError && affiliate) {
    const newUnpaidBalance = Math.max(
      0,
      (Number(affiliate.unpaid_balance) || 0) - commissionAmount
    )
    const { error: balanceUpdateError } = await db
      .from('affiliates')
      .update({ unpaid_balance: newUnpaidBalance })
      .eq('affiliate_code', commission.affiliate_code)

    if (balanceUpdateError) {
      console.error(
        '[admin/commissions] balance update error:',
        JSON.stringify(balanceUpdateError)
      )
    }
  }

  return NextResponse.json({ success: true })
}
