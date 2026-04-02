import PricingPage from '@/components/PricingPage'
import SavingsCalculator from '@/components/SavingsCalculator'
import MobileNav from '@/components/MobileNav'
import Link from 'next/link'
import Image from 'next/image'

export default function Pricing() {
  return (
    <>
      <MobileNav />
      
      {/* Desktop Navbar */}
      <nav className="border-b border-gray-800 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/claux-logo.png"
                alt="Claux"
                width={120}
                height={40}
                className="object-contain"
                style={{
                  width: '120px',
                  height: '40px',
                  minWidth: '120px',
                  objectFit: 'contain',
                  objectPosition: 'left center'
                }}
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-8">
                <a href="/#agents" className="text-gray-300 hover:text-white transition-colors">
                  Agents
                </a>
                <a href="/#results" className="text-gray-300 hover:text-white transition-colors">
                  Results
                </a>
                <a href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </a>
                <a href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  Pricing
                </a>
                <a href="/faq">
                  <button className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-medium hover:from-indigo-400 hover:to-violet-500 transition-all">
                    FAQs
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <PricingPage />
      <SavingsCalculator />

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#050508] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎯</span>
                <span className="text-xl font-bold text-white">Claux</span>
              </div>
              <p className="text-slate-400 text-sm">
                9 AI agents. 24/7 execution. Zero human error.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="/#agents" className="text-slate-400 hover:text-white text-sm transition-colors">AI Agents</a></li>
                <li><a href="/#results" className="text-slate-400 hover:text-white text-sm transition-colors">Case Studies</a></li>
                <li><a href="/#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How It Works</a></li>
                <li><a href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/#" className="text-slate-400 hover:text-white text-sm transition-colors">About</a></li>
                <li><a href="/#" className="text-slate-400 hover:text-white text-sm transition-colors">Blog</a></li>
                <li><a href="/#" className="text-slate-400 hover:text-white text-sm transition-colors">Careers</a></li>
                <li><a href="/#" className="text-slate-400 hover:text-white text-sm transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/#" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="/#" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</a></li>
                <li><a href="/#" className="text-slate-400 hover:text-white text-sm transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2024 Claux. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
