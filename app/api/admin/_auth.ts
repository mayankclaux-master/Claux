import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '7smedtech@gmail.com'

export async function checkAdminAuth(request: Request): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return false

  const auth = request.headers.get('authorization') ?? ''
  if (!auth.toLowerCase().startsWith('bearer ')) return false
  const token = auth.slice(7).trim()
  if (!token) return false

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token)

  if (error || !user) return false
  return user.email === ADMIN_EMAIL
}

export function makeDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      '[admin/makeDb] Missing env vars — supabaseUrl:',
      Boolean(supabaseUrl),
      '| SUPABASE_SERVICE_ROLE_KEY:',
      Boolean(serviceRoleKey)
    )
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'affiliates' },
    auth: { persistSession: false, autoRefreshToken: false },
  }) as any
}
