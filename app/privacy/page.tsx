import Link from 'next/link'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Privacy Policy | Claux',
  description: 'Claux Privacy Policy — how we collect, use, protect, and never sell your personal data. GDPR and DPDP Act 2023 compliant.',
}

const EFFECTIVE_DATE = '1 April 2025'
const COMPANY = '7Star Medtech Private Limited and Automize Media Labs Private Limited'

export default function PrivacyPage() {
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
              <Link href="/grievance" className="hover:text-white transition-colors hidden sm:block">Grievance</Link>
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
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
            🔒 Data Protection
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            We are committed to protecting your personal data. This policy explains exactly what we collect, how we use it, and how you can exercise your rights.
          </p>
          <p className="text-slate-600 text-sm mt-4">
            Effective Date: <span className="text-slate-400">{EFFECTIVE_DATE}</span> &nbsp;·&nbsp;
            Compliant with: <span className="text-slate-400">GDPR · India DPDP Act 2023 · IT Act 2000</span>
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="bg-[#0D0D14] py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-12 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Data Controller</h2>
            <p>
              The data controller responsible for your personal data is <strong className="text-white">{COMPANY}</strong>, operating the Claux platform. For all data-related enquiries, please contact our Data Protection Officer at <a href="mailto:clauxagent@gmail.com" className="text-indigo-400 hover:text-indigo-300">clauxagent@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Data We Collect</h2>
            <p>We collect the following categories of personal and business data:</p>

            <div className="mt-4 space-y-4">
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">Account &amp; Identity Data</h3>
                <p>Full name, email address, phone number, business name, GST number (if provided), and billing address, collected when you register for an account or subscribe to a plan.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">Website &amp; Digital Asset Credentials</h3>
                <p>Google Search Console access tokens, Google Business Profile OAuth tokens, website URL, and CMS credentials, provided by you to enable AI agent execution. These are stored encrypted at rest using AES-256 and transmitted exclusively over TLS 1.3.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">Usage &amp; Analytics Data</h3>
                <p>Pages visited within the Claux dashboard, feature interactions, session duration, IP address, browser type, and device identifiers, collected automatically via server logs and analytics tools for the purpose of platform improvement and security.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">Payment Data</h3>
                <p>Transaction references and subscription status. Card details and UPI credentials are processed exclusively by Razorpay (PCI-DSS Level 1 certified). Claux does not store any payment instrument information on its servers.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">Communications Data</h3>
                <p>Emails, support tickets, and messages you send to Claux, retained to resolve queries and improve service quality.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Legal Basis for Processing</h2>
            <p>We process your personal data on the following legal bases:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-white">Contract performance:</strong> Processing necessary to provide the subscribed Services to you.</li>
              <li><strong className="text-white">Legitimate interests:</strong> Platform security, fraud prevention, analytics, and service improvement.</li>
              <li><strong className="text-white">Legal obligation:</strong> Compliance with Indian tax law, the DPDP Act 2023, and applicable regulations.</li>
              <li><strong className="text-white">Consent:</strong> For marketing communications; you may withdraw consent at any time by unsubscribing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provision, maintain, and improve the Claux Platform and AI agent services;</li>
              <li>To authenticate your account and prevent unauthorised access;</li>
              <li>To process subscription payments and issue invoices;</li>
              <li>To send service notifications, billing reminders, and product updates;</li>
              <li>To respond to support queries and grievance submissions;</li>
              <li>To comply with applicable legal and regulatory obligations;</li>
              <li>To conduct internal analytics and business intelligence solely to improve platform performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Data Encryption and Security</h2>
            <p>
              Claux employs industry-leading technical and organisational measures to protect your personal data:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-white">Encryption at rest:</strong> All sensitive data (credentials, tokens, and personal identifiers) is encrypted at rest using AES-256.</li>
              <li><strong className="text-white">Encryption in transit:</strong> All data transmitted between your browser, our servers, and third-party APIs is protected using TLS 1.3.</li>
              <li><strong className="text-white">Access control:</strong> Access to production systems and personal data is restricted to authorised personnel on a strict need-to-know basis, enforced through role-based access control (RBAC) and multi-factor authentication (MFA).</li>
              <li><strong className="text-white">Vulnerability management:</strong> We conduct periodic security audits, dependency scanning, and penetration testing of the Platform.</li>
              <li><strong className="text-white">Breach notification:</strong> In the event of a personal data breach, we will notify affected users and the relevant supervisory authority (where required) within seventy-two (72) hours of becoming aware of the breach, in accordance with GDPR Article 33 and the DPDP Act 2023.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. We Do Not Sell Your Data</h2>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <p className="font-semibold text-emerald-300 mb-2">Explicit Non-Sale Declaration</p>
              <p>
                Claux does not sell, rent, trade, or otherwise transfer your personal data to any third party for commercial purposes. Your data is yours. We monetise by providing you with excellent software services — not by commoditising your personal information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Data Sharing with Third Parties</h2>
            <p>We share data only with trusted processors strictly necessary to deliver the Services:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-white">Supabase (Supabase Inc.):</strong> Database hosting for account and configuration data, hosted in regions with adequate data protection standards.</li>
              <li><strong className="text-white">Razorpay (Razorpay Software Pvt Ltd):</strong> Payment processing. PCI-DSS compliant.</li>
              <li><strong className="text-white">Google LLC:</strong> Integration APIs (Search Console, Analytics, GBP). Data shared as directed by you for service delivery only.</li>
              <li><strong className="text-white">Vercel Inc.:</strong> Platform hosting and CDN delivery.</li>
              <li><strong className="text-white">OpenAI / Anthropic:</strong> AI model APIs used by Claux agents. Prompts may include your website content but not your personal account identifiers.</li>
            </ul>
            <p className="mt-3">All third-party processors are bound by appropriate data processing agreements (DPAs). No data is shared with any entity for independent marketing or profiling purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as necessary to provide the Services. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Account data is retained for ninety (90) days to facilitate account reactivation if requested.</li>
              <li>After ninety days, personal identifiers are permanently deleted or anonymised.</li>
              <li>Financial records (invoices, transaction references) are retained for seven (7) years as required under Indian accounting and tax law.</li>
              <li>AI-generated content published to your properties remains under your control and is not retained by Claux post-termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Cookies and Tracking Technologies</h2>
            <p>
              Claux uses strictly necessary cookies to maintain session state and authenticate users. We do not use third-party advertising cookies or cross-site tracking technologies. Analytics cookies used are first-party and serve solely to improve platform performance.
            </p>
            <p className="mt-3">
              You may disable cookies through your browser settings; however, doing so may impair your ability to access authenticated areas of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {[
                ['Right of Access', 'Request a copy of the personal data we hold about you.'],
                ['Right to Rectification', 'Request correction of inaccurate or incomplete data.'],
                ['Right to Erasure', 'Request deletion of your data ("right to be forgotten") subject to legal retention obligations.'],
                ['Right to Portability', 'Receive your data in a structured, machine-readable format.'],
                ['Right to Restriction', 'Request that processing of your data be restricted in certain circumstances.'],
                ['Right to Object', 'Object to processing based on legitimate interests or for direct marketing purposes.'],
              ].map(([title, desc]) => (
                <div key={title} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                  <p className="text-white font-semibold text-xs mb-1">{title}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              To exercise any of these rights, submit a written request to <a href="mailto:clauxagent@gmail.com" className="text-indigo-400 hover:text-indigo-300">clauxagent@gmail.com</a>. We will respond within thirty (30) days. If you are dissatisfied with our response, you have the right to lodge a complaint with the applicable supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">11. International Transfers</h2>
            <p>
              Claux operates primarily from India and processes data using cloud infrastructure hosted within India and in regions with adequate data protection standards (EU Standard Contractual Clauses or equivalent). Where data is transferred internationally, we ensure appropriate safeguards are in place consistent with applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">12. Children's Privacy</h2>
            <p>
              The Claux Platform is intended solely for business use by individuals aged eighteen (18) years or older. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately and we will delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated to registered users via email at least fifteen (15) days before the updated policy takes effect. The effective date at the top of this document will always reflect the date of the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">14. Contact &amp; Data Protection Officer</h2>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 space-y-1">
              <p className="font-semibold text-white">Data Protection Officer — Claux</p>
              <p>7Star Medtech Private Limited &amp; Automize Media Labs Private Limited</p>
              <p>Mumbai, Maharashtra, India</p>
              <p>Email: <a href="mailto:clauxagent@gmail.com" className="text-indigo-400 hover:text-indigo-300">clauxagent@gmail.com</a></p>
              <p className="text-slate-500 text-xs pt-2">For data subject requests, please include "Data Request" in your email subject line.</p>
            </div>
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
