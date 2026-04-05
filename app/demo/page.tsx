'use client'

import Link from 'next/link'
import Image from 'next/image'
import VideoPlayer from '@/components/VideoPlayer'

export default function DemoPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: '#050507' }}
    >
      {/* Minimal header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <Link href="/">
          <Image
            src="/claux-logo-cropped.png"
            alt="Claux"
            width={180}
            height={48}
            className="object-contain"
            style={{ width: '180px', height: '48px', objectFit: 'contain' }}
            priority
          />
        </Link>
        <a
          href="https://rzp.io/rzp/AAmFRQiu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium px-5 py-2.5 rounded-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, #1D9E75, #0d8a64)',
            color: '#ffffff'
          }}
        >
          Get Started — ₹14,999/mo →
        </a>
      </header>

      {/* Hero text above video */}
      <div className="text-center pt-10 pb-6 px-4">
        <div
          className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-4"
          style={{
            background: 'rgba(29,158,117,0.1)',
            color: '#1D9E75',
            border: '1px solid rgba(29,158,117,0.2)'
          }}
        >
          Live Demo — 90 Seconds
        </div>
        <h1
          className="text-3xl md:text-5xl font-bold mb-3"
          style={{ color: '#F0F2F8' }}
        >
          See 9 AI Agents Replace Your
          <span style={{ color: '#1D9E75' }}> Entire SEO Agency</span>
        </h1>
        <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#8892A4' }}>
          Watch how ARIA, SCRIBE, LOCL and 6 more agents work 24/7 —
          doing in one day what agencies take 30 days to execute.
        </p>
      </div>

      {/* Video player */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-5xl">
          <VideoPlayer />

          {/* Below video CTA strip */}
          <div
            className="mt-6 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              background: 'rgba(29,158,117,0.06)',
              border: '1px solid rgba(29,158,117,0.15)'
            }}
          >
            <div>
              <p className="font-semibold text-base" style={{ color: '#F0F2F8' }}>
                Ready to replace your agency?
              </p>
              <p className="text-sm mt-0.5" style={{ color: '#8892A4' }}>
                All 9 agents active from Day 1. Starting at ₹7,499/month.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a
                href="https://rzp.io/rzp/fERD1Gq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2.5 rounded-lg font-medium transition-all"
                style={{
                  border: '1px solid rgba(29,158,117,0.4)',
                  color: '#1D9E75'
                }}
              >
                Starter — ₹7,499
              </a>
              <a
                href="https://rzp.io/rzp/AAmFRQiu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2.5 rounded-lg font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, #1D9E75, #0d8a64)',
                  color: '#ffffff'
                }}
              >
                Growth — ₹14,999 →
              </a>
              <a
                href="https://rzp.io/rzp/FSU6fsQn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2.5 rounded-lg font-medium transition-all"
                style={{
                  border: '1px solid rgba(29,158,117,0.4)',
                  color: '#1D9E75'
                }}
              >
                Dominator — ₹24,999
              </a>
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {[
              '9 AI Agents Active 24/7',
              'No Agency Retainer',
              'Results from Day 1',
              'Cancel Anytime'
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1D9E75' }} />
                <span className="text-sm" style={{ color: '#8892A4' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
