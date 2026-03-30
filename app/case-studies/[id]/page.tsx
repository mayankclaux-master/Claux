import { caseStudies } from '@/lib/caseStudiesData';
import Link from 'next/link';

export const dynamicParams = true;

export async function generateStaticParams() {
  return caseStudies.map((study) => ({
    id: study.id,
  }));
}

export default function CaseStudyPage({ params }: any) {
  // In Next.js 16, params must be handled carefully to avoid the empty string bug
  const id = params?.id;
  const study = caseStudies.find((s: any) => s.id === id) as any;

  if (!study) {
    return (
      <div className="min-h-screen bg-[#050508] text-white p-20">
        <h1 className="text-2xl font-bold mb-4">Debug Mode</h1>
        <p className="mb-2 text-red-400">Received ID: "{id || 'NULL'}"</p>
        <p className="mb-4 text-gray-400">Expected IDs: delhi-ca, mumbai-d2c...</p>
        <Link href="/" className="text-lavender underline">Return Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white p-10">
      <Link href="/" className="text-lavender mb-10 inline-block">← Back</Link>
      <h1 className="text-4xl font-bold">{study['title'] || study['name']}</h1>
      <div className="mt-10">
        <p className="text-xl text-gray-400">{study['description']}</p>
      </div>
    </main>
  );
}
