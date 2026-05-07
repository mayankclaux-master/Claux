import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export type WorkspaceStatus = 'healthy' | 'failed'

export interface WorkspaceResult {
  status: WorkspaceStatus
  tenantId?: string
  eventId: string
  error?: string
}

const MAX_AUTH_WAIT_MS = 6000
const AUTH_POLL_INTERVAL_MS = 400

function createAdminClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
    .replace(/\/rest\/v1\/?$/, '')
  return createClient(
    url,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function ensureWorkspaceForUser(
  userId: string,
  meta?: { businessName?: string; fullName?: string }
): Promise<WorkspaceResult> {
  const eventId = `ws_${userId.slice(0, 8)}_${Date.now()}`
  const admin = createAdminClient()

  const authReady = await waitForAuthUser(admin, userId)
  if (!authReady) {
    console.error(JSON.stringify({
      eventId, userId, step: 'auth_wait', msg: 'AUTH_USER_SYNC_TIMEOUT'
    }))
    return { status: 'failed', error: 'AUTH_USER_SYNC_TIMEOUT', eventId }
  }

  const { data, error } = await admin.rpc('bootstrap_tenant_for_user', {
    p_user_id:     userId,
    p_tenant_name: meta?.businessName ?? 'My Business',
    p_full_name:   meta?.fullName ?? '',
  })

  if (error) {
    console.error(JSON.stringify({
      eventId, userId, step: 'rpc', msg: error.message, code: error.code
    }))
    return { status: 'failed', error: error.message, eventId }
  }

  const result = data as { status: string; tenant_id: string }

  console.info(JSON.stringify({
    eventId,
    userId,
    step: 'provisioned',
    rpcStatus: result.status,
    tenantId: result.tenant_id
  }))

  return { status: 'healthy', tenantId: result.tenant_id, eventId }
}

async function waitForAuthUser(admin: any, userId: string): Promise<boolean> {
  const deadline = Date.now() + MAX_AUTH_WAIT_MS
  while (Date.now() < deadline) {
    const { data } = await admin.auth.admin.getUserById(userId)
    if (data?.user?.id) return true
    await sleep(AUTH_POLL_INTERVAL_MS)
  }
  return false
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
