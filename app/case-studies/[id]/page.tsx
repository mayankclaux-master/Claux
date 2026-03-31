import { caseStudies } from '@/lib/caseStudiesData';
import Link from 'next/link';
import CaseStudyCTA from '@/components/CaseStudyCTA';

export const dynamicParams = true;

export async function generateStaticParams() {
  return caseStudies.map((study) => ({
    id: study.id,
  }));
}

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const study = caseStudies.find((s: any) => s.id === id) as any;

  if (!study) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
        <p>Case study not found.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/" className="text-lavender hover:underline mb-12 inline-block transition-all">
          ← Back to Results
        </Link>
        
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            {study['title'] || study['name']}
          </h1>
          <p className="text-2xl text-gray-400 leading-relaxed max-w-2xl">
            {study['description'] || study['excerpt']}
          </p>
        </div>

        <div className="mt-16 prose prose-invert max-w-none border-t border-white/10 pt-12">
          {/* This renders the actual study data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-300">
            <div>
              <h3 className="text-lavender font-bold uppercase tracking-widest text-sm mb-4">The Challenge</h3>
              <p>{study['challenge'] || "Strategizing high-conversion digital growth for market leaders."}</p>
            </div>
            <div>
              <h3 className="text-lavender font-bold uppercase tracking-widest text-sm mb-4">The Solution</h3>
              <p>{study['solution'] || "Implementing Claux AI agents for seamless automation."}</p>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <CaseStudyCTA />
        </div>
      </div>
    </main>
  );
}
