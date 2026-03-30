"use client";

import { caseStudies } from '@/lib/caseStudiesData';
import CaseStudyCTA from '@/components/CaseStudyCTA';
import Link from 'next/link';

export default function CaseStudyPage() {
  // Use 'any' to bypass the TypeScript 'title' vs 'name' property conflict
  const study = caseStudies.find((s: any) => s.id === 'delhi-ca') as any;

  if (!study) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-white">
        <p>Case study not found.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-lavender hover:underline mb-8 inline-block">
          ← Back to Results
        </Link>
        
        {/* Dynamic header using whatever property exists */}
        <h1 className="text-4xl font-bold text-white mb-4">
          {study.title || study.name || "Delhi CA Case Study"}
        </h1>
        
        <p className="text-xl text-gray-400 mb-8">
          {study.description || study.excerpt || ""}
        </p>
        
        <div className="prose prose-invert max-w-none text-white">
           {/* Fallback to render raw content if available */}
           {typeof study.content === 'string' ? study.content : "Success story for Delhi CA."}
        </div>

        <div className="mt-12">
          <CaseStudyCTA />
        </div>
      </div>
    </main>
  );
}
