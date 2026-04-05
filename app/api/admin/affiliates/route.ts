import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, makeDb } from '../_auth'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await checkAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const [affiliatesResult, commissionsResult] = await Promise.all([
    db.from('affiliates').select('*').order('created_at', { ascending: false }),
    db.from('commissions').select('commission_amount, status'),
  ])

  const affiliates = Array.isArray(affiliatesResult.data) ? affiliatesResult.data : []
  const allCommissions = Array.isArray(commissionsResult.data) ? commissionsResult.data : []

  const totalCommissions = allCommissions.reduce(
    (sum: number, c: any) => sum + (Number(c.commission_amount) || 0),
    0
  )
  const pendingPayouts = allCommissions
    .filter((c: any) => c.status === 'pending')
    .reduce((sum: number, c: any) => sum + (Number(c.commission_amount) || 0), 0)

  return NextResponse.json({
    affiliates,
    stats: {
      totalAffiliates: affiliates.length,
      totalCommissions: Math.round(totalCommissions * 100) / 100,
      pendingPayouts: Math.round(pendingPayouts * 100) / 100,
    },
  })
}
