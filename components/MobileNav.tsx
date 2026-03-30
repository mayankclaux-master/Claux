'use client'

import { useState } from 'react'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const handleLinkClick = (sectionId: string) => {
    setIsOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex md:hidden items-center justify-center w-10 h-10 text-white"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Full Screen Overlay Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#050508] backdrop-blur-xl z-[9999] flex flex-col">
          {/* Top Row: Logo + Close Button */}
          <div className="flex justify-between items-center px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-xl font-bold text-white">Claux</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 flex items-center justify-center text-white"
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={() => handleLinkClick('agents')}
              className="text-2xl font-semibold text-white py-4 border-b border-white/5 w-full text-center"
            >
              Agents
            </button>
            <button
              onClick={() => handleLinkClick('results')}
              className="text-2xl font-semibold text-white py-4 border-b border-white/5 w-full text-center"
            >
              Results
            </button>
            <button
              onClick={() => handleLinkClick('how-it-works')}
              className="text-2xl font-semibold text-white py-4 border-b border-white/5 w-full text-center"
            >
              How It Works
            </button>
            <button
              onClick={() => handleLinkClick('pricing')}
              className="text-2xl font-semibold text-white py-4 border-b border-white/5 w-full text-center"
            >
              Pricing
            </button>
            <button
              onClick={() => handleLinkClick('faq')}
              className="text-2xl font-semibold text-white py-4 border-b border-white/5 w-full text-center"
            >
              FAQs
            </button>
          </div>

          {/* Bottom CTAs */}
          <div className="px-4 pb-8 space-y-3">
            <button
              data-demo-trigger
              onClick={() => setIsOpen(false)}
              className="w-full px-6 py-4 border border-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all"
            >
              Watch How It Works
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-semibold text-lg hover:from-indigo-400 hover:to-violet-500 transition-all"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      )}
    </>
  )
}
