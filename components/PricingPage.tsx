'use client'

import { useState } from 'react'
import DemoModal from './DemoModal'

const USD_RATE = 0.012

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for independent professionals',
    suitableFor: 'Standalone clinics, independent CAs, lawyers, restaurants, bars, small real estate firms, interior designers, coaching classes',
    monthlyINR: 7499,
    annualINR: 74990,
    accentColor: '#2DD4BF',
    recommended: false,
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
      { text: 'Up to 3 locations', included: false },
      { text: 'Priority support', included: false },
      { text: 'Up to 7 locations', included: false },
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For businesses scaling fast',
    suitableFor: 'Multispeciality clinics/hospitals, CA firms, law firms, multi-chain restaurants/bars, real estate companies (5+ projects), EdTech, SaaS, D2C brands',
    monthlyINR: 14999,
    annualINR: 149990,
    accentColor: '#6366F1',
    recommended: true,
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
      { text: 'Up to 7 locations', included: false },
    ]
  },
  {
    id: 'dominator',
    name: 'Dominator',
    tagline: 'For enterprises that demand dominance',
    suitableFor: 'Tertiary care hospitals, multinational companies, real estate (10+ projects), corporates, large consultancies, D2C brands with 100+ SKUs',
    monthlyINR: 24999,
    annualINR: 249990,
    accentColor: '#8B5CF6',
    recommended: false,
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
    ]
  }
]

const comparisonData = [
  { feature: 'AI Agents', starter: 'All 9', growth: 'All 9', dominator: 'All 9' },
  { feature: 'Keywords Tracked', starter: '25', growth: '70', dominator: '150' },
  { feature: 'Blog Posts/Month', starter: '10', growth: '40', dominator: '100' },
  { feature: 'Business Locations', starter: '1', growth: 'Up to 3', dominator: 'Up to 7' },
  { feature: 'GBP Optimization', starter: true, growth: true, dominator: true },
  { feature: 'Backlink Building', starter: true, growth: true, dominator: true },
  { feature: 'Live Dashboard', starter: true, growth: true, dominator: true },
  { feature: 'Competitor Intelligence', starter: '4 rivals', growth: '6 rivals', dominator: '10 rivals' },
  { feature: 'Monthly Ranking Report', starter: true, growth: true, dominator: true },
  { feature: 'Priority Support', starter: false, growth: true, dominator: true },
  { feature: 'Dedicated Account Manager', starter: false, growth: false, dominator: true },
  { feature: 'Custom SOP Tuning', starter: false, growth: false, dominator: true },
]

const faqs = [
  {
    question: 'Is there a free trial?',
    answer: "We don't do free trials — we do free audits. Connect your Google Business Profile and website, and we'll show you exactly where you're losing customers right now. No credit card required. If you like what you see, pick a plan and we start executing immediately."
  },
  {
    question: 'Can I upgrade or downgrade?',
    answer: "Yes, anytime from your dashboard. Upgrade takes effect immediately. Downgrade takes effect at the end of your current billing cycle. No penalties, no hassle."
  },
  {
    question: 'What if I have multiple locations?',
    answer: "Starter supports 1 location. Growth supports up to 3 locations. Dominator supports up to 7 locations. Need more? Contact us for custom enterprise pricing for 10+ locations."
  },
  {
    question: 'How is Claux different from an SEO agency?',
    answer: "An agency assigns junior staff to your account and charges ₹50,000–₹2,00,000/month. Claux uses 9 AI agents that work 24/7, never sleep, never quit, and cost a fraction of the price. You get the dashboard, the data, and the results — without the overhead."
  },
  {
    question: 'How soon will I see results?',
    answer: "Most clients see improvements in 30–45 days. Local search visibility often improves within 2 weeks. Organic rankings take 60–90 days depending on competition. We show you live progress in your dashboard every single day."
  },
  {
    question: 'Do you have enterprise pricing?',
    answer: "Yes. If you have 10+ locations, need white-label solutions, or require custom SOP tuning, contact us for enterprise pricing. We'll build a plan that fits your exact needs."
  }
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [showDemoModal, setShowDemoModal] = useState(false)

  const getPrice = (plan: typeof plans[0], cycle: 'monthly' | 'annual', curr: 'INR' | 'USD') => {
    const basePrice = cycle === 'monthly' ? plan.monthlyINR : Math.round(plan.annualINR / 12)
    if (curr === 'USD') {
      return '$' + Math.round(basePrice * USD_RATE)
    }
    return '₹' + basePrice.toLocaleString('en-IN')
  }

  const getAnnualTotal = (plan: typeof plans[0], curr: 'INR' | 'USD') => {
    if (curr === 'USD') {
      return '$' + Math.round(plan.annualINR * USD_RATE)
    }
    return '₹' + plan.annualINR.toLocaleString('en-IN')
  }

  const getSavings = (plan: typeof plans[0], curr: 'INR' | 'USD') => {
    const savings = (plan.monthlyINR * 12) - plan.annualINR
    if (curr === 'USD') {
      return '$' + Math.round(savings * USD_RATE)
    }
    return '₹' + savings.toLocaleString('en-IN')
  }

  return (
    <div className="bg-[#050508] min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 text-center max-w-3xl mx-auto px-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full px-4 py-2 text-sm inline-block mb-6">
          💰 Transparent Pricing — No Hidden Fees
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Stop Overpaying for Underperformance
        </h1>
        
        <p className="text-slate-400 text-lg mb-8">
          One plan. 9 AI agents. 24/7 execution. Priced in ₹ for Indian businesses.
        </p>

        {/* Billing and Currency Toggles */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {/* Billing Toggle */}
          <div className="bg-gray-900 border border-gray-800 rounded-full p-1 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`${
                billingCycle === 'monthly'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-white'
              } rounded-full px-5 py-2 text-sm font-semibold transition`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`${
                billingCycle === 'annual'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-white'
              } rounded-full px-5 py-2 text-sm font-semibold transition`}
            >
              Annual
            </button>
          </div>

          {billingCycle === 'annual' && (
            <div className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-full px-3 py-1 text-xs font-semibold">
              Save up to 17%
            </div>
          )}

          {/* Currency Toggle */}
          <div className="bg-gray-800 border border-gray-700 rounded-full p-1 inline-flex">
            <button
              onClick={() => setCurrency('INR')}
              className={`${
                currency === 'INR'
                  ? 'bg-gray-600 text-white'
                  : 'text-slate-400 hover:text-white'
              } rounded-full px-4 py-1.5 text-xs font-semibold transition`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`${
                currency === 'USD'
                  ? 'bg-gray-600 text-white'
                  : 'text-slate-400 hover:text-white'
              } rounded-full px-4 py-1.5 text-xs font-semibold transition`}
            >
              $ USD
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card relative flex flex-col transition-all duration-300 ${
                plan.recommended
                  ? 'border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)] md:scale-105'
                  : ''
              }`}
              style={{
                borderColor: plan.recommended ? 'rgba(99,102,241,0.5)' : `rgba(${parseInt(plan.accentColor.slice(1,3), 16)}, ${parseInt(plan.accentColor.slice(3,5), 16)}, ${parseInt(plan.accentColor.slice(5,7), 16)}, 0.2)`
              }}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  Most Popular 🔥
                </div>
              )}

              {/* Accent Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: plan.accentColor }}
              />

              {/* Header */}
              <div className="p-6 pb-0">
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">{plan.tagline}</p>
              </div>

              {/* Price Block */}
              <div className="px-6 py-4">
                <div className="mb-2">
                  <span className="text-4xl font-bold" style={{ color: plan.accentColor }}>
                    {getPrice(plan, billingCycle, currency)}
                  </span>
                  <span className="text-slate-400 text-base ml-1">/month</span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 text-xs">
                      {getAnnualTotal(plan, currency)} billed annually
                    </span>
                    <span className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                      Save {getSavings(plan, currency)}
                    </span>
                  </div>
                )}
                <div className="border-t border-white/5 mt-4" />
              </div>

              {/* Suitable For */}
              <div className="px-6 pb-4">
                <div className="text-xs font-bold tracking-widest text-slate-600 uppercase mb-2">
                  BEST FOR
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {plan.suitableFor}
                </p>
              </div>

              {/* Features */}
              <div className="px-6 pb-6 flex-1">
                <div className="text-xs font-bold tracking-widest text-slate-600 uppercase mb-3">
                  WHAT'S INCLUDED
                </div>
                <div className="space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: plan.accentColor }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="p-6 pt-0 mt-auto">
                {plan.id === 'growth' ? (
                  <a href="https://rzp.io/rzp/AAmFRQiu" target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl py-3 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition block text-center">
                    Get Started with Growth
                  </a>
                ) : (
                  <a
                    href={plan.id === 'starter' ? 'https://rzp.io/rzp/fERD1Gq' : 'https://rzp.io/rzp/FSU6fsQn'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-xl py-3 font-semibold transition"
                    style={{
                      border: `1px solid ${plan.accentColor}66`,
                      color: plan.accentColor
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${plan.accentColor}1A`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {plan.id === 'starter' ? 'Get Started with Starter' : 'Get Started with Dominator'}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">
              Compare Plans Side by Side
            </h2>
            <p className="text-slate-400 text-lg">
              Every feature, every plan — no asterisks, no surprises
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="text-slate-500 text-sm font-medium text-left py-4 px-6">Feature</th>
                  <th className="text-sm font-bold py-4 px-6" style={{ color: '#2DD4BF' }}>Starter</th>
                  <th className="text-sm font-bold py-4 px-6" style={{ color: '#6366F1' }}>Growth</th>
                  <th className="text-sm font-bold py-4 px-6" style={{ color: '#8B5CF6' }}>Dominator</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 1 ? 'bg-white/[0.02]' : 'bg-transparent'} hover:bg-white/[0.03] transition`}
                  >
                    <td className="text-slate-300 text-sm font-medium py-3.5 px-6">{row.feature}</td>
                    <td className="text-center py-3.5 px-6">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? (
                          <svg className="w-5 h-5 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-slate-300 text-sm">{row.starter}</span>
                      )}
                    </td>
                    <td className="text-center py-3.5 px-6">
                      {typeof row.growth === 'boolean' ? (
                        row.growth ? (
                          <svg className="w-5 h-5 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-slate-300 text-sm">{row.growth}</span>
                      )}
                    </td>
                    <td className="text-center py-3.5 px-6">
                      {typeof row.dominator === 'boolean' ? (
                        row.dominator ? (
                          <svg className="w-5 h-5 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-slate-300 text-sm">{row.dominator}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            <div className="glass-card text-center p-5">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="text-white font-semibold mb-1">No lock-in contracts</h4>
              <p className="text-slate-400 text-sm">Cancel anytime, no questions asked</p>
            </div>
            <div className="glass-card text-center p-5">
              <div className="text-2xl mb-2">💳</div>
              <h4 className="text-white font-semibold mb-1">No credit card to start</h4>
              <p className="text-slate-400 text-sm">Connect and audit for free</p>
            </div>
            <div className="glass-card text-center p-5">
              <div className="flex justify-center mb-2">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-1">10x Growth 10x Faster</h4>
              <p className="text-slate-400 text-sm">Much much better than Agency</p>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center gradient-text">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                    className="w-full text-left p-6 flex items-center justify-between hover:bg-white/[0.02] transition"
                  >
                    <span className="text-white font-semibold pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-indigo-400 flex-shrink-0 transition-transform ${
                        openFAQ === idx ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFAQ === idx && (
                    <div className="px-6 pb-6">
                      <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-900/30 to-violet-900/20 border border-indigo-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Still unsure which plan is right for you?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Watch a 2-minute walkthrough of Claux in action, then decide.
          </p>
          <button
            onClick={() => setShowDemoModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-3 rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition"
          >
            Watch How It Works
          </button>
        </div>
      </section>

      {/* Demo Modal */}
      <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </div>
  )
}
