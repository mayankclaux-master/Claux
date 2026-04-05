"use client"

import { useMemo, useState } from 'react'

import { Footer } from './Footer'
import { Header } from './Header'
import { AFFILIATE_TOKENS } from './tokens'

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6 text-claux-teal" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
    </svg>
  )
}

function ClapperboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6 text-claux-teal" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m10 8 3-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m18 8 3-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m2 8 3-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 3-6" />
    </svg>
  )
}

function HandCoinsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6 text-claux-teal" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 15h5a3 3 0 1 1 0 6H5a3 3 0 0 1-3-3v-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8h-6a3 3 0 0 0-3 3v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 15h4" />
    </svg>
  )
}

const STEPS = [
  {
    title: 'Sign Up & Get Link',
    description: 'Apply once and get your personalized Claux tracking link instantly.',
    Icon: LinkIcon
  },
  {
    title: 'Post 2 Pieces of Content',
    description: 'Publish two reels/posts about Claux as an AI SEO growth tool for businesses.',
    Icon: ClapperboardIcon
  },
  {
    title: 'Earn Every Month',
    description: 'Get 20-30% commissions on every conversion plus recurring monthly payouts.',
    Icon: HandCoinsIcon
  }
]

const TRUST_BADGES = ['₹18,000 earned last month', 'Payment within 7 days', 'No approval wait']

const COMMISSION_TIERS = [
  {
    tier: 'Starter',
    sales: '1-3 sales/mo',
    oneTime: '20% one-time',
    recurring: 'No recurring',
    bonus: '-'
  },
  {
    tier: 'Silver',
    sales: '4-10 sales/mo',
    oneTime: '25% one-time',
    recurring: '10% monthly recurring',
    bonus: '₹5,000 bonus'
  },
  {
    tier: 'Gold',
    sales: '11+ sales/mo',
    oneTime: '30% one-time',
    recurring: '15% monthly recurring',
    bonus: '₹15,000 bonus'
  }
]

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Canada', 'Australia', 'Other']
const PLATFORMS = ['Instagram', 'YouTube', 'LinkedIn', 'X (Twitter)', 'Facebook', 'Other']

type FormData = {
  full_name: string
  email: string
  whatsapp_number: string
  country: string
  primary_platform: string
  social_handle: string
  content_niche: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const INITIAL_FORM: FormData = {
  full_name: '',
  email: '',
  whatsapp_number: '',
  country: '',
  primary_platform: '',
  social_handle: '',
  content_niche: ''
}

function validateField(name: keyof FormData, value: string): string {
  const trimmed = value.trim()

  if (!trimmed) return 'This field is required.'

  if (name === 'email') {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!emailOk) return 'Enter a valid email address.'
  }

  if (name === 'whatsapp_number') {
    const phoneOk = /^\+[1-9][0-9]{7,14}$/.test(trimmed)
    if (!phoneOk) return 'Use country code, e.g. +919876543210.'
  }

  if (name === 'social_handle' && trimmed.length < 3) {
    return 'Handle is too short.'
  }

  return ''
}

export default function AffiliatesPage() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const isFormValid = useMemo(() => {
    const allErrors = Object.keys(INITIAL_FORM).reduce((acc, key) => {
      const field = key as keyof FormData
      acc[field] = validateField(field, formData[field])
      return acc
    }, {} as FormErrors)

    return Object.values(allErrors).every((item) => !item)
  }, [formData])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }))
    }
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field]) }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')

    const nextTouched = Object.keys(INITIAL_FORM).reduce((acc, key) => {
      acc[key as keyof FormData] = true
      return acc
    }, {} as Partial<Record<keyof FormData, boolean>>)
    setTouched(nextTouched)

    const nextErrors = Object.keys(INITIAL_FORM).reduce((acc, key) => {
      const field = key as keyof FormData
      acc[field] = validateField(field, formData[field])
      return acc
    }, {} as FormErrors)
    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'Unable to submit your application.')
      }

      setIsSuccess(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit your application.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className={`min-h-screen ${AFFILIATE_TOKENS.backgroundClass} ${AFFILIATE_TOKENS.primaryFontClass} text-white`}
      style={{ fontFamily: AFFILIATE_TOKENS.primaryFontFamily }}
    >
      <Header />

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              Earn ₹5,000-20,000 Every Month. Just 2 Reels.
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed mb-8 max-w-3xl mx-auto">
              Join Claux&apos;s affiliate program. Post 2 pieces of content about an AI SEO tool. Earn 20-30% commission on every sale - plus recurring monthly income.
            </p>

            <a
              href="#signup-form"
              className={`inline-flex items-center justify-center px-8 py-4 ${AFFILIATE_TOKENS.buttonRadiusClass} font-semibold text-lg text-white transition-all ${AFFILIATE_TOKENS.ctaGradientClass} ${AFFILIATE_TOKENS.ctaShadowClass}`}
            >
              Apply to Become an Affiliate
            </a>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 rounded-full text-sm border border-white/15 bg-white/5 text-gray-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.22em] text-claux-teal mb-3">How It Works</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Simple 3-Step Affiliate Flow</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {STEPS.map((step, index) => (
              <article
                key={step.title}
                className={`glass-card ${AFFILIATE_TOKENS.cardRadiusClass} border ${AFFILIATE_TOKENS.borderClass} bg-white/[0.02]`}
              >
                <div className="mb-5">
                  <step.Icon />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-claux-muted mb-2">Step {index + 1}</p>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className={`${AFFILIATE_TOKENS.bodyClass} leading-relaxed`}>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="commissions" className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.22em] text-claux-teal mb-3">Commissions</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Commission Tiers</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03]">
                <tr className="border-b border-white/10 text-gray-300">
                  <th className="px-5 py-4 font-semibold">Tier</th>
                  <th className="px-5 py-4 font-semibold">Sales Volume</th>
                  <th className="px-5 py-4 font-semibold">One-Time</th>
                  <th className="px-5 py-4 font-semibold">Recurring</th>
                  <th className="px-5 py-4 font-semibold">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_TIERS.map((tier) => (
                  <tr key={tier.tier} className="border-b last:border-b-0 border-white/10">
                    <td className="px-5 py-4 font-semibold text-white">{tier.tier}</td>
                    <td className="px-5 py-4 text-gray-300">{tier.sales}</td>
                    <td className="px-5 py-4 text-gray-300">{tier.oneTime}</td>
                    <td className="px-5 py-4 text-gray-300">{tier.recurring}</td>
                    <td className="px-5 py-4 text-gray-300">{tier.bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-center text-gray-300">
            Refer 5 subscribers: ₹9,374 new + ₹3,750 recurring next month = ₹13,124 total
          </p>
        </div>
      </section>

      <section id="signup-form" className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card border border-white/10">
            <h3 className="text-2xl font-bold mb-6 text-center">Affiliate Application</h3>

            {isSuccess ? (
              <div className="text-center py-10">
                <p className="text-2xl font-semibold text-claux-teal">✓ Application received! Check your WhatsApp</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="full_name" className="block text-sm text-gray-300 mb-2">Full Name</label>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    onBlur={() => handleBlur('full_name')}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-claux-teal"
                  />
                  {touched.full_name && errors.full_name && <p className="mt-1 text-sm text-red-400">{errors.full_name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-gray-300 mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-claux-teal"
                  />
                  {touched.email && errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="whatsapp_number" className="block text-sm text-gray-300 mb-2">WhatsApp Number (with country code)</label>
                  <input
                    id="whatsapp_number"
                    type="tel"
                    placeholder="+919876543210"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                    onBlur={() => handleBlur('whatsapp_number')}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-claux-teal"
                  />
                  {touched.whatsapp_number && errors.whatsapp_number && <p className="mt-1 text-sm text-red-400">{errors.whatsapp_number}</p>}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm text-gray-300 mb-2">Country</label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    onBlur={() => handleBlur('country')}
                    className="w-full rounded-lg border border-white/15 bg-[#091525] px-4 py-3 text-white outline-none focus:border-claux-teal"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {touched.country && errors.country && <p className="mt-1 text-sm text-red-400">{errors.country}</p>}
                </div>

                <div>
                  <label htmlFor="primary_platform" className="block text-sm text-gray-300 mb-2">Primary Platform</label>
                  <select
                    id="primary_platform"
                    value={formData.primary_platform}
                    onChange={(e) => handleChange('primary_platform', e.target.value)}
                    onBlur={() => handleBlur('primary_platform')}
                    className="w-full rounded-lg border border-white/15 bg-[#091525] px-4 py-3 text-white outline-none focus:border-claux-teal"
                  >
                    <option value="">Select platform</option>
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                  {touched.primary_platform && errors.primary_platform && <p className="mt-1 text-sm text-red-400">{errors.primary_platform}</p>}
                </div>

                <div>
                  <label htmlFor="social_handle" className="block text-sm text-gray-300 mb-2">Social Handle</label>
                  <input
                    id="social_handle"
                    type="text"
                    placeholder="@yourhandle"
                    value={formData.social_handle}
                    onChange={(e) => handleChange('social_handle', e.target.value)}
                    onBlur={() => handleBlur('social_handle')}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-claux-teal"
                  />
                  {touched.social_handle && errors.social_handle && <p className="mt-1 text-sm text-red-400">{errors.social_handle}</p>}
                </div>

                <div>
                  <label htmlFor="content_niche" className="block text-sm text-gray-300 mb-2">Content Niche</label>
                  <input
                    id="content_niche"
                    type="text"
                    placeholder="SEO, Marketing, AI tools..."
                    value={formData.content_niche}
                    onChange={(e) => handleChange('content_niche', e.target.value)}
                    onBlur={() => handleBlur('content_niche')}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-claux-teal"
                  />
                  {touched.content_niche && errors.content_niche && <p className="mt-1 text-sm text-red-400">{errors.content_niche}</p>}
                </div>

                {submitError && <p className="text-sm text-red-400">{submitError}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${AFFILIATE_TOKENS.ctaGradientClass}`}
                >
                  {isSubmitting ? 'Submitting...' : 'Apply Now - Get My Tracking Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
