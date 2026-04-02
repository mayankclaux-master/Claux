import { supabase } from "@/lib/supabase";
import AnimationWrapper from "@/components/AnimationWrapper";
import ClientWrapper from "@/components/ClientWrapper";
import HorizontalCarousel from "@/components/HorizontalCarousel";
import HowItWorksSection from "@/components/HowItWorksSection";
import CaseStudyCards from "@/components/CaseStudyCards";
import MobileScrollRow from "@/components/MobileScrollRow";
import MobileNav from "@/components/MobileNav";
import FAQSection from "@/components/FAQSection";
import Image from "next/image";

export default async function Home() {
  const { data: caseStudies, error } = await supabase
    .from("case_studies")
    .select("*");

  if (error) {
    console.error("Error fetching case studies:", error);
  }

  return (
    <>
      <MobileNav />
      <ClientWrapper>
        <div className="min-h-screen bg-[#050508] text-white">
        {/* NAVBAR */}
        <nav className="border-b border-gray-800 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <Image
                  src="/claux-logo.png"
                  alt="Claux"
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-8">
                <a href="#agents" className="text-gray-300 hover:text-white transition-colors">
                  Agents
                </a>
                <a href="#results" className="text-gray-300 hover:text-white transition-colors">
                  Results
                </a>
                <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </a>
                <a href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  Pricing
                </a>
                <button data-demo-trigger className="px-5 py-2 border border-gray-700 rounded-lg font-medium hover:bg-gray-800 transition-all">
                  Watch How It Works
                </button>
                <a href="#faq">
                  <button className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-medium hover:from-indigo-400 hover:to-violet-500 transition-all">
                    Claux FAQs
                  </button>
                </a>
                </div>
              </div>
            </div>
          </div>
        </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#050508]">
        {/* Dark mesh grid pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              You're Paying ₹25,000–₹1,00,000/Month
              <br />
              <span className="gradient-text">For 2 Junior Executives Doing SEO.</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-10 leading-relaxed">
              Most agencies pocket the profit and assign entry-level staff to your project. Claux replaces your entire agency with <span className="text-blue-400 font-semibold">9 AI SEO experts</span> — trained on SOPs by the world's top 100 SEO leaders — working 24/7 at a fraction of the cost.
            </p>
            
            {/* TRUST PILLS */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 sm:mb-10 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <span>🧠</span>
                <span className="text-sm font-medium" style={{ color: '#C7D2FE' }}>SOPs by Top 100 Global SEO Leaders</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <span>⚡</span>
                <span className="text-sm font-medium" style={{ color: '#C7D2FE' }}>9 Agents. 24/7. Zero Salary.</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <span>📍</span>
                <span className="text-sm font-medium" style={{ color: '#C7D2FE' }}>A Complete SEO and GEO Suite</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5 sm:mb-16">
              <button data-demo-trigger className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-semibold text-lg hover:from-indigo-400 hover:to-violet-500 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                Watch How It Works
              </button>
              <a href="#results">
                <button className="px-8 py-4 border border-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all">
                  See Real Results
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO BANNER SECTION */}
      <section className="py-8 sm:py-12 md:py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-3 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 gradient-text">
              The ₹3 Lakh/Month Problem — Solved in 60 Seconds
            </h2>
          </div>

          {/* VIDEO CONTAINER */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative aspect-video md:aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
              {/* Replace with actual video URL */}
              <video
                className="w-full h-full object-cover"
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect width='1920' height='1080' fill='%23111827'/%3E%3C/svg%3E"
                controls
              >
                <source src="" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* PLAY BUTTON OVERLAY */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-all cursor-pointer group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-3 sm:mt-6">
            <p className="text-gray-400 text-lg">
              Watch how Claux's 9 AI agents replaced an entire SEO team
            </p>
          </div>
        </div>
      </section>

      {/* AGENCY PROBLEM SECTION */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 gradient-text">
              Why 90% of SEO Agencies Fail You
            </h2>
          </div>

          {/* Mobile: Horizontal Scroll */}
          <MobileScrollRow dotCount={2}>
            {/* LEFT - Traditional Agency */}
            <div className="glass-card relative overflow-hidden p-5 sm:p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
                  <span className="text-amber-400 font-semibold">Traditional SEO Agency</span>
                </div>

                <div className="space-y-3 sm:space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-400 mb-1">₹25,000–₹1,00,000/month</div>
                      <p className="text-gray-400 text-sm">Premium pricing with hidden costs</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">2–3 junior executives on your account</div>
                      <p className="text-gray-400 text-sm">Entry-level staff learning on your budget</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Agency keeps 60–70% as profit</div>
                      <p className="text-gray-400 text-sm">Most of your money goes to overhead</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Monthly PDF reports, zero transparency</div>
                      <p className="text-gray-400 text-sm">Black box approach with vague metrics</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">6–12 months before visible results</div>
                      <p className="text-gray-400 text-sm">Slow execution, delayed outcomes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Claux AI Agents */}
            <div className="bg-gray-900 border-2 border-emerald-900/30 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6">
                  <span className="text-emerald-400 font-semibold">Claux AI Agents</span>
                </div>

                <div className="space-y-3 sm:space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-400 mb-1">Starts at a fraction of agency cost</div>
                      <p className="text-gray-400 text-sm">Transparent, predictable pricing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">9 specialized AI agents, 24/7</div>
                      <p className="text-gray-400 text-sm">Expert-level work around the clock</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Every rupee goes into ranking you</div>
                      <p className="text-gray-400 text-sm">No overhead, no profit margins</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Live dashboard, real-time visibility</div>
                      <p className="text-gray-400 text-sm">Track every action, every metric, instantly</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Results in 30–60 days</div>
                      <p className="text-gray-400 text-sm">Fast execution, measurable impact</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MobileScrollRow>

          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            {/* LEFT - Traditional Agency */}
            <div className="glass-card relative overflow-hidden p-5 sm:p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
                  <span className="text-amber-400 font-semibold">Traditional SEO Agency</span>
                </div>

                <div className="space-y-3 sm:space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-400 mb-1">₹25,000–₹1,00,000/month</div>
                      <p className="text-gray-400 text-sm">Premium pricing with hidden costs</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">2–3 junior executives on your account</div>
                      <p className="text-gray-400 text-sm">Entry-level staff learning on your budget</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Agency keeps 60–70% as profit</div>
                      <p className="text-gray-400 text-sm">Most of your money goes to overhead</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Monthly PDF reports, zero transparency</div>
                      <p className="text-gray-400 text-sm">Black box approach with vague metrics</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-slate-400">✕</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">6–12 months before visible results</div>
                      <p className="text-gray-400 text-sm">Slow execution, delayed outcomes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Claux AI Agents */}
            <div className="bg-gray-900 border-2 border-emerald-900/30 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6">
                  <span className="text-emerald-400 font-semibold">Claux AI Agents</span>
                </div>

                <div className="space-y-3 sm:space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-400 mb-1">Starts at a fraction of agency cost</div>
                      <p className="text-gray-400 text-sm">Transparent, predictable pricing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">9 specialized AI agents, 24/7</div>
                      <p className="text-gray-400 text-sm">Expert-level work around the clock</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Every rupee goes into ranking you</div>
                      <p className="text-gray-400 text-sm">No overhead, no profit margins</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Live dashboard, real-time visibility</div>
                      <p className="text-gray-400 text-sm">Track every action, every metric, instantly</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-1">Results in 30–60 days</div>
                      <p className="text-gray-400 text-sm">Fast execution, measurable impact</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEET YOUR 9 AI AGENTS SECTION */}
      <HorizontalCarousel
        id="agents"
        title="Imagine Hiring 9 Global SEO Experts. Without the ₹3 Lakh/Month Bill."
        subtitle="Every Claux agent follows a 200-step SOP refined by the world's top SEO practitioners."
        bgClass="section-bg-alt"
      >
            {/* Agent 1 - ARIA */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-blue-500 rounded-xl p-6 hover:-translate-y-1 hover:border-l-blue-400 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-xl font-bold mb-2">ARIA — Keyword Intelligence Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Trained on 10M+ keyword patterns across 40+ local industries in India
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                ARIA reverse-engineers exactly what your top 3 competitors rank for — then finds the keyword gaps they missed. She maps every high-intent search term your ideal customer types before calling a business like yours.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">A battle-tested keyword strategy on Day 1, not Month 3. No guesswork. No wasted content.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-bold text-blue-400">
                  40–80 high-intent keywords mapped in 48 hours
                </div>
                <div className="inline-block px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-blue-400 ml-2">
                  Active from Day 1
                </div>
              </div>
            </div>

            {/* Agent 2 - SCRIBE */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-teal-400 rounded-xl p-6 hover:-translate-y-1 hover:border-l-teal-300 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">✍️</div>
                <h3 className="text-xl font-bold mb-2">SCRIBE — AI Content Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Writes like a senior SEO content strategist with 8+ years of on-page experience
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                SCRIBE turns ARIA's keyword map into published, Google-optimized content — blog posts, service pages, location pages — written in your brand voice and structured for featured snippets and local pack rankings.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">A content engine that never sleeps, never misses a deadline, and never charges ₹15,000/article.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-teal-400/10 border border-teal-400/30 rounded-lg text-sm font-bold text-teal-400">
                  8–12 SEO articles published every month
                </div>
                <div className="inline-block px-3 py-1 bg-teal-400/5 border border-teal-400/20 rounded-lg text-xs text-teal-400 ml-2">
                  First content live within 72 hours
                </div>
              </div>
            </div>

            {/* Agent 3 - LOCL */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-emerald-500 rounded-xl p-6 hover:-translate-y-1 hover:border-l-emerald-400 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">📍</div>
                <h3 className="text-xl font-bold mb-2">LOCL — Google Business Profile Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Specialist in Local Pack domination and GBP algorithm optimization
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                LOCL treats your Google Business Profile like a live product — publishing fresh posts weekly, optimizing your categories and attributes, fixing NAP inconsistencies across 50+ directories, and ensuring Google always sees your listing as active and authoritative.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">Higher Map Pack rankings, more calls directly from Google Search, and a GBP that builds trust before a lead even visits your website.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm font-bold text-emerald-400">
                  Map Pack visibility within 30–45 days
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 ml-2">
                  GBP fully optimized by Day 3
                </div>
              </div>
            </div>

            {/* Agent 4 - LINX */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-purple-500 rounded-xl p-6 hover:-translate-y-1 hover:border-l-purple-400 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">🔗</div>
                <h3 className="text-xl font-bold mb-2">LINX — Backlink Acquisition Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Operates with a database of 2M+ Indian domain opportunities across 60+ niches
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                LINX identifies which websites your competitors are getting links from, finds relevant Indian directories, media, and niche blogs, and systematically builds your domain authority through quality backlink pipelines — without spammy shortcuts.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">A growing domain authority that makes every piece of content rank faster and higher over time.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm font-bold text-purple-400">
                  5–15 quality backlinks acquired per month
                </div>
                <div className="inline-block px-3 py-1 bg-purple-500/5 border border-purple-500/20 rounded-lg text-xs text-purple-400 ml-2">
                  Active from Week 2
                </div>
              </div>
            </div>

            {/* Agent 5 - CORE */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-amber-500 rounded-xl p-6 hover:-translate-y-1 hover:border-l-amber-400 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">🛠️</div>
                <h3 className="text-xl font-bold mb-2">CORE — Technical SEO Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Audits 200+ technical signals used by Google's ranking algorithm
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                CORE crawls your entire website like a Google bot — identifying broken links, slow pages, missing schema, duplicate content, crawl errors, and mobile usability issues. He then prioritizes fixes by revenue impact, not just severity score.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">A technically clean website that Google trusts enough to rank — and that loads fast enough that visitors stay.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm font-bold text-amber-400">
                  Technical SEO health score 80+ within 30 days
                </div>
                <div className="inline-block px-3 py-1 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-400 ml-2">
                  Full site audit delivered in 24 hours
                </div>
              </div>
            </div>

            {/* Agent 6 - PULSE */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-blue-500 rounded-xl p-6 hover:-translate-y-1 hover:border-l-blue-400 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold mb-2">PULSE — Rank Tracking Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Monitors 500+ ranking signals across Google Search, Maps, and AI Overviews
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                PULSE tracks your keyword positions daily — not monthly like your old agency report. She detects ranking drops before they hurt traffic, identifies which content is gaining momentum, and shows you the exact ROI of every Claux action taken.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">Complete transparency. You see every ranking move in real time — and you always know exactly where your business stands on Google.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-bold text-blue-400">
                  100% ranking visibility — updated every 24 hours
                </div>
                <div className="inline-block px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-blue-400 ml-2">
                  Live from Day 1
                </div>
              </div>
            </div>

            {/* Agent 7 - REPUTE */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-teal-400 rounded-xl p-6 hover:-translate-y-1 hover:border-l-teal-300 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">⭐</div>
                <h3 className="text-xl font-bold mb-2">REPUTE — Reputation Management Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Expert in review velocity, sentiment analysis, and Google rating algorithm
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                REPUTE monitors every new review across Google, Justdial, and IndiaMART. He triggers smart review request sequences to your satisfied customers and tracks your overall rating trend — because a 4.8-star business gets 73% more clicks than a 3.9-star one.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">A steadily improving star rating, more social proof, and a business that Google and customers trust more every month.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-teal-400/10 border border-teal-400/30 rounded-lg text-sm font-bold text-teal-400">
                  +0.5 to +1.2 star improvement in 60 days
                </div>
                <div className="inline-block px-3 py-1 bg-teal-400/5 border border-teal-400/20 rounded-lg text-xs text-teal-400 ml-2">
                  Active from Day 3
                </div>
              </div>
            </div>

            {/* Agent 8 - RIVAL */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-emerald-500 rounded-xl p-6 hover:-translate-y-1 hover:border-l-emerald-400 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">🕵️</div>
                <h3 className="text-xl font-bold mb-2">RIVAL — Competitor Intelligence Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Tracks your top 5 competitors' every move — content, backlinks, rankings, and GBP
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                RIVAL watches your competitors 24/7 so you don't have to. Every Monday she delivers a report showing what they published, which new keywords they're targeting, what links they acquired, and where you can outmaneuver them this week.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">The competitive advantage of always knowing your enemy's next move — and making yours first.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm font-bold text-emerald-400">
                  Competitor gap report delivered every Monday morning
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 ml-2">
                  Active from Week 1
                </div>
              </div>
            </div>

            {/* Agent 9 - AMPLI */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 border-l-4 border-l-purple-500 rounded-xl p-6 hover:-translate-y-1 hover:border-l-purple-400 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
                <span className="text-green-400">Active 24/7</span>
                <span className="text-green-400">🟢</span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl mb-3">📣</div>
                <h3 className="text-xl font-bold mb-2">AMPLI — Content Distribution Agent</h3>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Specializes in accelerating Google discovery and content indexing velocity
                </p>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                After SCRIBE publishes a piece of content, AMPLI immediately pushes it through 30+ social signals, indexing APIs, content syndication channels, and web mentions — dramatically reducing the time it takes Google to find, crawl, and rank new content.
              </p>

              <p className="text-white text-sm mb-4 leading-relaxed font-medium">
                So you get: <span className="font-normal text-gray-300">New content that starts ranking in days, not the 3–6 months most businesses wait after publishing.</span>
              </p>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm font-bold text-purple-400">
                  2x faster content indexing and ranking acceleration
                </div>
                <div className="inline-block px-3 py-1 bg-purple-500/5 border border-purple-500/20 rounded-lg text-xs text-purple-400 ml-2">
                  Active immediately after every content publish
                </div>
              </div>
            </div>
      </HorizontalCarousel>

      {/* CASE STUDIES SECTION */}
      <CaseStudyCards />

      {/* HOW IT WORKS SECTION */}
      <HowItWorksSection />

      {/* TRUST BAR / FEATURED IN SECTION */}
      <section className="py-12 bg-[#050508] overflow-hidden">
        <div className="mb-8 text-center">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium">Trusted & Featured By</h3>
        </div>

        <div className="relative">
          {/* Fade gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050508] to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050508] to-transparent z-10"></div>

          {/* Row 1 - Left to Right */}
          <div className="marquee-row mb-4">
            <div className="marquee-content">
              <span className="marquee-badge">YourStory</span>
              <span className="marquee-badge">Inc42</span>
              <span className="marquee-badge">Economic Times</span>
              <span className="marquee-badge">Product Hunt</span>
              <span className="marquee-badge">G2</span>
              <span className="marquee-badge">Capterra</span>
              <span className="marquee-badge">Google for Startups</span>
              <span className="marquee-badge">Nasscom</span>
              <span className="marquee-badge">Entrepreneur India</span>
              <span className="marquee-badge">BetaList</span>
              <span className="marquee-badge">Startup India</span>
              <span className="marquee-badge">The Ken</span>
              <span className="marquee-badge">Mint</span>
              <span className="marquee-badge">Forbes India</span>
              <span className="marquee-badge">NDTV Profit</span>
            </div>
            <div className="marquee-content" aria-hidden="true">
              <span className="marquee-badge">YourStory</span>
              <span className="marquee-badge">Inc42</span>
              <span className="marquee-badge">Economic Times</span>
              <span className="marquee-badge">Product Hunt</span>
              <span className="marquee-badge">G2</span>
              <span className="marquee-badge">Capterra</span>
              <span className="marquee-badge">Google for Startups</span>
              <span className="marquee-badge">Nasscom</span>
              <span className="marquee-badge">Entrepreneur India</span>
              <span className="marquee-badge">BetaList</span>
              <span className="marquee-badge">Startup India</span>
              <span className="marquee-badge">The Ken</span>
              <span className="marquee-badge">Mint</span>
              <span className="marquee-badge">Forbes India</span>
              <span className="marquee-badge">NDTV Profit</span>
            </div>
          </div>

          {/* Row 2 - Right to Left */}
          <div className="marquee-row-reverse">
            <div className="marquee-content-reverse">
              <span className="marquee-badge">NDTV Profit</span>
              <span className="marquee-badge">Forbes India</span>
              <span className="marquee-badge">Mint</span>
              <span className="marquee-badge">The Ken</span>
              <span className="marquee-badge">Startup India</span>
              <span className="marquee-badge">BetaList</span>
              <span className="marquee-badge">Entrepreneur India</span>
              <span className="marquee-badge">Nasscom</span>
              <span className="marquee-badge">Google for Startups</span>
              <span className="marquee-badge">Capterra</span>
              <span className="marquee-badge">G2</span>
              <span className="marquee-badge">Product Hunt</span>
              <span className="marquee-badge">Economic Times</span>
              <span className="marquee-badge">Inc42</span>
              <span className="marquee-badge">YourStory</span>
            </div>
            <div className="marquee-content-reverse" aria-hidden="true">
              <span className="marquee-badge">NDTV Profit</span>
              <span className="marquee-badge">Forbes India</span>
              <span className="marquee-badge">Mint</span>
              <span className="marquee-badge">The Ken</span>
              <span className="marquee-badge">Startup India</span>
              <span className="marquee-badge">BetaList</span>
              <span className="marquee-badge">Entrepreneur India</span>
              <span className="marquee-badge">Nasscom</span>
              <span className="marquee-badge">Google for Startups</span>
              <span className="marquee-badge">Capterra</span>
              <span className="marquee-badge">G2</span>
              <span className="marquee-badge">Product Hunt</span>
              <span className="marquee-badge">Economic Times</span>
              <span className="marquee-badge">Inc42</span>
              <span className="marquee-badge">YourStory</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TEASER SECTION */}
      <section id="pricing" className="py-10 sm:py-16 md:py-24 bg-[#050508]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 gradient-text">
              Less Than One Junior SEO Executive. 9X the Output.
            </h2>
          </div>

          {/* Mobile: Horizontal Scroll */}
          <MobileScrollRow dotCount={2}>
            {/* LEFT - Traditional Agency */}
            <div className="glass-card relative">
              <div className="absolute top-4 right-4">
                <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400">
                  What you've been overpaying for
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-6 mt-8 text-slate-300">Traditional Agency</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div>
                    <div className="text-2xl font-bold text-amber-400">₹25,000–₹1,00,000/month</div>
                    <p className="text-sm text-gray-500">Plus hidden costs and setup fees</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div className="text-slate-400">2–3 junior staff assigned to your account</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div className="text-slate-400">No transparency, monthly PDF reports</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div className="text-slate-400">6–12 months before visible results</div>
                </div>
              </div>
            </div>

            {/* RIGHT - Claux AI */}
            <div className="glass-card relative overflow-hidden border-2 border-indigo-500/50">
              <div className="absolute top-4 right-4">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400">
                  What actually works
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-6 mt-8 text-slate-100">Claux AI</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">Starting at ₹7,499/month</div>
                    <p className="text-sm text-gray-500">All-inclusive, no hidden fees</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div className="text-slate-300">9 AI agents working 24/7 on your SEO</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div className="text-slate-300">Live dashboard with real-time metrics</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div className="text-slate-300">Results visible in 30–60 days</div>
                </div>
              </div>

              <a href="/pricing">
                <button 
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-semibold hover:from-indigo-400 hover:to-violet-500 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  See Full Pricing →
                </button>
              </a>
            </div>
          </MobileScrollRow>

          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* LEFT - Traditional Agency */}
            <div className="glass-card relative">
              <div className="absolute top-4 right-4">
                <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400">
                  What you've been overpaying for
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-6 mt-8 text-slate-300">Traditional Agency</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div>
                    <div className="text-2xl font-bold text-amber-400">₹25,000–₹1,00,000/month</div>
                    <p className="text-sm text-gray-500">Plus hidden costs and setup fees</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div className="text-slate-400">2–3 junior staff assigned to your account</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div className="text-slate-400">No transparency, monthly PDF reports</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-slate-400 mt-1">✕</span>
                  <div className="text-slate-400">6–12 months before visible results</div>
                </div>
              </div>
            </div>

            {/* RIGHT - Claux AI */}
            <div className="glass-card relative overflow-hidden border-2 border-indigo-500/50">
              <div className="absolute top-4 right-4">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400">
                  What actually works
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-6 mt-8 text-slate-100">Claux AI</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">Starting at ₹7,499/month</div>
                    <p className="text-sm text-gray-500">All-inclusive, no hidden fees</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div className="text-slate-300">9 AI agents working 24/7 on your SEO</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div className="text-slate-300">Live dashboard with real-time metrics</div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <div className="text-slate-300">Results visible in 30–60 days</div>
                </div>
              </div>

              <a href="/pricing">
                <button 
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-semibold hover:from-indigo-400 hover:to-violet-500 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  See Full Pricing →
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <FAQSection />

      {/* FOOTER CTA SECTION */}
      <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-b from-[#050508] to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-emerald-500/5"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 gradient-text">
            Stop Paying for Mediocrity.
          </h2>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed">
            Your competitors are using AI for SEO right now. Every day you wait, they climb higher.
          </p>

          <button 
            data-demo-trigger
            className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-bold text-xl hover:from-indigo-400 hover:to-violet-500 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] mb-4"
          >
            Watch How It Works
          </button>

          <p className="text-sm text-gray-500">
            No credit card. No agency contracts. Just results.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050508] border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
            {/* Logo & Tagline - Left */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src="/claux-logo.png"
                  alt="Claux"
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
              <p className="text-slate-500 text-sm">
                9 AI Agents. 1 Goal. Page 1.
              </p>
            </div>

            {/* Nav Links - Center */}
            <div className="flex flex-wrap gap-6">
              <a href="#agents" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Agents</a>
              <a href="#results" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Results</a>
              <a href="#how-it-works" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">How It Works</a>
              <a href="#pricing" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Pricing</a>
              <a href="#faq" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">FAQs</a>
            </div>

            {/* Copyright - Right */}
            <div>
              <p className="text-slate-500 text-sm">
                © 2026 Claux. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <AnimationWrapper />
      </div>
    </ClientWrapper>
    </>
  );
}
