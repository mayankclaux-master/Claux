'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HorizontalCarousel from '@/components/HorizontalCarousel'
import { caseStudies, type CaseStudy } from '@/lib/caseStudiesData'

function CaseStudyCard({ study }: { study: CaseStudy }) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  return (
    <div 
      className="flex flex-col cursor-pointer transition-all duration-[350ms] overflow-hidden group" 
      onClick={() => router.push(`/case-studies/${study.id}`)}
      style={{
        minWidth: '380px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(12px)',
        boxShadow: isHovered 
          ? `0 0 0 1px ${study.accentColor}33, 0 0 40px ${study.accentColor}1A, 0 24px 48px rgba(0,0,0,0.5)`
          : '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        borderColor: isHovered ? `${study.accentColor}66` : 'rgba(255, 255, 255, 0.07)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="accent-bar transition-all duration-300" 
        style={{ 
          width: '100%', 
          height: isHovered ? '5px' : '3px', 
          background: study.accentColor 
        }}
      ></div>
      
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex items-center gap-2">
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold" 
            style={{ 
              background: `${study.accentColor}1F`, 
              color: study.accentColor, 
              border: `1px solid ${study.accentColor}40` 
            }}
          >
            {study.industry}
          </span>
          <span className="text-xs text-slate-500">{study.location}</span>
        </div>
        <div 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" 
          style={{ 
            background: 'rgba(16,185,129,0.08)', 
            border: '1px solid rgba(16,185,129,0.2)', 
            color: '#6EE7B7' 
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          ✓ Verified
        </div>
      </div>
      
      <div className="px-4 sm:px-6 pt-4">
        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{study.headline}</h3>
      </div>
      
      <div className="flex justify-between items-start px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-5">
        <div>
          <div 
            className="font-extrabold leading-none text-4xl sm:text-5xl" 
            style={{ color: study.accentColor }}
          >
            {study.metric}
          </div>
          <div className="text-sm font-medium uppercase tracking-widest text-slate-400 mt-1">
            {study.metricLabel}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-300">
            {study.beforeAfter.split('→')[0]} 
            <span style={{ color: study.accentColor }}>→</span> 
            {study.beforeAfter.split('→')[1]}
          </div>
          <div className="text-xs text-slate-500 mt-1">{study.timeline}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 px-4 sm:px-6 pb-4 sm:pb-5">
        <span className="px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 text-slate-300 text-xs rounded-full">
          {study.pill1}
        </span>
        <span className="px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 text-slate-300 text-xs rounded-full">
          {study.pill2}
        </span>
        <span className="px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 text-slate-300 text-xs rounded-full">
          {study.pill3}
        </span>
      </div>
      
      <div 
        className="mx-4 sm:mx-6" 
        style={{ 
          height: '1px', 
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' 
        }}
      ></div>
      
      <div className="px-4 sm:px-6 pt-4 pb-4">
        <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-1">
          THE PROBLEM
        </div>
        <p className="text-sm text-slate-400 leading-relaxed italic mb-3">{study.problem}</p>
        <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-1">
          WHAT CLAUX DID
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{study.solution}</p>
      </div>
      
      <div className="px-4 sm:px-6 pb-4">
        <div 
          className="pl-3.5 relative" 
          style={{ borderLeft: `2px solid ${study.accentColor}4D` }}
        >
          <span 
            className="absolute -left-1 -top-2 leading-none opacity-40" 
            style={{ fontSize: '2rem', color: study.accentColor }}
          >
            "
          </span>
          <p className="text-sm text-slate-300 italic leading-relaxed">{study.quote}</p>
        </div>
      </div>
      
      <div className="px-4 sm:px-6 pb-4">
        <div 
          className="px-3.5 py-2.5 rounded-xl" 
          style={{ 
            background: `${study.accentColor}14`, 
            border: `1px solid ${study.accentColor}33` 
          }}
        >
          <div className="flex items-center gap-2">
            <span>🏆</span>
            <span className="text-sm font-medium text-white/90">{study.keyWin}</span>
          </div>
        </div>
      </div>
      
      <div 
        className="flex justify-between items-center px-6 py-4 border-t" 
        style={{ borderTopColor: 'rgba(255,255,255,0.05)' }}
      >
        <span className="text-xs text-slate-600">Click to read full story</span>
        <Link 
          href={`/case-studies/${study.id}`}
          onClick={(e) => e.stopPropagation()}
          style={{ color: study.accentColor }}
          className="text-sm font-semibold hover:underline transition-all duration-200"
        >
          Read Full Case Study →
        </Link>
      </div>
    </div>
  )
}

export default function CaseStudyCards() {
  return (
    <HorizontalCarousel
      title="Real Businesses. Unignorable Results."
      subtitle="These aren't vanity metrics. These are real Indian businesses that stopped paying agencies and started ranking."
      id="results"
      bgClass="bg-[#050508]"
    >
      {caseStudies.map((study) => (
        <CaseStudyCard key={study.id} study={study} />
      ))}
    </HorizontalCarousel>
  )
}
