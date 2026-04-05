'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import VideoPlayer from '@/components/VideoPlayer'

const DISCOUNT = 0.15

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for independent professionals',
    suitableFor:
      'Standalone clinics, independent CAs, lawyers, restaurants, bars, small real estate firms, interior designers, coaching classes',
    monthlyINR: 7499,
    accentColor: '#2DD4BF',
    recommended: false,
    payUrl: 'https://rzp.io/rzp/fERD1Gq',
    features: [
      { text: 'All 9 AI Agents active', included: true },
      { text: '25 keywords tracked', included: true },
      { text: '10 blog posts/month', included: true },
      { text: 'GBP optimization', included: true },
      { text: 'Monthly ranking report', included: true },
      { text: '1 business location', included: true },
      { text: 'Backlink building', included: true },
      { text: 'Competitor intelligence (4 rivals)', included: true },
      { text: 'Live dashboard', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For businesses scaling fast',
    suitableFor:
      'Multispeciality clinics/hospitals, CA firms, law firms, multi-chain restaurants, real estate companies (5+ projects), EdTech, SaaS, D2C brands',
    monthlyINR: 14999,
    accentColor: '#6366F1',
    recommended: true,
    payUrl: 'https://rzp.io/rzp/AAmFRQiu',
    features: [
      { text: 'All 9 AI Agents active', included: true },
      { text: '70 keywords tracked', included: true },
      { text: '40 blog posts/month', included: true },
      { text: 'GBP optimization', included: true },
      { text: 'Monthly ranking report', included: true },
      { text: 'Up to 3 business locations', included: true },
      { text: 'Backlink building', included: true },
      { text: 'Competitor intelligence (6 rivals)', included: true },
      { text: 'Live dashboard', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    id: 'dominator',
    name: 'Dominator',
    tagline: 'For enterprises that demand dominance',
    suitableFor:
      'Tertiary care hospitals, multinational companies, real estate (10+ projects), corporates, large consultancies, D2C brands with 100+ SKUs',
    monthlyINR: 24999,
    accentColor: '#8B5CF6',
    recommended: false,
    payUrl: 'https://rzp.io/rzp/FSU6fsQn',
    features: [
      { text: 'All 9 AI Agents active', included: true },
      { text: '150 keywords tracked', included: true },
      { text: '100 blog posts/month', included: true },
      { text: 'GBP optimization', included: true },
      { text: 'Monthly ranking report', included: true },
      { text: 'Up to 7 business locations', included: true },
      { text: 'Backlink building', included: true },
      { text: 'Competitor intelligence (10 rivals)', included: true },
      { text: 'Live dashboard', included: true },
      { text: 'Priority support', included: true },
    ],
  },
]

const AGENTS = [
  'Keyword Intelligence Agent',
  'Content Writer Agent',
  'GBP Optimizer Agent',
  'Backlink Builder Agent',
  'Competitor Spy Agent',
  'Rank Tracker Agent',
  'Report Generator Agent',
  'Live Dashboard Agent',
  'Strategy Advisor Agent',
]

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function discountedPrice(monthly: number): number {
  return Math.round(monthly * (1 - DISCOUNT))
}

function savedAmount(monthly: number): number {
  return monthly - discountedPrice(monthly)
}

function accentRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type LeadForm = {
  full_name: string
  website_url: string
  email: string
  whatsapp: string
}

const EMPTY_FORM: LeadForm = {
  full_name: '',
  website_url: '',
  email: '',
  whatsapp: '',
}

export default function PartnerOfferPage() {
  const [affiliateCode, setAffiliateCode] = useState('')
  const [affiliateName, setAffiliateName] = useState('')
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    const code = getCookie('claux_ref')
    if (!code) return
    setAffiliateCode(code)

    fetch(`/api/affiliate/referrer?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data: { name?: string | null }) => {
        if (data.name) setAffiliateName(String(data.name))
      })
      .catch(() => {})
  }, [])

  const handleChange = (field: keyof LeadForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/affiliate/partner-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          affiliate_code: affiliateCode || undefined,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Unable to submit. Please try again.')
      }

      setUnlocked(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = affiliateName || affiliateCode || null

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white font-sans">
      {/* ── Sticky Urgency Banner ── */}
      <div className="sticky top-0 z-50 border-b border-claux-teal/25 bg-[#0D1B2A]/95 backdrop-blur-md px-4 py-3">
        <p className="text-center text-sm">
          <span className="font-bold text-claux-teal">Partner Exclusive: 15% Discount Applied</span>
          {displayName && (
            <>
              {' '}via{' '}
              <span className="font-semibold text-white">{displayName}</span>.
            </>
          )}
          <span className="text-[#8892A4]"> Valid for this session only.</span>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {!unlocked ? (
          /* ─────────────── LEAD GATE ─────────────── */
          <section className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <Image
                src="/claux-logo-cropped.png"
                alt="Claux"
                width={140}
                height={38}
                className="object-contain mx-auto mb-8"
                priority
              />
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
                See How 9 AI Agents Replace Your{' '}
                <span className="text-claux-teal">Junior Marketing Executive</span>
              </h1>
              <p className="text-[#8892A4] text-base leading-relaxed">
                Enter your details to unlock your{' '}
                <span className="text-white font-semibold">15% Partner Discount</span>{' '}
                + 5-Min Strategy Demo.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#091525] p-6 sm:p-8">
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="full_name" className="block text-sm text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-claux-teal transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="website_url" className="block text-sm text-gray-300 mb-1.5">
                    Website URL
                  </label>
                  <input
                    id="website_url"
                    type="url"
                    value={form.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-claux-teal transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="you@business.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-claux-teal transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm text-gray-300 mb-1.5">
                    WhatsApp (with country code)
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    placeholder="+919876543210"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-claux-teal transition-colors"
                  />
                </div>

                {submitError && (
                  <p className="text-sm text-red-400">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg px-6 py-3.5 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(to right, #1D9E75, #10b981)',
                    boxShadow: '0 0 24px rgba(29, 158, 117, 0.3)',
                  }}
                >
                  {submitting ? 'Unlocking...' : 'Unlock My 15% Discount →'}
                </button>
              </form>
            </div>

            <p className="mt-4 text-center text-xs text-gray-600">
              No spam. Your details are used solely for your strategy session.
            </p>
          </section>
        ) : (
          /* ─────────────── UNLOCKED CONTENT ─────────────── */
          <div className="space-y-16">

            {/* ── Video Player ── */}
            <section>
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-claux-teal mb-2">
                  Your 5-Minute Strategy Demo
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Watch Claux&apos;s 9 AI Agents in Action
                </h2>
              </div>

              <VideoPlayer />
            </section>

            {/* ── 9 AI Agents Authority Strip ── */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#091525] p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-claux-teal mb-2">
                What You&apos;re Getting
              </p>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                9 AI Agents. 24/7 Execution. No Junior Executive Required.
              </h3>
              <p className="text-[#8892A4] text-sm leading-relaxed mb-6">
                An agency assigns a junior executive to your account and charges ₹50,000–₹2,00,000/month.
                Claux deploys 9 specialist AI agents that work around the clock, never miss a deadline,
                and cost a fraction of what a single hire would.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AGENTS.map((agent) => (
                  <div
                    key={agent}
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                  >
                    <span className="text-claux-teal text-sm font-bold">✓</span>
                    <span className="text-xs text-gray-300">{agent}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Pricing Cards with FOMO ── */}
            <section>
              <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-claux-teal mb-2">
                  Partner Pricing
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Your 15% Partner Discount — Applied
                </h2>
                <p className="text-[#8892A4] text-sm max-w-lg mx-auto">
                  Prices shown include your exclusive partner discount. Standard pricing resumes
                  after this session.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {PLANS.map((plan) => {
                  const original = plan.monthlyINR
                  const discounted = discountedPrice(original)
                  const saved = savedAmount(original)

                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col rounded-2xl border bg-[#091525] overflow-hidden transition-all duration-300 ${
                        plan.recommended ? 'md:scale-105' : ''
                      }`}
                      style={{
                        borderColor: plan.recommended
                          ? accentRgba('#6366F1', 0.5)
                          : accentRgba(plan.accentColor, 0.2),
                        boxShadow: plan.recommended
                          ? '0 0 40px rgba(99,102,241,0.12)'
                          : 'none',
                      }}
                    >
                      {/* Most Popular badge */}
                      {plan.recommended && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap z-10">
                          Most Popular 🔥
                        </div>
                      )}

                      {/* Accent top bar */}
                      <div
                        className="h-[3px] w-full shrink-0"
                        style={{ background: plan.accentColor }}
                      />

                      {/* Header */}
                      <div className="px-6 pt-6 pb-0">
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-xs text-[#8892A4] mt-1 mb-4">{plan.tagline}</p>
                      </div>

                      {/* Price block */}
                      <div className="px-6 py-4">
                        {/* Original — red strikethrough */}
                        <p className="text-sm text-red-400/70 line-through mb-1">
                          ₹{original.toLocaleString('en-IN')}/month
                        </p>

                        {/* Discounted — teal */}
                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span
                            className="text-4xl font-bold"
                            style={{ color: '#1D9E75' }}
                          >
                            ₹{discounted.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[#8892A4] text-sm">/month</span>
                        </div>

                        {/* Savings label */}
                        <span
                          className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                          style={{
                            color: '#1D9E75',
                            borderColor: 'rgba(29,158,117,0.25)',
                            background: 'rgba(29,158,117,0.08)',
                          }}
                        >
                          You save ₹{saved.toLocaleString('en-IN')} per month
                        </span>

                        <div className="border-t border-white/[0.06] mt-4" />
                      </div>

                      {/* Best for */}
                      <div className="px-6 pb-4">
                        <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-1.5">
                          Best for
                        </p>
                        <p className="text-xs text-[#8892A4] leading-relaxed">
                          {plan.suitableFor}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="px-6 pb-6 flex-1">
                        <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-3">
                          What&apos;s included
                        </p>
                        <div className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              {feature.included ? (
                                <svg
                                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                                  style={{ color: plan.accentColor }}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-700"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                              <span
                                className={`text-xs ${
                                  feature.included
                                    ? 'text-gray-300'
                                    : 'text-gray-700 line-through'
                                }`}
                              >
                                {feature.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="px-6 pb-6 mt-auto">
                        <a
                          href={plan.payUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all"
                          style={
                            plan.recommended
                              ? {
                                  background:
                                    'linear-gradient(to right, #6366F1, #8B5CF6)',
                                  color: 'white',
                                  boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                                }
                              : {
                                  border: `1px solid ${accentRgba(plan.accentColor, 0.4)}`,
                                  color: plan.accentColor,
                                }
                          }
                        >
                          Get Partner Price — {plan.name}
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-center text-xs text-gray-600 mt-6">
                Partner discount applied at checkout. Prices in INR. Cancel anytime. No lock-in.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
