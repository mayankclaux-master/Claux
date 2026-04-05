import Link from 'next/link'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Terms of Use | Claux',
  description: 'Read the Terms of Use governing your access to and use of the Claux AI-powered SEO platform.',
}

const EFFECTIVE_DATE = '1 April 2025'
const COMPANY = '7Star Medtech Private Limited and Automize Media Labs Private Limited'

export default function TermsPage() {
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
              <Link href="/privacy" className="hover:text-white transition-colors hidden sm:block">Privacy</Link>
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
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
            📄 Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Terms of Use</h1>
          <p className="text-slate-400 text-lg">
            Please read these terms carefully before using the Claux platform.
          </p>
          <p className="text-slate-600 text-sm mt-4">
            Effective Date: <span className="text-slate-400">{EFFECTIVE_DATE}</span> &nbsp;·&nbsp;
            Last Updated: <span className="text-slate-400">{EFFECTIVE_DATE}</span>
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="bg-[#0D0D14] py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-12 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Parties and Acceptance</h2>
            <p>
              These Terms of Use ("<strong className="text-white">Terms</strong>") constitute a legally binding agreement between you ("<strong className="text-white">User</strong>", "<strong className="text-white">Client</strong>", or "<strong className="text-white">you</strong>") and {COMPANY} (collectively referred to as "<strong className="text-white">Claux</strong>", "<strong className="text-white">we</strong>", "<strong className="text-white">us</strong>", or "<strong className="text-white">our</strong>"), governing your access to and use of the Claux platform, including all associated software, AI agents, dashboards, APIs, content, and services (collectively, the "<strong className="text-white">Platform</strong>").
            </p>
            <p className="mt-3">
              By creating an account, subscribing to any plan, or otherwise accessing or using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy, incorporated herein by reference. If you do not agree, you must immediately cease use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Description of Services</h2>
            <p>
              Claux provides an AI-powered Search Engine Optimisation (SEO) execution platform comprising nine (9) autonomous AI agents — SCRIBE, ARCHITECT, RANKR, LOKALR, SOCIALR, LINKSMITHS, SCHEMA-BORG, SPEEDCHECK, and WATCHDOG — that collectively plan, create, publish, and monitor digital content and technical SEO activities on behalf of the Client.
            </p>
            <p className="mt-3">Services include, but are not limited to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>AI-generated blog content creation and publishing;</li>
              <li>Google Business Profile (GBP) optimisation;</li>
              <li>Technical site audit and schema markup injection;</li>
              <li>Keyword tracking and competitor intelligence;</li>
              <li>Backlink acquisition and local citation building;</li>
              <li>Page-speed monitoring and Core Web Vitals reporting;</li>
              <li>Monthly ranking and traffic reports delivered via dashboard.</li>
            </ul>
            <p className="mt-3">
              The specific scope of services accessible to you is determined by your active subscription plan (Starter, Growth, or Dominator) as detailed on the Claux pricing page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. AI Agent Behaviour, Limitations, and Disclaimer</h2>
            <p>
              The Claux AI agents operate using large language model (LLM) technology, machine-learning models, and third-party data sources. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-white">Outputs are not guaranteed.</strong> AI-generated content, keyword recommendations, and technical suggestions are produced algorithmically and may occasionally contain inaccuracies, outdated information, or errors. Claux does not warrant the accuracy, completeness, or fitness for a particular purpose of any AI output.</li>
              <li><strong className="text-white">SEO results are not guaranteed.</strong> Search engine rankings are governed by algorithms owned and operated by third parties (including Google LLC). Claux provides no guarantee of specific ranking positions, traffic volumes, or commercial outcomes. Historical results displayed on the Platform are illustrative and not a representation of future performance.</li>
              <li><strong className="text-white">Human oversight recommended.</strong> While Claux agents execute autonomously, we strongly recommend that Clients periodically review published content and reports to ensure alignment with their brand guidelines and evolving business objectives.</li>
              <li><strong className="text-white">Third-party integrations.</strong> The Platform may integrate with third-party services (Google Search Console, Google Analytics, Razorpay, etc.). Claux is not liable for downtime, policy changes, or data loss attributable to third-party providers.</li>
              <li><strong className="text-white">Content responsibility.</strong> While Claux generates content on your behalf, you retain ultimate editorial responsibility for all content published under your brand. You agree not to use the Platform to produce content that is defamatory, illegal, plagiarised, or in violation of any applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Account Registration and Security</h2>
            <p>
              To access the Platform, you must register for an account by providing accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Claux will not be liable for any loss or damage arising from unauthorised access to your account due to your failure to safeguard your credentials.
            </p>
            <p className="mt-3">
              You agree to notify Claux immediately at <a href="mailto:clauxagent@gmail.com" className="text-indigo-400 hover:text-indigo-300">clauxagent@gmail.com</a> upon discovering any suspected breach of security or unauthorised use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Subscription Plans, Billing, and Refunds</h2>
            <p>
              Access to the Platform is provided on a monthly subscription basis. By subscribing, you authorise Claux to charge your designated payment method on a recurring basis until cancellation.
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-white">Pricing.</strong> Current plan prices are published on the Claux pricing page and are subject to change with thirty (30) days' prior notice to existing subscribers.</li>
              <li><strong className="text-white">Payment.</strong> All payments are processed securely via Razorpay. Claux does not store card details.</li>
              <li><strong className="text-white">Cancellation.</strong> You may cancel your subscription at any time via your dashboard. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused days within a paid billing cycle.</li>
              <li><strong className="text-white">Refund policy.</strong> Claux operates a no-refund policy on monthly subscriptions once the billing cycle has commenced, except where required by applicable Indian consumer protection law. Refund requests must be submitted within seven (7) days of the charge date and will be evaluated on a case-by-case basis.</li>
              <li><strong className="text-white">Taxes.</strong> All prices are exclusive of Goods and Services Tax (GST). GST at the applicable rate will be added to invoices issued to Indian entities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Acceptable Use Policy</h2>
            <p>You agree to use the Platform solely for lawful purposes. You must not:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Use the Platform to publish content that is unlawful, defamatory, obscene, or infringes the intellectual property rights of any third party;</li>
              <li>Attempt to reverse-engineer, decompile, or otherwise derive the source code of any Claux software or AI model;</li>
              <li>Use automated scripts, bots, or crawlers to access the Platform in a manner that exceeds normal usage patterns;</li>
              <li>Resell, sublicence, or otherwise commercialise access to the Platform without Claux's prior written consent;</li>
              <li>Use the Platform to engage in any form of spam, black-hat SEO, or activities that violate Google's Webmaster Guidelines;</li>
              <li>Introduce malicious code, viruses, or any material that may impair the functioning of the Platform.</li>
            </ul>
            <p className="mt-3">
              Claux reserves the right to suspend or permanently terminate any account found to be in breach of this Acceptable Use Policy, without notice and without liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Intellectual Property</h2>
            <p>
              All software, AI models, trademarks, trade names, service marks, logos, designs, and other intellectual property comprising the Claux Platform are the exclusive property of {COMPANY} or their respective licensors. Nothing in these Terms grants you any ownership interest in the Platform.
            </p>
            <p className="mt-3">
              You grant Claux a limited, non-exclusive, royalty-free licence to access your website, Google Business Profile, and connected digital assets solely for the purpose of providing the subscribed Services. This licence terminates upon cancellation of your subscription.
            </p>
            <p className="mt-3">
              Content generated by Claux AI agents on your behalf, and published to your properties, is assigned to you upon generation. Claux retains no ongoing claim over such content once the subscription is active and the content has been delivered.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Confidentiality and Data</h2>
            <p>
              Claux treats all Client business data, website credentials, and commercial information as strictly confidential. Such information will not be disclosed to any third party except as required to provide the Services (e.g., publishing content to connected platforms) or as required by applicable law.
            </p>
            <p className="mt-3">
              For details on how personal data is collected, stored, and processed, please refer to our <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Claux and its directors, officers, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, goodwill, or business opportunities, arising from or in connection with your use of or inability to use the Platform.
            </p>
            <p className="mt-3">
              In no event shall Claux's total aggregate liability to you for all claims arising under or in connection with these Terms exceed the total amount paid by you to Claux in the three (3) calendar months immediately preceding the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Claux, its parent companies, affiliates, officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use of the Platform; (b) your breach of these Terms; (c) any content you provide or authorise Claux to publish; or (d) your violation of any applicable law or the rights of any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">11. Term and Termination</h2>
            <p>
              These Terms remain in effect for as long as you maintain an account or active subscription with Claux. Either party may terminate this agreement upon written notice. Claux may terminate or suspend access immediately and without notice if you breach any material term of this agreement, engage in conduct harmful to the Platform or other users, or if required to do so by law.
            </p>
            <p className="mt-3">
              Upon termination, your right to access the Platform ceases immediately. Provisions relating to intellectual property, limitation of liability, indemnification, and governing law shall survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">12. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict-of-law principles. The courts of Mumbai, Maharashtra, shall have exclusive jurisdiction over any dispute arising out of or in connection with these Terms.
            </p>
            <p className="mt-3">
              Before initiating legal proceedings, the parties agree to attempt resolution through good-faith negotiations. If unresolved within thirty (30) days, disputes shall be referred to binding arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Mumbai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">13. Modifications to Terms</h2>
            <p>
              Claux reserves the right to amend these Terms at any time. Material changes will be communicated via email to registered account holders at least fifteen (15) days before taking effect. Your continued use of the Platform after the effective date of any revision constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">14. Contact</h2>
            <p>
              For questions regarding these Terms, please contact:
            </p>
            <div className="mt-3 bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 space-y-1">
              <p className="font-semibold text-white">Claux Legal Team</p>
              <p>7Star Medtech Private Limited &amp; Automize Media Labs Private Limited</p>
              <p>Mumbai, Maharashtra, India</p>
              <p>Email: <a href="mailto:clauxagent@gmail.com" className="text-indigo-400 hover:text-indigo-300">clauxagent@gmail.com</a></p>
            </div>
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
