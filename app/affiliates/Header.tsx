import Image from 'next/image'
import Link from 'next/link'

import { AFFILIATE_TOKENS } from './tokens'

export function Header() {
  return (
    <nav className="border-b border-gray-800 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/claux-logo-cropped.png"
              alt="Claux"
              width={180}
              height={48}
              className="object-contain"
              style={{ width: '180px', height: '48px', objectFit: 'contain' }}
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#signup-form" className="text-gray-300 hover:text-white transition-colors">
              Apply
            </a>
            <a
              href="#signup-form"
              className={`px-5 py-2 ${AFFILIATE_TOKENS.buttonRadiusClass} font-medium text-white transition-all ${AFFILIATE_TOKENS.ctaGradientClass}`}
            >
              Apply to Become an Affiliate
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
