import Link from 'next/link'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Grievance Redressal | Claux',
  description: 'Submit a formal grievance or data concern to Claux. We respond within 30 days per the IT Act 2000 and DPDP Act 2023.',
}

export default function GrievancePage() {
  return (
    <>
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#050508]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Image src="/claux-logo-cropped.png" alt="Claux" width={140} height={38} className="object-contain" priority />
            </Link>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-white transition-colors hidden sm:block">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors hidden sm:block">Privacy</Link>
              <Link href="/pricing" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#050508] border-b border-gray-800 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
            ⚖️ Grievance Redressal
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Grievance Redressal</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            We take every concern seriously. Submit your grievance below and our designated officer will acknowledge it within 48 hours and resolve it within 30 days.
          </p>
          <p className="text-slate-600 text-sm mt-4">
            Pursuant to the <span className="text-slate-400">Information Technology Act, 2000</span> and the{' '}
            <span className="text-slate-400">Digital Personal Data Protection Act, 2023</span>
          </p>
        </div>
      </section>

      <main className="bg-[#0D0D14] py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Grievance Officer Card */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6">Designated Grievance Officer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-lg font-bold">G</div>
                  <div>
                    <p className="text-white font-semibold">Grievance Officer</p>
                    <p className="text-slate-500 text-xs">Claux — Automize Media Labs Pvt Ltd</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-20 shrink-0">Email</span>
                    <a href="mailto:clauxagent@gmail.com" className="text-indigo-400 hover:text-indigo-300 break-all">clauxagent@gmail.com</a>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-20 shrink-0">Address</span>
                    <span>Mumbai, Maharashtra, India — 400001</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-20 shrink-0">Available</span>
                    <span>Monday – Friday, 10:00 AM – 6:00 PM IST</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-sm text-slate-300">
                <h3 className="text-white font-semibold mb-4">Resolution Timeline</h3>
                <div className="space-y-4">
                  {[
                    { step: '48 hrs', label: 'Acknowledgement', desc: 'We acknowledge receipt of your grievance and assign a reference number.' },
                    { step: '7 days', label: 'Initial Response', desc: 'A preliminary assessment and response detailing the resolution path.' },
                    { step: '30 days', label: 'Final Resolution', desc: 'Complete resolution or escalation rationale provided in writing.' },
                  ].map(({ step, label, desc }) => (
                    <div key={step} className="flex gap-4">
                      <div className="text-xs font-bold text-indigo-400 w-14 shrink-0 pt-0.5">{step}</div>
                      <div>
                        <p className="text-white font-medium text-xs mb-0.5">{label}</p>
                        <p className="text-slate-500 text-xs">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Scope */}
          <section className="text-sm text-slate-300 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Scope of Grievances Handled</h2>
            <p>
              Our Grievance Redressal Mechanism covers the following categories of concerns:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Data Privacy Concerns', 'Unlawful processing, breach notification, or denial of data subject rights.'],
                ['Account & Billing Disputes', 'Unauthorised charges, failed refund requests, or subscription errors.'],
                ['Service Quality Complaints', 'Persistent platform failures, AI agent errors, or SLA breaches.'],
                ['Content Concerns', 'AI-generated content that is objectionable, inaccurate, or legally problematic.'],
                ['Security Incidents', 'Suspected data breach, credential compromise, or platform vulnerability.'],
                ['Third-Party Partner Conduct', 'Issues arising from affiliate or partner interactions conducted via Claux.'],
              ].map(([title, desc]) => (
                <div key={title} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                  <p className="text-white font-semibold text-xs mb-1.5">{title}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How to submit */}
          <section className="text-sm text-slate-300">
            <h2 className="text-xl font-bold text-white mb-4">How to Submit a Grievance</h2>
            <p className="mb-6">
              To ensure prompt resolution, please email us at{' '}
              <a href="mailto:clauxagent@gmail.com" className="text-indigo-400 hover:text-indigo-300 font-medium">clauxagent@gmail.com</a>{' '}
              with the subject line <strong className="text-white">GRIEVANCE: [Brief Description]</strong> and include the following information:
            </p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong className="text-white">Your full name</strong> and the email address associated with your Claux account.
              </li>
              <li>
                <strong className="text-white">Grievance category</strong> (e.g., Data Privacy, Billing, Service Quality — refer to the categories above).
              </li>
              <li>
                <strong className="text-white">Detailed description</strong> of the concern, including relevant dates, transaction IDs, or screenshots where applicable.
              </li>
              <li>
                <strong className="text-white">Desired resolution</strong> — describe the outcome you are seeking.
              </li>
              <li>
                <strong className="text-white">Supporting documentation</strong> — attach any evidence relevant to your complaint (PDF, PNG, or JPEG format; maximum 10 MB per file).
              </li>
            </ol>

            <div className="mt-8 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
              <p className="text-indigo-300 font-semibold mb-2">📧 Submit Your Grievance Now</p>
              <p className="text-slate-400 text-xs mb-4">
                Click the button below to open a pre-formatted grievance email. Ensure you include all the required information listed above.
              </p>
              <a
                href="mailto:clauxagent@gmail.com?subject=GRIEVANCE%3A%20%5BBrief%20Description%5D&body=Name%3A%20%0AAccount%20Email%3A%20%0ACategory%3A%20%0ADescription%3A%20%0ADesired%20Resolution%3A%20"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Grievance Officer
              </a>
            </div>
          </section>

          {/* Escalation */}
          <section className="text-sm text-slate-300">
            <h2 className="text-xl font-bold text-white mb-4">Escalation &amp; External Remedies</h2>
            <p>
              If you are not satisfied with the resolution provided by our Grievance Officer within thirty (30) days, you may escalate your concern to the following authorities:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-3">
              <li>
                <strong className="text-white">Data Protection Board of India (DPBI)</strong> — for grievances arising under the Digital Personal Data Protection Act, 2023. Visit{' '}
                <span className="text-slate-400">meity.gov.in</span> for filing procedures.
              </li>
              <li>
                <strong className="text-white">Ministry of Electronics and Information Technology (MeitY)</strong> — for matters governed by the Information Technology Act, 2000.
              </li>
              <li>
                <strong className="text-white">Consumer Courts</strong> — for consumer disputes, as per the Consumer Protection Act, 2019. Complaints may be filed via the National Consumer Disputes Redressal Commission portal at{' '}
                <span className="text-slate-400">consumerhelpline.gov.in</span>.
              </li>
              <li>
                <strong className="text-white">Cyber Crime Cell</strong> — for grievances involving fraud, data theft, or cybercrime. Report at{' '}
                <span className="text-slate-400">cybercrime.gov.in</span>.
              </li>
            </ul>
          </section>

          {/* Legal basis */}
          <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-xs text-slate-500">
            <p className="font-semibold text-slate-400 mb-2">Legal Framework</p>
            <p>
              This Grievance Redressal Mechanism is established in compliance with Rule 3(11) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, Section 14 of the Digital Personal Data Protection Act, 2023, and the Consumer Protection (E-Commerce) Rules, 2020. {' '}
              Claux is operated by 7Star Medtech Private Limited and Automize Media Labs Private Limited, both incorporated and registered under the Companies Act, 2013, Republic of India.
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
