import Image from 'next/image'
import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 bg-[#050508] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 mb-12">

          {/* Brand column — spans 2 */}
          <div className="md:col-span-2">
            <Link href="/">
              <Image
                src="/claux-logo-cropped.png"
                alt="Claux"
                width={160}
                height={42}
                className="object-contain mb-3"
                priority
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              9 autonomous AI agents executing your SEO strategy 24/7. Built for businesses that want Page 1 — not promises.
            </p>
            <p className="text-slate-600 text-xs mt-4 leading-relaxed max-w-xs">
              A product by <span className="text-slate-500">7Star Medtech Private Limited</span> &amp; <span className="text-slate-500">Automize Media Labs Private Limited</span>.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/#agents" className="text-slate-400 hover:text-white text-sm transition-colors">AI Agents</Link></li>
              <li><Link href="/#results" className="text-slate-400 hover:text-white text-sm transition-colors">Case Studies</Link></li>
              <li><Link href="/#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="text-slate-400 hover:text-white text-sm transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/careers" className="text-slate-400 hover:text-white text-sm transition-colors">Careers</Link></li>
              <li><Link href="/affiliates" className="text-slate-400 hover:text-white text-sm transition-colors">Partner with Us</Link></li>
              <li><Link href="/grievance" className="text-slate-400 hover:text-white text-sm transition-colors">Grievance</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/grievance" className="text-slate-400 hover:text-white text-sm transition-colors">Grievance Redressal</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Claux. All rights reserved. Operated by 7Star Medtech Private Limited &amp; Automize Media Labs Private Limited.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Terms</Link>
            <Link href="/privacy" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Privacy</Link>
            <Link href="/grievance" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Grievance</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
