import { caseStudies } from '@/lib/caseStudiesData';
import Link from 'next/link';

export const dynamicParams = true;

export async function generateStaticParams() {
  return caseStudies.map((study) => ({
    id: study.id,
  }));
}

// In Next.js 16, params is a Promise and must be awaited
export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  const study = caseStudies.find((s: any) => s.id === id) as any;

  if (!study) {
    return (
      <div className="min-h-screen bg-[#050508] text-white p-20">
        <h1 className="text-2xl font-bold mb-4">Debug Mode</h1>
        <p className="mb-2 text-orange-400">ID found after await: "{id || 'STILL_NULL'}"</p>
        <p className="mb-4 text-gray-400">Check: Is the URL exactly matching the ID in caseStudiesData.ts?</p>
        <Link href="/" className="text-lavender underline">Return Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white p-10 pt-24">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-lavender hover:underline mb-8 inline-block">
          ← Back to Results
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">
          {study['title'] || study['name']}
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          {study['description']}
        </p>
        <div className="prose prose-invert max-w-none">
           {/* Portfolio content would go here */}
           <div className="p-6 border border-white/10 rounded-xl bg-white/5">
             <p className="text-lavender italic">Case Study content for {id} is now successfully connected.</p>
           </div>
        </div>
      </div>
    </main>
  );
}
