import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, makeDb } from '../_auth'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await checkAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = makeDb()
  if (!db) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const { data, error } = await db
    .from('commissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/commissions] fetch error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ commissions: Array.isArray(data) ? data : [] })
}
