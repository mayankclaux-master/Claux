import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

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

export default async function ProvisioningPage() {
  // Get Clerk user ID
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  const eventId = `ws_${userId.slice(0, 8)}_${Date.now()}`
  const admin = createAdminClient()

  // Directly bootstrap tenant with Clerk userId - no Supabase auth sync needed
  const { data: rpcData, error: rpcError } = await admin.rpc('bootstrap_tenant_for_user', {
    p_user_id:     userId,
    p_tenant_name: 'My Business', // TODO: Get from Clerk user metadata
    p_full_name:   '', // TODO: Get from Clerk user metadata
  })

  if (rpcError) {
    return <ProvisioningError eventId={eventId} error={rpcError.message} />
  }

  const result = rpcData as { status: string; tenant_id: string }

  await admin.from('tenants').update({
    status: 'active',
    name: 'My Business', // TODO: Get from Clerk user metadata
  }).eq('id', result.tenant_id)

  await admin.from('profiles').update({ provisioning_status: 'completed' }).eq('id', userId)

  // TODO: Update business_profiles when Clerk metadata is available

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
