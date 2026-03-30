'use client'

import MobileScrollRow from '@/components/MobileScrollRow'

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-10 sm:py-16 md:py-24 bg-[#0D0D14] relative overflow-hidden">
      {/* Dark mesh grid pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 gradient-text">
            From Signup to Page 1 — Here's Exactly What Happens
          </h2>
          <p className="text-lg text-slate-400 mb-16 max-w-2xl mx-auto">
            No onboarding calls. No 3-month strategy decks. Just plug in and watch 9 agents get to work.
          </p>
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="block lg:hidden">
          <MobileScrollRow dotCount={4}>
            {/* Step 1 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                {/* Step number circle */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  1
                </div>
                
                {/* Card */}
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  {/* Metallic top edge */}
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">🔌</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Connect</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>⚡ Live in 4 mins</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Add your website URL and Google Business Profile. Takes under 4 minutes. The moment you connect, all 9 Claux agents activate and begin scanning your digital presence.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  2
                </div>
                
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">🔎</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Audit & Plan</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>📋 200-point audit</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    CORE runs a 200-point technical audit simultaneously as ARIA maps your entire keyword battlefield. You receive a revenue-prioritised action plan — not a generic SEO checklist.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  3
                </div>
                
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Execute</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>🤖 9 agents, 0 days off</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    All 9 agents fire simultaneously in parallel — SCRIBE publishes content, LINX builds backlinks, LOCL dominates Maps, CORE fixes technical issues, RIVAL watches competitors. Every single day.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  4
                </div>
                
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">📈</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Rank & Scale</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>📈 Results from Day 30</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    PULSE tracks your rankings every 24 hours. Results appear in your live dashboard. We auto-iterate every week based on what's gaining momentum — compounding your rankings over time.
                  </p>
                </div>
              </div>
            </div>
          </MobileScrollRow>
        </div>

        {/* Desktop: Horizontal Timeline */}
        <div className="hidden lg:block relative">
          {/* Minimal connecting line */}
          <div className="absolute top-[22px] left-[12%] right-[12%] h-px" style={{
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)'
          }}></div>

          <div className="grid grid-cols-4 gap-8 items-stretch">
            {/* Step 1 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  1
                </div>
                
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">🔌</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Connect</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>⚡ Live in 4 mins</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Add your website URL and Google Business Profile. Takes under 4 minutes. The moment you connect, all 9 Claux agents activate and begin scanning your digital presence.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  2
                </div>
                
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">🔎</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Audit & Plan</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>📋 200-point audit</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    CORE runs a 200-point technical audit simultaneously as ARIA maps your entire keyword battlefield. You receive a revenue-prioritised action plan — not a generic SEO checklist.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  3
                </div>
                
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Execute</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>🤖 9 agents, 0 days off</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    All 9 agents fire simultaneously in parallel — SCRIBE publishes content, LINX builds backlinks, LOCL dominates Maps, CORE fixes technical issues, RIVAL watches competitors. Every single day.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="timeline-step relative group">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base mb-6 relative z-10" style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>
                  4
                </div>
                
                <div className="relative w-full overflow-hidden transition-all duration-[400ms]" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  }}></div>
                  
                  <div className="text-3xl mb-3">📈</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Rank & Scale</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs mt-4 mb-3 transition-all duration-300" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#A5B4FC'
                  }}>📈 Results from Day 30</span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    PULSE tracks your rankings every 24 hours. Results appear in your live dashboard. We auto-iterate every week based on what's gaining momentum — compounding your rankings over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
