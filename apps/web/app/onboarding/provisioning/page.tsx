import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase/admin'

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

export default async function ProvisioningPage() {
  // Get Clerk user ID and JWT
  const { userId, getToken } = await auth()
  const token = await getToken({ template: "supabase" })

  if (!userId || !token) {
    redirect('/login')
  }

  // Fetch user details from Clerk
  const user = await currentUser()

  const eventId = `ws_${userId.slice(0, 8)}_${Date.now()}`
  const admin = createClerkSupabaseClient(token)

  // Extract user metadata from Clerk
  const businessName = user?.unsafeMetadata?.businessName as string || user?.firstName || 'My Business'
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || ''

  try {
    // Directly bootstrap tenant with Clerk userId - no Supabase auth sync needed
    const { data: rpcData, error: rpcError } = await admin.rpc('bootstrap_tenant_for_user', {
      p_user_id:     userId,
      p_tenant_name: businessName,
      p_full_name:   fullName,
    })

    if (rpcError) {
      // Log error without exposing database details
      console.error('[Provisioning] RPC error:', rpcError.code, rpcError.message)
      return <ProvisioningError eventId={eventId} error="Failed to initialize tenant. Please try again." />
    }

    const result = rpcData as { status: string; tenant_id: string }

    // Update tenant status
    const { error: tenantUpdateError } = await admin.from('tenants').update({
      status: 'active',
      name: businessName,
    }).eq('id', result.tenant_id)

    if (tenantUpdateError) {
      console.error('[Provisioning] Tenant update error:', tenantUpdateError.code)
      return <ProvisioningError eventId={eventId} error="Failed to update tenant. Please try again." />
    }

    // Update profile provisioning status
    const { error: profileUpdateError } = await admin.from('profiles').update({ provisioning_status: 'completed' }).eq('id', userId)

    if (profileUpdateError) {
      console.error('[Provisioning] Profile update error:', profileUpdateError.code)
      return <ProvisioningError eventId={eventId} error="Failed to update profile. Please try again." />
    }

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
  } catch (error) {
    console.error('[Provisioning] Unexpected error:', error)
    return <ProvisioningError eventId={eventId} error="An unexpected error occurred. Please try again." />
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
