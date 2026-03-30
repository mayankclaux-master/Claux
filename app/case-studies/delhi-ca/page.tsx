"use client";

import { caseStudies } from '@/lib/caseStudiesData';
import CaseStudyCTA from '@/components/CaseStudyCTA';
import Link from 'next/link';

export default function CaseStudyPage() {
  const study = caseStudies.find(s => s.id === 'delhi-ca');

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
        <h1 className="text-4xl font-bold text-white mb-4">{study.title}</h1>
        <p className="text-xl text-gray-400 mb-8">{study.description}</p>
        
        {/* Render your case study content here using study.content */}
        <div className="prose prose-invert max-w-none">
           {/* Add your specific case study components/sections here */}
        </div>

        <div className="mt-12">
          <CaseStudyCTA />
        </div>
      </div>
    </main>
  );
}
