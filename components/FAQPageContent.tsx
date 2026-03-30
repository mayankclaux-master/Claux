'use client'

import { useState } from 'react'
import Link from 'next/link'

const allFAQs = [
  {
    category: 'About Claux',
    question: "What exactly is Claux and how is it different from an SEO tool?",
    answer: "Claux is not a tool — it's a team. While SEO tools like Semrush or Ahrefs give you data and expect you to do the work, Claux deploys 9 autonomous AI agents that actually execute your SEO strategy 24/7. Think of it as the difference between buying a gym membership and hiring a personal trainer who also does the workout for you — except the trainer never sleeps, never takes sick days, and costs 90% less than an agency."
  },
  {
    category: 'How It Works',
    question: "Will AI-written content get penalised by Google?",
    answer: "SCRIBE is trained to write in your brand voice using your existing content as reference. All content passes through a quality layer before publishing. Google penalises spammy, unhelpful content — not well-written AI-assisted content that genuinely helps users. Our clients have never received a Google penalty."
  },
  {
    category: 'How It Works',
    question: "How soon will I see results?",
    answer: "Most clients see their first ranking improvements within 30–45 days. Full measurable impact — traffic, calls, leads — is typically visible by Day 60–90 depending on your niche competition. Day 1, you get a complete 200-point audit and a ranked action plan showing exactly what's holding you back."
  },
  {
    category: 'Pricing & Plans',
    question: "Is there a free trial?",
    answer: "We don't do free trials — we do free audits. Connect your website and GBP, and our agents run a full 200-point analysis at no cost. You receive a personalised keyword opportunity report showing exactly where you rank, what you're losing, and what you can win. You only pay when you're ready for the agents to execute."
  },
  {
    category: 'Pricing & Plans',
    question: "Can I cancel anytime?",
    answer: "Yes. No contracts, no cancellation fees, no questions asked. Cancel from your dashboard before your next billing date and you won't be charged again. We're confident enough in our results that we don't need to lock you in."
  },
  {
    category: 'About Claux',
    question: "Who built Claux and why should I trust it?",
    answer: "Claux was built by a team of SEO practitioners who spent years working with India's top agencies and saw the same problems everywhere — junior staff doing senior work, clients overpaying for underperformance, and zero transparency. We trained our AI agents on SOPs written by the world's top 100 SEO leaders, then tested them on 50+ real businesses before launch. Every case study you see on our site is verified and real."
  },
  {
    category: 'How It Works',
    question: "What happens after I connect my website?",
    answer: "Within 24 hours, you receive a complete 200-point SEO audit covering technical issues, content gaps, backlink opportunities, local SEO status, and competitor analysis. You'll see exactly where you rank for your most valuable keywords, what's blocking you, and a prioritised action plan. You can review this for free — no payment required. If you choose to activate Claux, the agents start executing immediately."
  },
  {
    category: 'How It Works',
    question: "Do I need to give Claux access to my website backend?",
    answer: "For technical SEO fixes (CORE agent), yes — we need limited access to implement schema markup, fix site speed issues, and optimize crawlability. For content (SCRIBE) and GBP optimization (LOCL), we can work independently or integrate with your CMS. You maintain full control and can revoke access anytime. We never make changes without showing you the plan first."
  },
  {
    category: 'Pricing & Plans',
    question: "What's included in each plan?",
    answer: "All plans include all 9 AI agents working 24/7. The difference is scale: Starter supports 1 location with 25 keywords and 10 posts/month. Growth supports up to 3 locations with 70 keywords and 40 posts/month. Dominator supports up to 7 locations with 150 keywords and 100 posts/month. Every plan includes GBP optimization, backlink building, competitor tracking, and a live dashboard."
  },
  {
    category: 'Pricing & Plans',
    question: "Do you offer custom enterprise pricing?",
    answer: "Yes. If you have 10+ locations, need white-label solutions, or require custom SOP tuning for a unique industry, contact us. We'll build a plan tailored to your exact needs with dedicated account management and priority support."
  }
]

const categories = ['All Questions', 'About Claux', 'How It Works', 'Pricing & Plans']

export default function FAQPageContent() {
  const [activeCategory, setActiveCategory] = useState('All Questions')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredFAQs = activeCategory === 'All Questions' 
    ? allFAQs 
    : allFAQs.filter(faq => faq.category === activeCategory)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="bg-[#050508] min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 text-center max-w-3xl mx-auto px-4">
        <Link 
          href="/" 
          className="text-slate-500 text-sm hover:text-indigo-400 transition inline-flex items-center gap-2 mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full px-4 py-2 text-sm inline-block mb-6">
          ❓ Frequently Asked Questions
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Straight Answers. No Sales Pitch.
        </h1>
        
        <p className="text-slate-400 text-lg">
          Everything you want to know about Claux, AI SEO, and how we get results for Indian businesses.
        </p>
      </section>

      {/* Category Tabs */}
      <section className="pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category)
                  setOpenIndex(null)
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === category
                    ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                    : 'bg-transparent border border-gray-700 text-slate-400 hover:border-indigo-500/30 hover:text-indigo-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-gray-800/60 transition-all duration-300"
                style={{
                  background: openIndex === index ? 'rgba(99,102,241,0.02)' : 'transparent'
                }}
              >
                <div
                  className="flex justify-between items-center py-5 cursor-pointer select-none transition-all duration-300"
                  onClick={() => toggleFAQ(index)}
                  style={{
                    borderLeft: openIndex === index ? '3px solid rgba(99,102,241,0.6)' : '3px solid transparent',
                    paddingLeft: openIndex === index ? '16px' : '0'
                  }}
                >
                  <div className="flex-1 pr-4">
                    {faq.category !== 'All Questions' && (
                      <div className="text-xs text-indigo-400 font-semibold mb-1">
                        {faq.category}
                      </div>
                    )}
                    <h3 
                      className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
                        openIndex === index ? 'text-indigo-300' : 'text-white'
                      }`}
                    >
                      {faq.question}
                    </h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div
                  className="overflow-hidden transition-all duration-400"
                  style={{
                    maxHeight: openIndex === index ? '600px' : '0',
                    opacity: openIndex === index ? 1 : 0,
                    transitionProperty: 'max-height, opacity',
                    transitionDuration: '0.4s, 0.3s',
                    transitionTimingFunction: 'ease'
                  }}
                >
                  <div className="text-slate-400 text-sm sm:text-base leading-relaxed pb-5 pl-1 sm:pl-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="glass-card p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-3">
                Still have questions?
              </h3>
              <p className="text-slate-400 mb-6">
                Connect your website for a free 200-point audit and we'll answer everything specific to your business.
              </p>
              <Link href="/">
                <button className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition">
                  Get Your Free Audit
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
