import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ensureWorkspaceForUser } from '@/lib/auth/ensure-workspace'

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export default async function ProvisioningPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}, // This is fine for Read-only, but the URL was the crash point
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  if (!user.email_confirmed_at) {
    redirect('/auth/verify-email')
  }

  const result = await ensureWorkspaceForUser(user.id, {
    businessName: user.user_metadata?.business_name,
    fullName: user.user_metadata?.full_name,
  })

  if (result.status === 'healthy') {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('onboarding_completed')
      .eq('id', result.tenantId)
      .single()

    if (tenant?.onboarding_completed) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <div className="text-center max-w-md px-6">
        <h1 className="text-white text-xl font-semibold mb-2">Setup issue</h1>
        <p className="text-gray-400 text-sm mb-6">Event ID: {result.eventId}</p>
        <a href="/onboarding/provisioning" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Try again</a>
      </div>
    </div>
  )
}
