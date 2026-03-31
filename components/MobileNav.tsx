'use client'

import { useState, useEffect } from 'react'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  // Scroll lock when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
      <div className="relative z-[100]">
        <button
          onClick={() => setIsOpen(true)}
          className="flex md:hidden items-center justify-center w-10 h-10 text-white"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Full Screen Overlay Menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 flex flex-col md:hidden z-[99999]"
          style={{
            backgroundColor: '#050508',
            backdropFilter: 'blur(20px)'
          }}
        >
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
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
