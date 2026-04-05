import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#050508] border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/claux-logo-cropped.png"
                alt="Claux"
                width={180}
                height={48}
                className="object-contain"
                style={{ width: '180px', height: '48px', objectFit: 'contain' }}
                priority
              />
            </div>
            <p className="text-slate-500 text-sm">9 AI Agents. 1 Goal. Page 1.</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Home
            </Link>
            <a href="#how-it-works" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              How It Works
            </a>
            <a href="#signup-form" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Apply
            </a>
          </div>

          <p className="text-slate-500 text-sm">© 2026 Claux. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
