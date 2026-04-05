import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, makeDb } from '../../_auth'

const VALID_TIERS = ['BRONZE', 'SILVER', 'GOLD'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } | Promise<{ code: string }> }
): Promise<NextResponse> {
  if (!(await checkAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await Promise.resolve(params)
  if (!code) return NextResponse.json({ error: 'Missing affiliate code' }, { status: 400 })

  let body: { action: string; tier?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  if (body.action === 'approve') {
    const { error } = await db
      .from('affiliates')
      .update({ status: 'active' })
      .eq('affiliate_code', code)

    if (error) {
      console.error('[admin/affiliates] approve error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  if (body.action === 'change_tier') {
    const tier = body.tier?.toUpperCase()
    if (!tier || !VALID_TIERS.includes(tier as any)) {
      return NextResponse.json(
        { error: `tier must be one of ${VALID_TIERS.join(', ')}` },
        { status: 400 }
      )
    }
    const { error } = await db
      .from('affiliates')
      .update({ current_tier: tier })
      .eq('affiliate_code', code)

    if (error) {
      console.error('[admin/affiliates] change_tier error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
