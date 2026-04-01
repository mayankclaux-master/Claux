'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import DemoSidebar from '@/components/demo/DemoSidebar';

type Agent = {
  name: string;
  role: string;
  description: string;
  metric: string;
  tasks: string[];
  taskHistory: Array<{ task: string; timestamp: string }>;
  performance: Array<{ day: string; score: number }>;
  progress: number;
};

type ThinkingEntry = {
  timestamp: string;
  reasoning: string;
  action: string;
  outcome: string;
};

const agents: Agent[] = [
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
    taskHistory: [
      { task: 'andheri dentist implants mapped', timestamp: 'Today, 09:30 AM' },
      { task: '23 competitor gaps identified', timestamp: 'Yesterday, 02:15 PM' },
      { task: 'Intent cluster report generated', timestamp: '2 days ago, 11:00 AM' },
    ],
    performance: [
      { day: 'W1', score: 71 },
      { day: 'W2', score: 76 },
      { day: 'W3', score: 81 },
      { day: 'W4', score: 87 },
      { day: 'W5', score: 91 },
      { day: 'W6', score: 94 },
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
    taskHistory: [
      { task: 'Top 5 Dental Services Mumbai published', timestamp: 'Today, 08:54 AM' },
      { task: 'Root Canal Cost outline created', timestamp: 'Mar 8, 10:20 AM' },
      { task: 'Teeth Whitening article in review', timestamp: 'Mar 15, 09:00 AM' },
    ],
    performance: [
      { day: 'W1', score: 62 },
      { day: 'W2', score: 67 },
      { day: 'W3', score: 70 },
      { day: 'W4', score: 73 },
      { day: 'W5', score: 76 },
      { day: 'W6', score: 78 },
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
    taskHistory: [
      { task: 'Summer Dental Camp post published', timestamp: 'Today, 01:00 AM' },
      { task: '3 GBP attributes updated', timestamp: 'Yesterday, 03:30 PM' },
      { task: 'NAP synced across 12 directories', timestamp: 'Yesterday, 12:15 PM' },
    ],
    performance: [
      { day: 'W1', score: 79 },
      { day: 'W2', score: 84 },
      { day: 'W3', score: 88 },
      { day: 'W4', score: 92 },
      { day: 'W5', score: 97 },
      { day: 'W6', score: 100 },
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
    taskHistory: [
      { task: 'healthindia.in backlink acquired (DA41)', timestamp: 'Today, 08:19 AM' },
      { task: 'dentistryindia.com outreach sent', timestamp: 'Mar 16, 02:00 PM' },
      { task: '2 guest post slots confirmed', timestamp: 'Yesterday, 11:00 AM' },
    ],
    performance: [
      { day: 'W1', score: 41 },
      { day: 'W2', score: 46 },
      { day: 'W3', score: 52 },
      { day: 'W4', score: 56 },
      { day: 'W5', score: 59 },
      { day: 'W6', score: 61 },
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
    taskHistory: [
      { task: '12 crawl errors fixed', timestamp: 'Today, 09:10 AM' },
      { task: 'Page speed improved to 91', timestamp: 'Mar 14, 11:30 AM' },
      { task: 'Schema markup added to 4 pages', timestamp: 'Yesterday, 03:10 PM' },
    ],
    performance: [
      { day: 'W1', score: 66 },
      { day: 'W2', score: 72 },
      { day: 'W3', score: 79 },
      { day: 'W4', score: 84 },
      { day: 'W5', score: 86 },
      { day: 'W6', score: 88 },
    ],
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
    taskHistory: [
      { task: "'dentist andheri west' moved to #3", timestamp: 'Today, 09:42 AM' },
      { task: 'AI Overview appearance detected', timestamp: 'Yesterday, 02:45 PM' },
      { task: 'Weekly ranking summary report generated', timestamp: '2 days ago, 05:00 AM' },
    ],
    performance: [
      { day: 'W1', score: 83 },
      { day: 'W2', score: 86 },
      { day: 'W3', score: 90 },
      { day: 'W4', score: 95 },
      { day: 'W5', score: 98 },
      { day: 'W6', score: 100 },
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
    taskHistory: [
      { task: 'Review request sent to 14 patients', timestamp: 'Today, 07:58 AM' },
      { task: '4.2→4.6 star rating achieved', timestamp: 'Yesterday, 10:30 AM' },
      { task: 'Negative review flagged for response', timestamp: 'Yesterday, 05:55 PM' },
    ],
    performance: [
      { day: 'W1', score: 56 },
      { day: 'W2', score: 60 },
      { day: 'W3', score: 65 },
      { day: 'W4', score: 68 },
      { day: 'W5', score: 70 },
      { day: 'W6', score: 71 },
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
    taskHistory: [
      { task: 'SmileCare published 2 new pages', timestamp: 'Monday, 09:00 AM' },
      { task: 'Competitor keyword gap report generated', timestamp: 'Today, 07:22 AM' },
      { task: 'Monday morning briefing delivered', timestamp: '2 days ago, 09:00 AM' },
    ],
    performance: [
      { day: 'W1', score: 81 },
      { day: 'W2', score: 85 },
      { day: 'W3', score: 88 },
      { day: 'W4', score: 93 },
      { day: 'W5', score: 97 },
      { day: 'W6', score: 100 },
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
    taskHistory: [
      { task: 'Article pushed to 31 channels', timestamp: 'Today, 08:08 AM' },
      { task: 'Google indexed new blog in 4.2 hours', timestamp: 'Yesterday, 06:30 PM' },
      { task: '3 social signals amplified', timestamp: '2 days ago, 08:30 AM' },
    ],
    performance: [
      { day: 'W1', score: 82 },
      { day: 'W2', score: 86 },
      { day: 'W3', score: 90 },
      { day: 'W4', score: 94 },
      { day: 'W5', score: 98 },
      { day: 'W6', score: 100 },
    ],
    progress: 100,
  },
];

const agentChipColors: Record<string, string> = {
  ARIA: 'bg-[#7F77DD]/25 text-[#B3AEF3] border border-[#7F77DD]/40',
  SCRIBE: 'bg-[#3B82F6]/20 text-[#93C5FD] border border-[#3B82F6]/40',
  LOCL: 'bg-[#14B8A6]/20 text-[#5EEAD4] border border-[#14B8A6]/40',
  LINX: 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/40',
  CORE: 'bg-[#94A3B8]/20 text-[#CBD5E1] border border-[#94A3B8]/40',
  PULSE: 'bg-[#22C55E]/20 text-[#86EFAC] border border-[#22C55E]/40',
  REPUTE: 'bg-[#EAB308]/20 text-[#FDE047] border border-[#EAB308]/40',
  RIVAL: 'bg-[#EF4444]/20 text-[#FCA5A5] border border-[#EF4444]/40',
  AMPLI: 'bg-[#EC4899]/20 text-[#F9A8D4] border border-[#EC4899]/40',
};

const thinkingLogByAgent: Record<string, ThinkingEntry[]> = {
  ARIA: [
    {
      timestamp: 'Today, 09:30 AM',
      reasoning:
        "Competitor 'SmileCare Dental' ranks position #2 for 'dental implants mumbai' with only 18 backlinks — significantly below the domain authority needed to hold that position long-term. Their content is 640 words with no schema markup. This is an exploitable gap.",
      action:
        "Added 'dental implants mumbai' to priority keyword cluster. Briefed SCRIBE to create 1,800-word comprehensive guide with FAQ schema.",
      outcome:
        'Article published Mar 12. Currently ranking #7 and climbing — projected top 5 within 21 days.',
    },
    {
      timestamp: 'Yesterday, 02:15 PM',
      reasoning:
        "Search volume for 'emergency dentist andheri' spiked 340% in last 7 days — likely seasonal or event-driven. Zero local competitors have published content targeting this exact phrase. Window of opportunity is 2-3 weeks before larger sites react.",
      action:
        "Flagged as urgent. Triggered SCRIBE for same-day content creation. Added to LOCL's GBP post queue.",
      outcome: 'Article live within 18 hours. Entered rankings at position #6 — NEW entry this month.',
    },
    {
      timestamp: '2 days ago, 11:00 AM',
      reasoning:
        "Keyword cluster 'teeth whitening cost mumbai' shows high commercial intent (users searching this are ready to book). Current site has no page targeting this cluster. Competitor 'BrightSmile' ranks #4 with a 2019 article — outdated content is easy to outrank.",
      action:
        'Created comprehensive keyword brief with 12 semantic variations. Assigned to SCRIBE queue, priority level 2.',
      outcome: 'Article drafted. In review. Expected live within 48 hours.',
    },
  ],
  SCRIBE: [
    {
      timestamp: 'Today, 08:54 AM',
      reasoning:
        "ARIA's keyword map showed 'top dental services andheri' has 1,200 monthly searches with a featured snippet opportunity — the current snippet holder has a list of only 4 items with no images. Google typically replaces these with more comprehensive answers. Target: 8-item list with structured data.",
      action:
        "Published 'Top 5 Dental Services in Andheri 2026' — 1,450 words, FAQ schema, HowTo markup, 2 original images with alt tags optimized for local search.",
      outcome: 'Published Mar 3. Currently at position #6. Featured snippet impression rate 23% — growing.',
    },
    {
      timestamp: 'Mar 8, 10:20 AM',
      reasoning:
        'Root canal searches peak in Q1 (January-March) based on 3-year Google Trends data — likely tied to year-start insurance renewals. This is a high-conversion keyword (patients researching cost are actively deciding). Publishing now captures peak intent window.',
      action:
        "Created 1,820-word cost guide with procedure breakdown, Mumbai clinic comparison table, and insurance FAQ section. Optimized for 'how much does root canal cost mumbai' — position 0 target.",
      outcome: 'Ranking #9. Time-on-page 4m 22s — 3x site average. 6 contact form submissions attributed to this article.',
    },
    {
      timestamp: 'Mar 15, 09:00 AM',
      reasoning:
        "CORE flagged that the existing 'emergency dental' service page had a 6.2 second load time on mobile — this is actively hurting rankings. Rather than patch the old page, SCRIBE determined a new optimized page would rank faster than reformatting the legacy one.",
      action:
        'Created new emergency dental landing page — 1,200 words, compressed images, no render-blocking scripts. Submitted to AMPLI for immediate indexing push.',
      outcome: "New page indexed in 3.8 hours. Load time: 1.9 seconds. Ranking #6 for 'emergency dentist andheri'.",
    },
  ],
  LOCL: [
    {
      timestamp: 'Today, 01:00 AM',
      reasoning:
        'Google Business Profile posts published between 12am-3am on weekdays get 18% higher engagement rate based on Mumbai local search patterns — users check GBP the following morning during commute. Post timing is therefore optimized to maximize morning visibility.',
      action:
        "Scheduled and published 'Summer Dental Camp — Book Now' GBP post at 1:00 AM. Added offer code, booking link, and 3 keyword-rich hashtags.",
      outcome: 'Post live. 47 views in first 6 hours — 2.3x average post performance.',
    },
    {
      timestamp: 'Yesterday, 03:30 PM',
      reasoning:
        "NAP inconsistency detected: business listed as 'Sharma Dental' on 7 directories vs 'Sharma Dental Clinic' on GBP. Google treats these as different businesses — this is fragmenting authority and reducing Map Pack ranking signals. Every inconsistency costs approximately 0.3 positions in local pack.",
      action:
        "Corrected NAP across 12 directories in a single batch update. Standardized to 'Sharma Dental Clinic' everywhere. Updated phone format to +91 standard.",
      outcome: 'NAP consistency score: 94% (up from 61%). Map Pack position improving — currently monitoring.',
    },
  ],
  LINX: [
    {
      timestamp: 'Today, 08:19 AM',
      reasoning:
        "healthindia.in (DA 41) published a 'Top Dental Clinics in Mumbai' roundup article — they have a link insertion pattern where they update existing articles monthly. LINX identified this page 6 days before publication using their editorial calendar signals. Outreach window: 48 hours pre-publish.",
      action:
        "Sent personalized outreach to editor@healthindia.in with clinic data, patient testimonial quote, and a unique statistic about the clinic's GBP rating improvement. Followed up once.",
      outcome:
        "Link live. DA 41, dofollow, anchor text 'best dental clinic andheri'. Estimated DA impact: +0.8 over 60 days.",
    },
    {
      timestamp: 'Mar 16, 02:00 PM',
      reasoning:
        "indiahealthcare.org maintains a 'verified healthcare providers' resource page with DA 44 — they accept editorial submissions from verified clinics. This is a high-authority link with zero spam risk. Approval rate for verified clinics: 78% based on LINX's submission database.",
      action:
        'Submitted clinic profile with verification documents, clinic photos, and specialization tags. Paid zero cost — editorial submission.',
      outcome: 'Approved in 4 days. Link live. One of the highest-DA backlinks in the profile.',
    },
  ],
  CORE: [
    {
      timestamp: 'Today, 09:10 AM',
      reasoning:
        "Crawl detected 12 broken internal links — 7 pointing to a /services/teeth-whitening page that was renamed during the last site update. Google's crawler has visited these broken URLs 34 times in the past 30 days, wasting crawl budget each time. Each wasted crawl = a missed opportunity to re-index updated content.",
      action:
        'Created 301 redirects for all 7 renamed URLs. Fixed 5 additional outbound broken links. Updated internal link anchors across 11 pages.',
      outcome: 'Next crawl will route correctly. Crawl efficiency improved. No further 404 signals to Google.',
    },
    {
      timestamp: 'Mar 14, 11:30 AM',
      reasoning:
        "Homepage load time: 6.2 seconds on mobile 4G (Google's threshold for ranking penalty: 3 seconds). Root cause: 3 uncompressed hero images totaling 4.2MB and 2 render-blocking JavaScript files. This single issue is suppressing ALL page rankings — not just the homepage.",
      action:
        'Compressed 3 images (4.2MB → 0.8MB). Deferred 2 non-critical JS files. Enabled lazy loading on below-fold images.',
      outcome: 'Mobile load time: 1.9 seconds. PageSpeed score: 91/100. Estimated ranking improvement across all pages over next 28 days.',
    },
  ],
  PULSE: [
    {
      timestamp: 'Today, 09:42 AM',
      reasoning:
        "'dentist andheri west' moved from position #7 to #3 overnight — a 4-position jump. Root cause analysis: SmileCare Dental (previous #3) had a 503 server error for 6 hours yesterday, causing Google to temporarily demote their listing. PULSE detected this pattern and flagged it as potentially temporary — recommends publishing fresh content today to consolidate the position before SmileCare recovers.",
      action:
        'Alerted SCRIBE to create a supporting blog post. Flagged to LOCL to post a fresh GBP update today. Position consolidation protocol activated.',
      outcome: 'Position holding at #3 as of this check. SCRIBE article in production. GBP post scheduled.',
    },
    {
      timestamp: 'Yesterday, 02:45 PM',
      reasoning:
        "Detected: 'Sharma Dental Clinic' appearing in Google AI Overview for query 'best dentist andheri' — this is the first AI Overview appearance for this client. AI Overviews drive zero-click traffic but dramatically increase branded search volume and trust signals. Expected: 15-25% increase in branded searches over next 30 days.",
      action:
        'Flagged milestone to client dashboard. Recommended SCRIBE create 3 more authoritative FAQ-style articles to increase AI Overview frequency.',
      outcome: 'AI Overview appearance confirmed. Monitoring frequency daily.',
    },
  ],
  REPUTE: [
    {
      timestamp: 'Today, 07:58 AM',
      reasoning:
        "Post-visit window analysis: patients who visit on Monday-Wednesday are 67% more likely to leave a review when asked 4-6 days later (Friday-Sunday). REPUTE's review request timing is therefore optimized to send Friday-Saturday for Mon-Wed visitors. Current rating: 4.2 — target: 4.6 by end of quarter. Need 14 more 5-star reviews.",
      action:
        "Sent personalized WhatsApp review request to 14 patients who visited this week. Message personalized with dentist's name and treatment type. Includes direct GBP review link.",
      outcome: '3 reviews received within 4 hours. Rating moved 4.2 → 4.4. 11 requests still pending.',
    },
  ],
  RIVAL: [
    {
      timestamp: 'Monday, 09:00 AM',
      reasoning:
        "SmileCare Dental published 2 new pages this week: 'Invisalign Mumbai Pricing' and 'Dental Tourism Mumbai'. Both target high-value keywords ARIA has flagged as opportunities. Their Invisalign page is thin (420 words, no schema) — beatable with a comprehensive guide. Their dental tourism page targets medical tourists — a segment Sharma Dental Clinic has not pursued.",
      action:
        "Briefed ARIA on 'dental tourism andheri' keyword opportunity. Escalated 'invisalign andheri' to SCRIBE for priority article. Added SmileCare's new pages to weekly monitoring.",
      outcome: "ARIA confirmed 'dental tourism andheri' — 290 searches/month, low competition. Article queued for next week.",
    },
  ],
  AMPLI: [
    {
      timestamp: 'Today, 08:08 AM',
      reasoning:
        "New article published by SCRIBE at 8:54 AM. Google's crawl queue for this domain is typically 2-4 days. AMPLI's job: compress that to under 6 hours by pushing signals through 31 channels simultaneously — social signals, ping services, and indexing APIs. Each channel adds a fractional crawl priority signal. Combined, they force Google to prioritize this URL.",
      action:
        'Pushed article URL to 31 channels: 12 social signals, 8 ping services, 6 indexing APIs, 5 content syndication networks. Submitted URL via Google Search Console API directly.',
      outcome: 'Article indexed by Google in 4.2 hours — vs 2-4 day industry average. Now eligible to rank immediately.',
    },
  ],
};

export default function AgentsPage() {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'thinking' | 'history' | 'performance'>('thinking');
  const [taskIndexByAgent, setTaskIndexByAgent] = useState<Record<string, number>>(() =>
    agents.reduce<Record<string, number>>((acc, agent) => {
      acc[agent.name] = 0;
      return acc;
    }, {}),
  );
  const [typedReasoning, setTypedReasoning] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTaskIndexByAgent((prev) => {
        const next: Record<string, number> = { ...prev };
        agents.forEach((agent) => {
          next[agent.name] = ((prev[agent.name] ?? 0) + 1) % agent.tasks.length;
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const activeThinkingEntries = useMemo(() => {
    if (!activeAgent) {
      return [];
    }
    return thinkingLogByAgent[activeAgent.name] ?? [];
  }, [activeAgent]);

  useEffect(() => {
    if (!activeAgent || activeTab !== 'thinking' || activeThinkingEntries.length === 0) {
      setTypedReasoning('');
      return;
    }

    const fullText = activeThinkingEntries[0].reasoning;
    let idx = 0;
    setTypedReasoning('');

    const typer = setInterval(() => {
      idx += 1;
      setTypedReasoning(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(typer);
      }
    }, 18);

    return () => clearInterval(typer);
  }, [activeAgent, activeTab, activeThinkingEntries]);

  const closeModal = () => {
    setActiveAgent(null);
    setActiveTab('thinking');
  };

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
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6, boxShadow: '0 0 0 1px #7F77DD, 0 20px 40px rgba(127,119,221,0.2)' }}
                onHoverStart={() => setHoveredAgent(agent.name)}
                onHoverEnd={() => setHoveredAgent((prev) => (prev === agent.name ? null : prev))}
                className="relative overflow-hidden bg-[#12141A] border border-[#1E2130] rounded-xl p-5"
              >
                <motion.div
                  className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-[#7F77DD] to-[#1D9E75] origin-left"
                  animate={{ scaleX: hoveredAgent === agent.name ? 1 : 0 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{agent.name}</h2>
                    <p className="text-sm text-[#8892A4]">{agent.role}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#1D9E75] bg-[#1D9E75]/10 px-2 py-1 rounded-full">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#1D9E75] opacity-50 animate-ping" />
                      <span className="absolute inline-flex h-6 w-6 rounded-full bg-[#1D9E75] opacity-40 animate-ping" style={{ animationDuration: '2s' }} />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D9E75]" />
                    </span>
                    Active 24/7
                  </div>
                </div>

                <p className="text-sm text-[#8892A4] leading-relaxed mb-4 min-h-[56px]">{agent.description}</p>

                <div className="mb-4">
                  <div className="text-xs text-[#8892A4] mb-2">Last Action</div>
                  <div className="min-h-[44px] rounded-lg border border-[#1E2130] bg-[#0E1016] p-3">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`${agent.name}-${taskIndexByAgent[agent.name]}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-sm text-[#E4E7EF]"
                      >
                        {agent.tasks[taskIndexByAgent[agent.name] ?? 0]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8892A4]">Performance Metric</span>
                  <span className="text-[#1D9E75] font-medium">{agent.metric}</span>
                </div>
                <div className="w-full bg-[#1E2130] rounded-full h-2 mb-4 relative overflow-hidden">
                  <div className="bg-[#7F77DD] h-2 rounded-full relative" style={{ width: `${agent.progress}%` }} />
                  <div className={`progress-shimmer ${hoveredAgent === agent.name ? 'progress-shimmer-active' : ''}`} />
                </div>

                <button
                  onClick={() => setActiveAgent(agent)}
                  className="w-full border border-[#7F77DD]/40 text-[#7F77DD] rounded-lg py-2.5 text-sm hover:bg-[#7F77DD]/10 transition-colors"
                >
                  Agent Thinking
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {activeAgent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80"
              onClick={closeModal}
            />

            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-4xl bg-[#0D0F15] border-l border-[#1E2130] overflow-y-auto"
            >
              <div className="p-8 border-b border-[#1E2130]">
                <button
                  onClick={closeModal}
                  className="absolute right-6 top-6 text-[#8892A4] hover:text-white text-xl"
                >
                  ✕
                </button>

                <div className="flex items-start justify-between pr-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold leading-tight">{activeAgent.name} — {activeAgent.role}</h2>
                    <p className="text-sm text-[#8892A4] mt-2">Transparency Log — Last 30 Days</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#1D9E75] bg-[#1D9E75]/10 px-3 py-1.5 rounded-full h-fit">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#1D9E75] opacity-50 animate-ping" />
                      <span className="absolute inline-flex h-6 w-6 rounded-full bg-[#1D9E75] opacity-40 animate-ping" style={{ animationDuration: '2s' }} />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D9E75]" />
                    </span>
                    Active 24/7
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    { key: 'thinking', label: 'THINKING LOG' },
                    { key: 'history', label: 'TASK HISTORY' },
                    { key: 'performance', label: 'PERFORMANCE' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as 'thinking' | 'history' | 'performance')}
                      className={`px-4 py-2 rounded-lg text-xs tracking-[0.1em] font-semibold border transition-all ${
                        activeTab === tab.key
                          ? 'bg-[#7F77DD]/25 border-[#7F77DD]/45 text-[#C9C5F8]'
                          : 'bg-[#11131A] border-[#1E2130] text-[#8892A4] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <motion.div layout className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'thinking' && (
                    <motion.div key="thinking" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                      <div className="relative pl-8">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: '100%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="absolute left-2.5 top-0 w-px bg-[#7F77DD]/70"
                        />

                        {activeThinkingEntries.map((entry, idx) => (
                          <motion.div
                            key={`${entry.timestamp}-${idx}`}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.12 }}
                            className="relative mb-5 rounded-xl border border-[#1E2130] bg-[#12141A] border-l-[3px] border-l-[#7F77DD] p-4"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${agentChipColors[activeAgent.name]}`}>
                                {activeAgent.name}
                              </span>
                              <span className="text-[11px] italic text-[#8892A4]">{entry.timestamp}</span>
                            </div>

                            <div className="mb-3">
                              <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#7F77DD] mb-1.5 flex items-center gap-1.5">
                                <span>◈</span>
                                <span>REASONING:</span>
                              </div>
                              <p className="text-[13px] leading-[1.6] text-white">
                                {idx === 0 ? typedReasoning : entry.reasoning}
                              </p>
                            </div>

                            <div className="mb-3">
                              <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#1D9E75] mb-1.5">ACTION TAKEN:</div>
                              <p className="font-mono text-[13px] leading-[1.6] text-white">{entry.action}</p>
                            </div>

                            <div>
                              <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#22c55e] mb-1.5">OUTCOME:</div>
                              <p className="font-mono text-[13px] leading-[1.6] text-white">{entry.outcome}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div key="history" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                      <div className="space-y-3">
                        {activeAgent.taskHistory.map((item) => (
                          <div key={`${item.task}-${item.timestamp}`} className="rounded-xl border border-[#1E2130] bg-[#12141A] p-4 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <span className="text-[#1D9E75] mt-0.5">✓</span>
                              <div>
                                <p className="text-sm text-white">{item.task}</p>
                                <p className="text-xs text-[#8892A4] mt-1">Completed</p>
                              </div>
                            </div>
                            <span className="text-xs italic text-[#8892A4] whitespace-nowrap">{item.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'performance' && (
                    <motion.div key="performance" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                      <div className="rounded-xl border border-[#1E2130] bg-[#12141A] p-5">
                        <h3 className="text-lg font-semibold mb-1">Performance Trajectory</h3>
                        <p className="text-sm text-[#8892A4] mb-4">Last 6 weeks confidence score</p>
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={activeAgent.performance}>
                            <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
                            <XAxis dataKey="day" stroke="#8892A4" />
                            <YAxis stroke="#8892A4" domain={[40, 100]} />
                            <Tooltip contentStyle={{ background: '#12141A', border: '1px solid #1E2130' }} />
                            <Line type="monotone" dataKey="score" stroke="#7F77DD" strokeWidth={2.8} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes progressShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        .progress-shimmer {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40%;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          transform: translateX(-100%);
          opacity: 0;
        }

        .progress-shimmer-active {
          opacity: 1;
          animation: progressShimmer 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
