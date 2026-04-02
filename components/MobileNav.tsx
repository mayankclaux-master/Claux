'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Lock scroll on HTML element to prevent background movement
  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('mobile-menu-open');
    } else {
      document.documentElement.classList.remove('mobile-menu-open');
    }
    return () => document.documentElement.classList.remove('mobile-menu-open');
  }, [isOpen]);

  return (
    <>
      {/* HAMBURGER TRIGGER - Fixed positioned, always accessible */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 right-4 z-[100] p-2 text-white hover:text-lavender transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* OVERLAY - Only renders when open */}
      {isOpen && (
        <div className="fixed inset-0 z-[999999] bg-[#050508] flex flex-col p-8">
          <div className="flex justify-between items-center mb-12">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <Image
                src="/claux-logo.png"
                alt="Claux"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-white hover:text-lavender"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col space-y-8 text-2xl font-medium text-white">
            <Link href="/#agents" onClick={() => setIsOpen(false)}>Agents</Link>
            <Link href="/#results" onClick={() => setIsOpen(false)}>Results</Link>
            <Link href="/pricing" onClick={() => setIsOpen(false)}>Pricing</Link>
            <Link href="/faq" onClick={() => setIsOpen(false)}>FAQ</Link>
          </nav>

          <div className="mt-auto pb-12">
            <Link 
              href="/#demo" 
              onClick={() => setIsOpen(false)}
              className="block w-full py-4 text-center rounded-xl bg-lavender text-white font-bold"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
