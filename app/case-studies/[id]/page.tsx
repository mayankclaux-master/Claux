import { caseStudies } from '@/lib/caseStudiesData';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CaseStudyCTA from '@/components/CaseStudyCTA';
import MobileNav from '@/components/MobileNav';
import SiteFooter from '@/components/SiteFooter';

export const dynamicParams = true;

export async function generateStaticParams() {
  return caseStudies.map((s) => ({ id: s.id }));
}

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const study = caseStudies.find((s: any) => s.id === id) as any;

  if (!study) return notFound();

  // Get 2 other case studies for "More Success Stories"
  const otherStudies = caseStudies
    .filter((s) => s.id !== study.id)
    .slice(0, 2);

  return (
    <div className="bg-[#050508] min-h-screen text-white">
      <MobileNav />
      
      {/* Desktop Navbar */}
      <nav className="border-b border-gray-800 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/claux-logo-cropped.png"
                  alt="Claux"
                  width={180}
                  height={48}
                  className="object-contain"
                  style={{
                    width: '180px',
                    height: '48px',
                    objectFit: 'contain'
                  }}
                  priority
                />
              </Link>
              <Link 
                href="/#results" 
                className="hidden md:inline-flex items-center gap-2 text-slate-500 text-sm hover:text-indigo-400 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Results
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-8">
                <Link href="/#agents" className="text-gray-300 hover:text-white transition-colors">
                  Agents
                </Link>
                <Link href="/#results" className="text-gray-300 hover:text-white transition-colors">
                  Results
                </Link>
                <Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  Pricing
                </Link>
                <Link href="/faq">
                  <button className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-medium hover:from-indigo-400 hover:to-violet-500 transition-all">
                    FAQs
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Industry & Location */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span 
              className="px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: `${study.accentColor}1F`,
                color: study.accentColor,
                border: `1px solid ${study.accentColor}40`
              }}
            >
              {study.industry}
            </span>
            <span className="text-slate-400 text-sm">{study.location}</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ✓ Verified Result
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">
            {study.resultHeadline}
          </h1>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="glass-card p-5">
              <div className="text-3xl font-bold mb-1" style={{ color: study.accentColor }}>
                {study.metric}
              </div>
              <div className="text-slate-400 text-sm">{study.metricLabel}</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-3xl font-bold mb-1" style={{ color: study.accentColor }}>
                {study.timeTaken}
              </div>
              <div className="text-slate-400 text-sm">Time Taken</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-3xl font-bold mb-1" style={{ color: study.accentColor }}>
                {study.postsPublished}
              </div>
              <div className="text-slate-400 text-sm">Posts Published</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-3xl font-bold mb-1" style={{ color: study.accentColor }}>
                {study.callsChange}
              </div>
              <div className="text-slate-400 text-sm">New Leads</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Story - Part 1: The Problem */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-8">
            {/* Vertical Timeline */}
            <div className="hidden md:flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-4"
                style={{ background: `${study.accentColor}20`, border: `2px solid ${study.accentColor}` }}
              >
                🔴
              </div>
              <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-700 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="text-slate-500 text-sm font-bold tracking-widest mb-2">01 / THE SITUATION</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
                Where They Were Before Claux
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {study.situation}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Story - Part 2: The Solution */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-8">
            {/* Vertical Timeline */}
            <div className="hidden md:flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-4"
                style={{ background: `${study.accentColor}20`, border: `2px solid ${study.accentColor}` }}
              >
                ⚡
              </div>
              <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-700 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="text-slate-500 text-sm font-bold tracking-widest mb-2">02 / WHAT CLAUX DID</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
                The 9-Agent Execution Plan
              </h2>

              {/* Agent Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {study.agentActions.map((agent: any, idx: number) => (
                  <div key={idx} className="glass-card p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{agent.emoji}</span>
                      <div>
                        <h4 className="font-bold text-white mb-1">{agent.agent}</h4>
                        <p className="text-sm text-slate-400">{agent.action}</p>
                      </div>
                    </div>
                    <div className="text-sm" style={{ color: study.accentColor }}>
                      → {agent.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Story - Part 3: The Results */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-8">
            {/* Vertical Timeline */}
            <div className="hidden md:flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-4"
                style={{ background: `${study.accentColor}20`, border: `2px solid ${study.accentColor}` }}
              >
                📈
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="text-slate-500 text-sm font-bold tracking-widest mb-2">03 / THE RESULTS</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
                What Changed in {study.timeTaken}
              </h2>

              {/* Metrics Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="glass-card p-6">
                  <div className="text-slate-400 text-sm mb-2">Ranking</div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-lg">{study.beforeRank}</span>
                    <svg className="w-6 h-6" style={{ color: study.accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-2xl font-bold" style={{ color: study.accentColor }}>
                      {study.afterRank}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="text-slate-400 text-sm mb-2">Traffic Growth</div>
                  <div className="text-2xl font-bold" style={{ color: study.accentColor }}>
                    {study.bigMetric}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="text-slate-400 text-sm mb-2">New Leads</div>
                  <div className="text-2xl font-bold" style={{ color: study.accentColor }}>
                    {study.callsChange}
                  </div>
                </div>

                {study.ratingChange && (
                  <div className="glass-card p-6">
                    <div className="text-slate-400 text-sm mb-2">Rating Improvement</div>
                    <div className="text-2xl font-bold" style={{ color: study.accentColor }}>
                      {study.ratingChange}
                    </div>
                  </div>
                )}

                <div className="glass-card p-6">
                  <div className="text-slate-400 text-sm mb-2">Content Published</div>
                  <div className="text-2xl font-bold" style={{ color: study.accentColor }}>
                    {study.postsPublished} posts
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="text-slate-400 text-sm mb-2">Time to Results</div>
                  <div className="text-2xl font-bold" style={{ color: study.accentColor }}>
                    {study.timeTaken}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Quote Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 sm:p-12">
            {/* Large Quote Mark */}
            <div 
              className="absolute top-8 left-8 text-8xl font-serif opacity-20"
              style={{ color: study.accentColor }}
            >
              "
            </div>

            <div className="relative z-10">
              <p className="text-xl sm:text-2xl italic text-white mb-6 leading-relaxed">
                {study.quote}
              </p>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-semibold text-white">{study.industry}</div>
                  <div className="text-slate-400 text-sm">{study.location}</div>
                </div>
                <div className="ml-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                    ✓ Verified Client
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Win Highlight */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className="rounded-2xl p-8 sm:p-12 text-center"
            style={{
              background: `linear-gradient(135deg, ${study.accentColor}10, ${study.accentColor}05)`,
              border: `1px solid ${study.accentColor}4D`
            }}
          >
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              {study.keyWin}
            </h3>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CaseStudyCTA />

      {/* More Success Stories */}
      <section className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-white">
            More Success Stories →
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherStudies.map((otherStudy) => (
              <Link key={otherStudy.id} href={`/case-studies/${otherStudy.id}`}>
                <div 
                  className="glass-card p-6 hover:border-opacity-50 transition-all cursor-pointer"
                  style={{ borderColor: `${otherStudy.accentColor}40` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: `${otherStudy.accentColor}1F`,
                        color: otherStudy.accentColor,
                        border: `1px solid ${otherStudy.accentColor}40`
                      }}
                    >
                      {otherStudy.industry}
                    </span>
                    <span className="text-slate-500 text-xs">{otherStudy.location}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-3">
                    {otherStudy.headline}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: otherStudy.accentColor }} className="font-semibold">
                      {otherStudy.metric}
                    </span>
                    <span className="text-slate-400">{otherStudy.timeline}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
