'use client'

import { useState } from 'react'
import DemoModal from './DemoModal'

export default function CaseStudyCTA() {
  const [showDemoModal, setShowDemoModal] = useState(false)

  return (
    <>
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-900/30 to-violet-900/20 border border-indigo-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Want Results Like This?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Your business could be next. It takes 4 minutes to connect Claux to your website.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-8 py-3 border border-indigo-500/40 text-indigo-400 rounded-xl font-semibold hover:bg-indigo-500/10 transition"
            >
              Watch How It Works
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </>
  )
}
