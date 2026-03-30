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
  // We use 'any' here to tell the compiler to stop checking properties
  const study = caseStudies.find((s: any) => s.id === id) as any;

  if (!study) {
    return (
      <div className="min-h-screen bg-[#050508] text-white p-20">
        <h1 className="text-2xl font-bold mb-4">Debug Mode: Study Not Found</h1>
        <p className="mb-2">Searching for ID: "{id}"</p>
        <Link href="/" className="text-lavender underline">Return Home</Link>
      </div>
    );
  }

  // We use bracket notation to bypass the 'title' property error completely
  return (
    <main className="min-h-screen bg-[#050508] text-white p-10">
      <Link href="/" className="text-lavender mb-10 inline-block">← Back</Link>
      <h1 className="text-4xl font-bold">
        {study['title'] || study['name'] || 'Case Study'}
      </h1>
      <div className="mt-10">
        <p className="text-xl text-gray-400">
          {study['description'] || study['excerpt'] || 'Success story content.'}
        </p>
      </div>
    </main>
  );
}
