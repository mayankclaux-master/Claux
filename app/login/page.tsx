'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); return }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Login succeeded but no session was created. Please retry.')
        return
      }
      window.location.href = '/admin/affiliates'
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/admin/affiliates` },
      })
      if (magicError) { setError(magicError.message); return }
      setSuccess('Magic link sent! Check your inbox and click the link to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0D1B2A' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/claux-logo-cropped.png"
              alt="Claux"
              width={160}
              height={42}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ background: '#091525', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <h1 className="text-xl font-bold text-white mb-1">Sign in</h1>
          <p className="text-sm mb-7" style={{ color: '#8892A4' }}>
            Admin & affiliate access
          </p>

          {/* Mode toggle */}
          <div
            className="flex rounded-lg p-1 mb-6 gap-1"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {(['password', 'magic'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className="flex-1 text-sm py-1.5 rounded-md transition-all font-medium"
                style={
                  mode === m
                    ? { background: '#1D9E75', color: '#fff' }
                    : { color: '#8892A4' }
                }
              >
                {m === 'password' ? 'Password' : 'Magic Link'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm mb-5"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#F87171',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="rounded-lg px-4 py-3 text-sm mb-5"
              style={{
                background: 'rgba(29,158,117,0.1)',
                color: '#1D9E75',
                border: '1px solid rgba(29,158,117,0.25)',
              }}
            >
              {success}
            </div>
          )}

          {/* Password form */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#CBD5E1' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors"
                  style={{
                    background: '#0D1B2A',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: '#F0F2F8',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#CBD5E1' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors"
                  style={{
                    background: '#0D1B2A',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: '#F0F2F8',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-3 font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{
                  background: 'linear-gradient(to right, #1D9E75, #10b981)',
                  boxShadow: '0 0 20px rgba(29,158,117,0.25)',
                }}
              >
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          )}

          {/* Magic link form */}
          {mode === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#CBD5E1' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors"
                  style={{
                    background: '#0D1B2A',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: '#F0F2F8',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full rounded-lg py-3 font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{
                  background: 'linear-gradient(to right, #1D9E75, #10b981)',
                  boxShadow: '0 0 20px rgba(29,158,117,0.25)',
                }}
              >
                {loading ? 'Sending…' : success ? 'Link Sent ✓' : 'Send Magic Link →'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#8892A4' }}>
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Claux
          </Link>
        </p>
      </div>
    </main>
  )
}
