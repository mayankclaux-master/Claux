import { caseStudies } from '../../../lib/caseStudiesData';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import CaseStudyCTA from '../../../components/CaseStudyCTA';

export const dynamicParams = true;

export async function generateStaticParams() {
  return caseStudies.map((s) => ({ id: s.id }));
}

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const study = caseStudies.find((s: any) => s.id === id) as any;

  if (!study) return notFound();

  return (
    <div className="bg-[#050508] min-h-screen font-sans selection:bg-lavender/30">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* BREADCRUMB & BADGE */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link href="/#results" className="text-slate-500 text-sm hover:text-lavender transition flex items-center gap-2">
              <span className="text-lg">←</span> Back to Results
            </Link>
            <div className="flex gap-2 ml-auto">
              <span className="bg-lavender/10 text-lavender text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-lavender/20">
                {study.industry}
              </span>
              <span className="bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                {study.location}
              </span>
            </div>
          </div>

          {/* HERO SECTION */}
          <div className="mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-tighter mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Verified Result
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500 leading-[1.1]">
              {study.resultHeadline}
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl leading-relaxed mb-16">
              {study.description}
            </p>

            {/* 4 KEY METRICS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { val: study.bigMetric, lab: "Growth Scale" },
                { val: study.timeTaken, lab: "Time to Result" },
                { val: study.postsPublished, lab: "Assets Created" },
                { val: study.callsChange, lab: "Lead Change" }
              ].map((metric, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-lavender/30 transition-all duration-500 backdrop-blur-xl">
                  <div className="text-3xl md:text-4xl font-bold mb-2 transition-colors duration-500" style={{ color: study.accentColor || '#A5B4FC' }}>
                    {metric.val}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">{metric.lab}</div>
                </div>
              ))}
            </div>
          </div>

          {/* THE STORY SECTION (3-PART NARRATIVE) */}
          <div className="space-y-32 mb-40 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent hidden md:block" />

            <div className="relative md:pl-24 group">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#050508] border border-red-500/30 flex items-center justify-center text-xl z-10 hidden md:flex group-hover:border-red-500 transition-colors">🔴</div>
              <div className="text-slate-500 text-xs uppercase tracking-[0.3em] mb-4">01 / The Situation</div>
              <h2 className="text-3xl font-bold text-white mb-8">Where They Were Before Claux</h2>
              <div className="bg-white/[0.02] p-8 md:p-12 rounded-[2.5rem] border border-white/5 text-lg text-slate-400 leading-relaxed max-w-4xl">
                {study.situation}
              </div>
            </div>

            <div className="relative md:pl-24 group">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#050508] border border-yellow-500/30 flex items-center justify-center text-xl z-10 hidden md:flex group-hover:border-yellow-500 transition-colors">⚡</div>
              <div className="text-slate-500 text-xs uppercase tracking-[0.3em] mb-4">02 / What Claux Did</div>
              <h2 className="text-3xl font-bold text-white mb-8">The 9-Agent Execution Plan</h2>
              <div className="grid md:grid-cols-2 gap-4 max-w-5xl">
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10">
                  <div className="text-2xl mb-4">🤖 ARIA</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{study.solution}</p>
                </div>
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10">
                  <div className="text-2xl mb-4">✍️ SCRIBE</div>
                  <p className="text-sm text-slate-400 leading-relaxed">Automated local-authority content targeting "{id.split('-')[0]}" specific intent.</p>
                </div>
              </div>
            </div>

            <div className="relative md:pl-24 group">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#050508] border border-green-500/30 flex items-center justify-center text-xl z-10 hidden md:flex group-hover:border-green-500 transition-colors">📈</div>
              <div className="text-slate-500 text-xs uppercase tracking-[0.3em] mb-4">03 / The Results</div>
              <h2 className="text-3xl font-bold text-white mb-8">What Changed in {study.timeTaken}</h2>
              <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-12 rounded-[3rem] border border-white/10 relative overflow-hidden">
                <div className="text-2xl text-white font-medium mb-8 italic">"{study.quote}"</div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  {study.industry}, {study.location}
                </div>
              </div>
            </div>
          </div>

          {/* KEY WIN HIGHLIGHT */}
          <div className="mb-40 p-12 rounded-[2rem] bg-lavender/5 border border-lavender/20 flex items-center gap-8 relative overflow-hidden">
            <div className="text-5xl opacity-30 select-none">🏆</div>
            <div className="text-2xl md:text-3xl font-bold text-white relative z-10">
              {study.keyWin}
            </div>
          </div>

          <CaseStudyCTA />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
