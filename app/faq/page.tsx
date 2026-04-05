import FAQPageContent from '@/components/FAQPageContent'
import MobileNav from '@/components/MobileNav'
import Link from 'next/link'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'

export default function FAQPage() {
  return (
    <>
      <MobileNav />
      
      {/* Desktop Navbar */}
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
                style={{
                  width: '180px',
                  height: '48px',
                  objectFit: 'contain'
                }}
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-8">
                <Link href="/#agents" className="text-gray-300 hover:text-white transition-colors">
                  Agents
                </Link>
                <Link href="/#results" className="text-gray-300 hover:text-white transition-colors">
                  Results
                </Link>
                <Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  Pricing
                </Link>
                <Link href="/pricing">
                  <button className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-medium hover:from-indigo-400 hover:to-violet-500 transition-all">
                    Pricing
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <FAQPageContent />

      <SiteFooter />
    </>
  )
}
