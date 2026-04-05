'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  {
    question: "What exactly is Claux and how is it different from an SEO tool?",
    answer: "Claux is not a tool — it's a team. While SEO tools like Semrush or Ahrefs give you data and expect you to do the work, Claux deploys 9 autonomous AI agents that actually execute your SEO strategy 24/7. Think of it as the difference between buying a gym membership and hiring a personal trainer who also does the workout for you — except the trainer never sleeps, never takes sick days, and costs 90% less than an agency."
  },
  {
    question: "Will AI-written content get penalised by Google?",
    answer: "SCRIBE is trained to write in your brand voice using your existing content as reference. All content passes through a quality layer before publishing. Google penalises spammy, unhelpful content — not well-written AI-assisted content that genuinely helps users. Our clients have never received a Google penalty."
  },
  {
    question: "How soon will I see results?",
    answer: "Most clients see their first ranking improvements within 30–45 days. Full measurable impact — traffic, calls, leads — is typically visible by Day 60–90 depending on your niche competition. Day 1, you get a complete 200-point audit and a ranked action plan showing exactly what's holding you back."
  },
  {
    question: "Is there a free trial?",
    answer: "We provide a full SEO baseline audit to identify growth gaps. No credit card required to see your data. Connect your website and GBP and get your SEO baseline immediately — a personalised keyword opportunity report showing exactly where you rank, what you're losing, and what you can win. You only pay when you're ready for the agents to execute."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. No contracts, no cancellation fees, no questions asked. Cancel from your dashboard before your next billing date and you won't be charged again. We're confident enough in our results that we don't need to lock you in."
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="relative bg-[#0D0D14] py-10 sm:py-16 md:py-24">
      {/* Mesh Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full px-4 py-2 text-sm inline-block mb-4">
            💬 Got Questions?
          </div>
          <h2 className="gradient-text text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Everything You Want to Know
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            No fluff. No vague answers. Just straight talk about Claux.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
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
                <h3 
                  className={`text-base sm:text-lg font-semibold transition-colors duration-300 pr-4 ${
                    openIndex === index ? 'text-indigo-300' : 'text-white'
                  }`}
                >
                  {faq.question}
                </h3>
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

        {/* See All FAQs Link */}
        <div className="text-center mt-10">
          <Link 
            href="/faq"
            className="inline-flex items-center gap-2 text-indigo-400 font-semibold text-sm hover:text-indigo-300 transition"
          >
            SEE ALL FAQs
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <div className="text-slate-600 text-xs mt-1">
            10 detailed questions answered
          </div>
        </div>
      </div>
    </section>
  )
}
