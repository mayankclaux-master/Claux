import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function createAdminClient() {
  return createClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const MAX_AUTH_WAIT_MS = 8000
const AUTH_POLL_INTERVAL_MS = 400

async function waitForAuthUser(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const deadline = Date.now() + MAX_AUTH_WAIT_MS
  while (Date.now() < deadline) {
    const { data } = await admin.auth.admin.getUserById(userId)
    if (data?.user?.id) return true
    await new Promise(r => setTimeout(r, AUTH_POLL_INTERVAL_MS))
  }
  return false
}

export default async function ProvisioningPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    redirect('/login')
  }

  const eventId = `ws_${user.id.slice(0, 8)}_${Date.now()}` 
  const admin = createAdminClient()

  const authReady = await waitForAuthUser(admin, user.id)
  if (!authReady) {
    return <ProvisioningError eventId={eventId} error="AUTH_USER_SYNC_TIMEOUT" />
  }

  const { data: rpcData, error: rpcError } = await admin.rpc('bootstrap_tenant_for_user', {
    p_user_id:     user.id,
    p_tenant_name: user.user_metadata?.business_name ?? 'My Business',
    p_full_name:   user.user_metadata?.full_name ?? '',
  })

  if (rpcError) {
    return <ProvisioningError eventId={eventId} error={rpcError.message} />
  }

  const result = rpcData as { status: string; tenant_id: string }

  await admin.from('tenants').update({
    status: 'active',
    name: user.user_metadata?.business_name ?? 'My Business',
  }).eq('id', result.tenant_id)

  await admin.from('profiles').update({ provisioning_status: 'completed' }).eq('id', user.id)

  if (user.user_metadata?.business_name) {
    await admin.from('business_profiles').update({ 
      business_name: user.user_metadata.business_name 
    }).eq('tenant_id', result.tenant_id)
  }

  const { data: tenant } = await admin.from('tenants')
    .select('onboarding_completed')
    .eq('id', result.tenant_id)
    .single()

  if (tenant?.onboarding_completed) {
    redirect('/dashboard')
  } else {
    redirect('/onboarding')
  }
}

function ProvisioningError({ eventId, error }: { eventId: string; error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <div className="text-center">
        <h1 className="text-white text-xl font-semibold mb-2">Setup issue</h1>
        <p className="text-gray-500 text-xs mb-6">Event ID: {eventId}</p>
        <a href="/onboarding/provisioning" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Try again</a>
      </div>
    </div>
  )
}
