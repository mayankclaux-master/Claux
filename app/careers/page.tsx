import Link from 'next/link'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Careers | Claux — Build the Future of AI-Driven SEO',
  description: 'Join the Claux team. 12+ open roles across India, UAE, USA, and Singapore. Work on cutting-edge AI agents that autonomously execute SEO for thousands of businesses.',
}

const APPLY_EMAIL = 'clauxagent@gmail.com'

const DEPARTMENTS = [
  {
    name: 'Artificial Intelligence & Research',
    color: '#6366F1',
    roles: [
      {
        title: 'AI Prompt Engineer',
        location: 'Bangalore, India',
        type: 'Full-Time',
        level: 'Mid–Senior',
        description:
          'Design, iterate, and optimise prompts for Claux\'s nine AI agents across content generation, technical SEO, and competitive analysis tasks. You will work at the intersection of NLP, product design, and SEO strategy to ensure agent outputs are accurate, on-brand, and reliably structured.',
        requirements: [
          '3+ years in a prompt engineering, NLP, or AI research role',
          'Deep familiarity with GPT-4, Claude, or Gemini model families',
          'Experience with few-shot learning, chain-of-thought prompting, and output structured via JSON schemas',
          'Strong written English; ability to evaluate output quality quantitatively',
          'Bonus: Prior SEO knowledge or content marketing background',
        ],
      },
      {
        title: 'AI / ML Research Scientist',
        location: 'San Francisco, USA',
        type: 'Full-Time',
        level: 'Senior',
        description:
          'Lead fundamental research into improving Claux\'s AI agent reliability, hallucination reduction, and multi-step reasoning pipelines. Publish findings and build systems that push the state of agentic AI in local SEO applications.',
        requirements: [
          'PhD or equivalent in Machine Learning, NLP, or Computer Science',
          'Track record of publications at NeurIPS, ACL, ICLR, or equivalent',
          'Hands-on experience with fine-tuning and RLHF pipelines',
          'Proficiency in Python, PyTorch, and LangChain / LlamaIndex',
          'Ability to work autonomously in a fast-paced startup environment',
        ],
      },
    ],
  },
  {
    name: 'Engineering',
    color: '#2DD4BF',
    roles: [
      {
        title: 'Lead Backend Developer',
        location: 'Pune, India (Hybrid)',
        type: 'Full-Time',
        level: 'Lead / Senior',
        description:
          'Architect and lead development of Claux\'s core agent orchestration layer, API gateway, and data pipelines. Own the backend infrastructure that powers nine concurrent AI agents processing thousands of SEO tasks daily.',
        requirements: [
          '6+ years of backend engineering experience',
          'Expert-level TypeScript / Node.js; familiarity with Python microservices',
          'Strong background in distributed systems, queue-based architectures (BullMQ, RabbitMQ)',
          'Experience with Supabase or PostgreSQL at scale',
          'Prior experience building AI/LLM-integrated APIs is highly advantageous',
        ],
      },
      {
        title: 'Senior Frontend Developer',
        location: 'Singapore',
        type: 'Full-Time',
        level: 'Senior',
        description:
          'Build and scale the Claux client dashboard — a real-time, data-dense web application used by business owners across Asia and beyond. You will shape the product experience for our fastest-growing user segment.',
        requirements: [
          '5+ years in frontend engineering with React / Next.js',
          'Expert in Tailwind CSS and component design systems',
          'Experience with real-time data (WebSockets, SSE) and charting libraries (Recharts, D3)',
          'Strong eye for UI/UX; can translate Figma to pixel-perfect code',
          'Familiarity with Framer Motion or similar animation libraries',
        ],
      },
      {
        title: 'Full Stack Engineer',
        location: 'Dubai, UAE',
        type: 'Full-Time',
        level: 'Mid–Senior',
        description:
          'Join our UAE hub to build features across the Claux stack — from client-facing dashboards to backend API integrations with Google Search Console, GBP, and third-party SEO data providers.',
        requirements: [
          '4+ years of full-stack experience (Next.js, Node.js, PostgreSQL)',
          'Comfortable working across frontend and backend with minimal hand-holding',
          'Experience integrating OAuth 2.0-based third-party APIs',
          'Solid understanding of REST and GraphQL API design',
          'Valid UAE residency or willingness to relocate (visa sponsorship available)',
        ],
      },
      {
        title: 'DevOps Engineer',
        location: 'Remote, India',
        type: 'Full-Time',
        level: 'Mid–Senior',
        description:
          'Own Claux\'s infrastructure reliability, CI/CD pipelines, and cost optimisation across Vercel, Supabase, and cloud providers. Ensure the platform scales reliably as we expand to new markets.',
        requirements: [
          '4+ years in DevOps, SRE, or platform engineering',
          'Expertise in Vercel, AWS, or GCP deployment pipelines',
          'Experience with Docker, Kubernetes, and infrastructure-as-code (Terraform)',
          'Strong background in monitoring and alerting (Datadog, Grafana, PagerDuty)',
          'Security-first mindset with knowledge of SOC 2 or ISO 27001 principles',
        ],
      },
    ],
  },
  {
    name: 'SEO & Content Strategy',
    color: '#F59E0B',
    roles: [
      {
        title: 'Senior SEO Strategist',
        location: 'Remote, India',
        type: 'Full-Time',
        level: 'Senior',
        description:
          'Define the strategic SEO frameworks that our AI agents execute. You will translate cutting-edge SEO research into actionable agent behaviour, content briefs, and technical audit logic — essentially becoming the brain behind Claux\'s automated strategy.',
        requirements: [
          '6+ years in technical or enterprise SEO',
          'Deep expertise in Google Search algorithm updates, Core Web Vitals, and E-E-A-T',
          'Experience with enterprise SEO tools (Ahrefs, Semrush, Screaming Frog)',
          'Strong analytical skills; comfortable with Google Search Console and GA4 data',
          'Ability to document SEO processes that can be systematised and automated',
        ],
      },
      {
        title: 'Content Strategist — SEO',
        location: 'Remote, India',
        type: 'Full-Time',
        level: 'Mid-Level',
        description:
          'Develop and manage content playbooks for diverse client verticals (healthcare, legal, F&B, real estate, education). You will define content pillars, editorial calendars, and quality benchmarks for AI-generated content.',
        requirements: [
          '3+ years in SEO content strategy or editorial management',
          'Proven ability to build topical authority for websites in competitive niches',
          'Strong written English; experience writing long-form, expert-level content',
          'Familiarity with AI writing tools and knowledge of how to QA AI-generated content',
          'Bonus: Experience managing multilingual content (Hindi, Tamil, or Arabic)',
        ],
      },
    ],
  },
  {
    name: 'Growth & Business Development',
    color: '#EC4899',
    roles: [
      {
        title: 'Growth Hacker',
        location: 'Mumbai, India',
        type: 'Full-Time',
        level: 'Mid–Senior',
        description:
          'Own Claux\'s acquisition funnel from top to bottom — running experiments across SEO, paid, influencer, and affiliate channels. You will be given a budget, a north-star metric, and full autonomy to hit it.',
        requirements: [
          '4+ years in growth marketing or user acquisition',
          'Demonstrable track record of scaling a SaaS or B2B product',
          'Hands-on experience with Meta Ads, Google Ads, LinkedIn Ads, and SEO',
          'Proficiency in analytics tools (GA4, Mixpanel, Amplitude)',
          'Strong systems thinker; capable of building repeatable growth playbooks',
        ],
      },
      {
        title: 'Business Development Manager',
        location: 'Dubai, UAE',
        type: 'Full-Time',
        level: 'Senior',
        description:
          'Drive enterprise and mid-market sales across the GCC and MENA region. Build strategic partnerships with digital agencies, business groups, and enterprise clients who need scalable AI-driven SEO.',
        requirements: [
          '5+ years in B2B SaaS sales or business development',
          'Established network in the UAE/GCC business ecosystem',
          'Fluency in English; Arabic proficiency is a strong advantage',
          'Experience closing deals in the AED 50K–500K annual range',
          'Valid UAE residency or eligibility for a work permit',
        ],
      },
      {
        title: 'Sales Development Representative',
        location: 'Remote, USA',
        type: 'Full-Time',
        level: 'Entry–Mid',
        description:
          'Generate qualified leads for Claux\'s US go-to-market expansion through outbound prospecting, cold outreach, and inbound qualification. Be the first point of contact for US-based SMBs considering AI-powered SEO.',
        requirements: [
          '1–3 years in an SDR or BDR role, preferably in SaaS',
          'Strong outbound prospecting skills (LinkedIn Sales Navigator, Apollo, Outreach)',
          'Excellent verbal and written English communication',
          'Familiarity with CRM tools (HubSpot or Salesforce)',
          'Self-motivated with the ability to work independently across time zones',
        ],
      },
    ],
  },
  {
    name: 'Product & Customer Success',
    color: '#8B5CF6',
    roles: [
      {
        title: 'Product Manager — AI Platforms',
        location: 'New York, USA',
        type: 'Full-Time',
        level: 'Senior',
        description:
          'Own the product roadmap for Claux\'s AI agent layer and client dashboard. Translate user research, data signals, and market trends into prioritised features that make Claux the world\'s most powerful autonomous SEO platform.',
        requirements: [
          '5+ years in product management, ideally in AI/ML or SaaS platforms',
          'Strong data fluency; comfortable analysing product metrics in SQL or similar',
          'Experience working in cross-functional teams (engineering, design, go-to-market)',
          'Ability to write crisp PRDs and user stories with minimal ambiguity',
          'Bonus: Prior experience in SEO, local marketing, or small business tools',
        ],
      },
      {
        title: 'Customer Success Manager',
        location: 'Singapore',
        type: 'Full-Time',
        level: 'Mid-Level',
        description:
          'Ensure Claux clients in the APAC region achieve measurable SEO outcomes. You will own onboarding, quarterly business reviews, renewal conversations, and proactive churn prevention for a book of 50–80 accounts.',
        requirements: [
          '3+ years in customer success or account management for a SaaS product',
          'Excellent communication and stakeholder management skills',
          'Ability to interpret SEO dashboards and translate insights into client-friendly narratives',
          'Proactive, data-driven approach to identifying at-risk accounts',
          'Valid Singapore Employment Pass or eligible PR',
        ],
      },
      {
        title: 'Data Analyst',
        location: 'Bangalore, India',
        type: 'Full-Time',
        level: 'Mid-Level',
        description:
          'Build the data infrastructure and reporting layer that powers Claux\'s business intelligence — from AI agent performance metrics to client SEO outcome tracking and revenue analytics.',
        requirements: [
          '3+ years in data analysis or business intelligence',
          'Expert in SQL; proficiency in Python (Pandas, NumPy)',
          'Experience with BI tools (Metabase, Looker, or Tableau)',
          'Ability to design and maintain data pipelines from API sources to dashboards',
          'Bonus: Experience with SEO data sources (GSC API, Ahrefs API)',
        ],
      },
    ],
  },
]

const LOCATION_BADGES: Record<string, string> = {
  India: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  UAE: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  USA: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  Singapore: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
}

function getLocationColor(location: string): string {
  for (const [key, cls] of Object.entries(LOCATION_BADGES)) {
    if (location.includes(key)) return cls
  }
  return 'bg-slate-500/10 text-slate-300 border-slate-500/20'
}

export default function CareersPage() {
  const totalRoles = DEPARTMENTS.reduce((acc, d) => acc + d.roles.length, 0)

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
              <Link href="/affiliates" className="hover:text-white transition-colors hidden sm:block">Partner with Us</Link>
              <Link href="/pricing" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#050508] border-b border-gray-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
            🌍 {totalRoles} Open Positions Globally
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Build the Future of<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AI-Powered SEO</span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            We are assembling a world-class team to deploy autonomous AI agents that execute SEO for thousands of businesses across Asia, the Middle East, and North America. If you want to work at the bleeding edge of applied AI, this is your seat.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {[
              { label: 'Open Roles', value: `${totalRoles}+` },
              { label: 'Countries', value: '4' },
              { label: 'AI Agents', value: '9' },
              { label: 'Founded', value: '2024' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center px-4">
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </div>
            ))}
          </div>

          <a
            href={`mailto:${APPLY_EMAIL}?subject=Application%20%E2%80%94%20%5BRole%20Title%5D&body=Hi%20Claux%20Team%2C%0A%0AI%20am%20applying%20for%20the%20%5BRole%20Title%5D%20position.%0A%0A%5BYour%20introduction%5D%0A%0APortfolio%2FLinkedIn%3A%20%5BURL%5D%0AResume%20attached.`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
          >
            Apply Now — {APPLY_EMAIL}
          </a>
          <p className="text-slate-600 text-xs mt-3">Send your portfolio and resume to get started. We review every application personally.</p>
        </div>
      </section>

      {/* Location Pills */}
      <section className="bg-[#050508] py-6 px-4 border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {Object.entries(LOCATION_BADGES).map(([country, cls]) => (
            <span key={country} className={`inline-flex items-center gap-1.5 border rounded-full px-4 py-1.5 text-xs font-semibold ${cls}`}>
              {country === 'India' && '🇮🇳'}
              {country === 'UAE' && '🇦🇪'}
              {country === 'USA' && '🇺🇸'}
              {country === 'Singapore' && '🇸🇬'}
              Hiring in {country}
            </span>
          ))}
        </div>
      </section>

      {/* Job Listings */}
      <main className="bg-[#0D0D14] py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          {DEPARTMENTS.map((dept) => (
            <section key={dept.name}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ background: dept.color }} />
                <h2 className="text-lg font-bold text-white">{dept.name}</h2>
                <span className="text-xs text-slate-500 ml-1">{dept.roles.length} role{dept.roles.length > 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-4">
                {dept.roles.map((role) => (
                  <details key={role.title} className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-colors">
                    <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <span className="text-white font-semibold text-base">{role.title}</span>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center border rounded-full px-3 py-0.5 text-xs font-medium ${getLocationColor(role.location)}`}>
                            {role.location}
                          </span>
                          <span className="inline-flex items-center border border-white/10 rounded-full px-3 py-0.5 text-xs text-slate-400">
                            {role.type}
                          </span>
                          <span className="inline-flex items-center border border-white/10 rounded-full px-3 py-0.5 text-xs text-slate-400">
                            {role.level}
                          </span>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-slate-500 flex-shrink-0 ml-4 transition-transform group-open:rotate-180"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>

                    <div className="px-6 pb-6 border-t border-white/[0.06] pt-5">
                      <p className="text-slate-300 text-sm leading-relaxed mb-5">{role.description}</p>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Requirements</h4>
                      <ul className="space-y-2 mb-6">
                        {role.requirements.map((req) => (
                          <li key={req} className="flex items-start gap-2.5 text-sm text-slate-300">
                            <svg className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {req}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={`mailto:${APPLY_EMAIL}?subject=Application%20%E2%80%94%20${encodeURIComponent(role.title)}&body=Hi%20Claux%20Team%2C%0A%0AI%20am%20applying%20for%20the%20${encodeURIComponent(role.title)}%20position%20(${encodeURIComponent(role.location)}).%0A%0A%5BYour%20introduction%5D%0A%0APortfolio%2FLinkedIn%3A%20%5BURL%5D%0AResume%20attached.`}
                        className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                        style={{
                          background: `${dept.color}15`,
                          border: `1px solid ${dept.color}30`,
                          color: dept.color,
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Apply for this Role
                      </a>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-gradient-to-br from-indigo-900/30 to-violet-900/20 border border-indigo-500/20 rounded-2xl p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Don't see your role listed?
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              We are a fast-growing company. If you are exceptional and believe you can contribute to Claux's mission, send us an open application.
            </p>
            <a
              href={`mailto:${APPLY_EMAIL}?subject=Open%20Application%20%E2%80%94%20%5BYour%20Expertise%5D&body=Hi%20Claux%20Team%2C%0A%0AI%20would%20like%20to%20submit%20an%20open%20application.%0A%0AExpertise%3A%20%5BYour%20area%5D%0APortfolio%2FLinkedIn%3A%20%5BURL%5D%0AResume%20attached.`}
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Send Open Application
            </a>
            <p className="text-slate-600 text-xs mt-4">
              Apply by sending your portfolio to <span className="text-slate-400">{APPLY_EMAIL}</span>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
