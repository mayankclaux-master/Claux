'use client';

import { motion } from 'framer-motion';
import DemoSidebar from '@/components/demo/DemoSidebar';

const agents = [
  {
    name: 'ARIA',
    role: 'Keyword Intelligence',
    description:
      'Reverse-engineers what your top 3 competitors rank for, finds keyword gaps, maps high-intent terms before customers search.',
    metric: '67 keywords mapped',
    tasks: [
      'andheri dentist implants mapped',
      '23 competitor gaps identified',
      'Intent cluster report generated',
    ],
    progress: 94,
  },
  {
    name: 'SCRIBE',
    role: 'Content Agent',
    description:
      "Turns ARIA's keyword map into published, Google-optimized content — blog posts, service pages, location pages.",
    metric: '8 articles published this month',
    tasks: [
      'Top 5 Dental Services Mumbai published',
      'Root Canal Cost outline created',
      'Teeth Whitening article in review',
    ],
    progress: 78,
  },
  {
    name: 'LOCL',
    role: 'GBP Agent',
    description:
      'Manages your Google Business Profile like a live product — weekly posts, category fixes, NAP consistency.',
    metric: '50+ directories synced',
    tasks: [
      'Summer Dental Camp post published',
      '3 GBP attributes updated',
      'NAP synced across 12 directories',
    ],
    progress: 100,
  },
  {
    name: 'LINX',
    role: 'Backlink Agent',
    description:
      'Identifies competitor backlink sources, builds domain authority through Indian directories and niche blogs.',
    metric: '5-15 backlinks/month',
    tasks: [
      'healthindia.in backlink acquired (DA41)',
      'dentistryindia.com outreach sent',
      '2 guest post slots confirmed',
    ],
    progress: 61,
  },
  {
    name: 'CORE',
    role: 'Technical SEO',
    description:
      'Crawls your entire website like a Google bot — finds broken links, slow pages, crawl errors, schema issues.',
    metric: '200+ signals audited',
    tasks: ['12 crawl errors fixed', 'Page speed improved to 91', 'Schema markup added to 4 pages'],
    progress: 88,
  },
  {
    name: 'PULSE',
    role: 'Rank Tracker',
    description:
      'Tracks 500+ keyword positions daily across Google Search, Maps, and AI Overviews.',
    metric: 'Daily rank updates',
    tasks: [
      "'dentist andheri west' moved to #3",
      '5 keywords entered top 10',
      'AI Overview appearance detected',
    ],
    progress: 100,
  },
  {
    name: 'REPUTE',
    role: 'Reputation Mgmt',
    description:
      'Monitors every new review on Google, Justdial, IndiaMart — triggers smart review request sequences.',
    metric: '+0.8 star improvement',
    tasks: [
      'Review request sent to 14 patients',
      '4.2→4.6 star rating achieved',
      'Negative review flagged for response',
    ],
    progress: 71,
  },
  {
    name: 'RIVAL',
    role: 'Competitor Intel',
    description:
      'Watches your top 5 competitors 24/7 — tracks their content, backlinks, rankings, and GBP changes.',
    metric: 'Weekly gap reports',
    tasks: [
      'SmileCare published 2 new pages',
      'Competitor keyword gap report generated',
      'Monday morning briefing delivered',
    ],
    progress: 100,
  },
  {
    name: 'AMPLI',
    role: 'Distribution',
    description:
      'Pushes every new piece of content through 30+ social signals, indexing APIs, and syndication channels.',
    metric: '2x faster indexing',
    tasks: [
      'Article pushed to 31 channels',
      'Google indexed new blog in 4.2 hours',
      '3 social signals amplified',
    ],
    progress: 100,
  },
];

export default function AgentsPage() {
  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <DemoSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1200px] mx-auto"
        >
          <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
          <p className="text-[#8892A4] mb-8">9 autonomous agents working 24/7</p>

          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{agent.name}</h2>
                    <p className="text-sm text-[#8892A4]">{agent.role}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#1D9E75] bg-[#1D9E75]/10 px-2 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9E75] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D9E75]" />
                    </span>
                    Active 24/7
                  </div>
                </div>

                <p className="text-sm text-[#8892A4] leading-relaxed mb-4 min-h-[56px]">{agent.description}</p>

                <div className="mb-4">
                  <div className="text-xs text-[#8892A4] mb-2">Last 3 Completed Tasks</div>
                  <ul className="space-y-1.5">
                    {agent.tasks.map((task) => (
                      <li key={task} className="text-sm flex items-start gap-2">
                        <span className="text-[#1D9E75] mt-0.5">✓</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8892A4]">Performance Metric</span>
                  <span className="text-[#1D9E75] font-medium">{agent.metric}</span>
                </div>
                <div className="w-full bg-[#1E2130] rounded-full h-2 mb-4">
                  <div className="bg-[#7F77DD] h-2 rounded-full" style={{ width: `${agent.progress}%` }} />
                </div>

                <button className="w-full border border-[#7F77DD]/40 text-[#7F77DD] rounded-lg py-2.5 text-sm hover:bg-[#7F77DD]/10 transition-colors">
                  View Full History
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
