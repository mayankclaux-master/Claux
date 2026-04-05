'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AFFILIATE_TOKENS } from '@/app/affiliates/tokens'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export default function AffiliateLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [isSubmittingMagic, setIsSubmittingMagic] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const clearNotices = () => {
    setMessage('')
    setError('')
  }

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearNotices()

    if (!supabaseUrl || !anonKey) {
      setError('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    setIsSubmittingPassword(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession()

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      if (!session?.access_token) {
        setError('Login succeeded, but no session was created. Please retry or contact support.')
        return
      }

      window.location.href = '/affiliate/dashboard'
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleMagicLink = async () => {
    clearNotices()

    if (!supabaseUrl || !anonKey) {
      setError('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (!email) {
      setError('Enter your email first to receive a magic link.')
      return
    }

    setIsSubmittingMagic(true)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/affiliate/dashboard`
        }
      })

      if (otpError) {
        setError(otpError.message)
        return
      }

      setMessage('Magic link sent. Check your email inbox.')
    } finally {
      setIsSubmittingMagic(false)
    }
  }

  return (
    <main
      className={`min-h-screen ${AFFILIATE_TOKENS.backgroundClass} ${AFFILIATE_TOKENS.primaryFontClass} text-white flex items-center justify-center px-4`}
      style={{ fontFamily: AFFILIATE_TOKENS.primaryFontFamily }}
    >
      <section className={`w-full max-w-md glass-card ${AFFILIATE_TOKENS.cardRadiusClass} border ${AFFILIATE_TOKENS.borderClass}`}>
        <h1 className="text-2xl font-bold text-center mb-2">Affiliate Login</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Access your Claux affiliate dashboard</p>

        <form className="space-y-4" onSubmit={handlePasswordLogin}>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-claux-teal"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-claux-teal"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingPassword}
            className={`w-full px-5 py-3 ${AFFILIATE_TOKENS.buttonRadiusClass} font-semibold text-white transition-all disabled:opacity-60 ${AFFILIATE_TOKENS.ctaGradientClass} ${AFFILIATE_TOKENS.ctaShadowClass}`}
          >
            {isSubmittingPassword ? 'Signing in...' : 'Sign In with Password'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-[0.18em] text-claux-muted">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleMagicLink}
          disabled={isSubmittingMagic}
          className="w-full px-5 py-3 rounded-lg border border-white/15 bg-white/5 font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-60"
        >
          {isSubmittingMagic ? 'Sending...' : 'Send Magic Link'}
        </button>

        {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </section>
    </main>
  )
}
