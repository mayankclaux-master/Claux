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
      <div className="max-w-5xl mx-auto px-6">
        <Link href="/" className="text-lavender hover:underline mb-12 inline-block">
          ← Back to Results
        </Link>
        
        {/* Header Section */}
        <div className="mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            {study['title'] || study['name']}
          </h1>
          <p className="text-2xl text-gray-400 max-w-3xl leading-relaxed">
            {study['description'] || study['excerpt']}
          </p>
        </div>

        {/* Stats / Results Grid */}
        {study['stats'] && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {study['stats'].map((stat: any, index: number) => (
              <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-3xl font-bold text-lavender mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Content Sections */}
        <div className="space-y-24 mb-24">
          <section className="grid md:grid-cols-2 gap-12 border-t border-white/10 pt-12">
            <div>
              <h2 className="text-lavender font-bold uppercase tracking-widest text-sm mb-6">The Challenge</h2>
              <p className="text-xl text-gray-300 leading-relaxed">{study['challenge']}</p>
            </div>
            <div>
              <h2 className="text-lavender font-bold uppercase tracking-widest text-sm mb-6">The Solution</h2>
              <p className="text-xl text-gray-300 leading-relaxed">{study['solution']}</p>
            </div>
          </section>

          {/* Results Section */}
          <section className="bg-white/5 rounded-3xl p-12 border border-white/10">
             <h2 className="text-3xl font-bold mb-8">Key Deliverables & Results</h2>
             <div className="prose prose-invert max-w-none text-gray-400 text-lg">
                {study['longContent'] || "Our AI-driven strategy delivered measurable growth across all primary KPIs."}
             </div>
          </section>
        </div>

        <div className="mt-20">
          <CaseStudyCTA />
        </div>
      </div>
    </main>
  );
}
