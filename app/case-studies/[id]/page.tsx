import { caseStudies } from '@/lib/caseStudiesData';
import Link from 'next/link';

export const dynamicParams = true;

export async function generateStaticParams() {
  return caseStudies.map((study) => ({
    id: study.id,
  }));
}

export default function CaseStudyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const study = caseStudies.find((s) => s.id === id);

  if (!study) {
    return (
      <div className="min-h-screen bg-[#050508] text-white p-20">
        <h1 className="text-2xl font-bold mb-4">Debug Mode: Study Not Found</h1>
        <p className="mb-2">Searching for ID: <span className="text-lavender">"{id}"</span></p>
        <p className="mb-4 text-gray-400">Available IDs in Data: {caseStudies.map(s => s.id).join(', ')}</p>
        <Link href="/" className="text-lavender underline">Return to Landing Page</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white p-10">
      <Link href="/" className="text-lavender mb-10 inline-block">← Back</Link>
      <h1 className="text-4xl font-bold">{study.title || (study as any).name}</h1>
      <div className="mt-10">
        <p className="text-xl text-gray-400">{study.description}</p>
      </div>
    </main>
  );
}
