'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import DemoSidebar from '@/components/demo/DemoSidebar';

const reports = [
  {
    month: 'March 2026',
    metrics: ['34 keywords improved', '8 new top-10 rankings', '12 backlinks', '9 articles'],
  },
  {
    month: 'February 2026',
    metrics: ['28 keywords improved', '5 new top-10 rankings', '9 backlinks', '8 articles'],
  },
  {
    month: 'January 2026',
    metrics: ['19 keywords improved', '3 new top-10 rankings', '7 backlinks', '7 articles'],
  },
];

const growthData = [
  { month: 'Jan', value: 19, projected: false },
  { month: 'Feb', value: 28, projected: false },
  { month: 'Mar', value: 34, projected: false },
  { month: 'Apr', value: 0, projected: true },
  { month: 'May', value: 0, projected: true },
  { month: 'Jun', value: 0, projected: true },
];

type ReportKey = 'March 2026' | 'February 2026' | 'January 2026';

const reportDetails: Record<ReportKey, {
  summary: string[];
  agents: Array<{ agent: string; tasks: number; achievement: string; status: string }>;
  keywords: Array<{ keyword: string; start: number; end: number; change: number; volume: number }>;
  content: Array<{ title: string; words: string; date: string; position: string }>;
  backlinks: Array<{ domain: string; da: number; type: string; date: string }>;
}> = {
  'March 2026': {
    summary: [
      'Domain Authority improved 34→41 — 20% increase in 90 days',
      'dentist andheri west reached position #3 — up from #14',
      'GBP rating improved 4.2→4.6 stars — 73% more clicks vs 3.9-star competitors',
    ],
    agents: [
      { agent: 'ARIA', tasks: 23, achievement: 'Mapped 67 high-intent keywords, found 23 competitor gaps', status: '✅ Active' },
      { agent: 'SCRIBE', tasks: 9, achievement: 'Published 9 articles, 3 in review, avg position 8.2', status: '✅ Active' },
      { agent: 'LOCL', tasks: 31, achievement: '4 weekly GBP posts, 50+ directories updated, 3 new photos', status: '✅ Active' },
      { agent: 'LINX', tasks: 12, achievement: '12 backlinks acquired from DA 30+ Indian sites', status: '✅ Active' },
      { agent: 'CORE', tasks: 18, achievement: 'Fixed 12 crawl errors, page speed 91, schema on 4 pages', status: '✅ Active' },
      { agent: 'PULSE', tasks: 720, achievement: 'Tracked 500+ keywords daily, detected 34 position improvements', status: '✅ Active' },
      { agent: 'REPUTE', tasks: 8, achievement: 'Triggered 14 review requests, rating improved 4.2→4.6', status: '✅ Active' },
      { agent: 'RIVAL', tasks: 4, achievement: 'Monday reports delivered, tracked 5 competitors continuously', status: '✅ Active' },
      { agent: 'AMPLI', tasks: 9, achievement: 'Pushed 9 articles to 31 channels, avg index time 4.2 hrs', status: '✅ Active' },
    ],
    keywords: [
      { keyword: 'dentist andheri west', start: 14, end: 3, change: 11, volume: 2400 },
      { keyword: 'dental implants mumbai', start: 9, end: 7, change: 2, volume: 1900 },
      { keyword: 'root canal andheri', start: 11, end: 5, change: 6, volume: 880 },
      { keyword: 'teeth whitening mumbai', start: 12, end: 9, change: 3, volume: 720 },
      { keyword: 'best dentist mumbai', start: 13, end: 12, change: 1, volume: 5400 },
      { keyword: 'dental clinic near me', start: 12, end: 4, change: 8, volume: 12000 },
      { keyword: 'dental checkup andheri', start: 7, end: 2, change: 5, volume: 440 },
      { keyword: 'emergency dentist mumbai', start: 10, end: 6, change: 4, volume: 1100 },
      { keyword: 'cosmetic dentist andheri', start: 13, end: 8, change: 5, volume: 590 },
      { keyword: 'dental crown mumbai', start: 14, end: 11, change: 3, volume: 430 },
    ],
    content: [
      { title: 'Top 5 Dental Services in Andheri 2026', words: '1,450 words', date: 'Mar 3', position: 'Position #6' },
      { title: 'Root Canal Cost Mumbai: Complete Guide', words: '1,820 words', date: 'Mar 8', position: 'Position #9' },
      { title: 'Dental Implants vs Bridges: Which is Better?', words: '1,650 words', date: 'Mar 12', position: 'Position #11' },
      { title: 'Emergency Dentist Andheri: What to Expect', words: '1,200 words', date: 'Mar 15', position: 'Position #6' },
      { title: 'Teeth Whitening Mumbai: Costs & Options', words: '1,380 words', date: 'Mar 19', position: 'Position #9' },
      { title: 'Best Orthodontist Near Me — How to Choose', words: '1,540 words', date: 'Mar 22', position: 'Position #14' },
      { title: 'Wisdom Tooth Removal: Mumbai Cost Guide', words: '1,290 words', date: 'Mar 26', position: 'Position #7' },
      { title: 'Dental Crown vs Cap: Full Comparison', words: '1,410 words', date: 'Mar 29', position: 'Position #11' },
      { title: "Kids Dentist Andheri: Parent's Guide", words: '1,180 words', date: 'Mar 31', position: 'Position #6' },
    ],
    backlinks: [
      { domain: 'healthindia.in', da: 41, type: 'Guest Post', date: 'Mar 4' },
      { domain: 'dentistryindia.com', da: 38, type: 'Directory', date: 'Mar 7' },
      { domain: 'mumbaihealth.net', da: 35, type: 'Resource Page', date: 'Mar 11' },
      { domain: 'indiahealthcare.org', da: 44, type: 'Editorial', date: 'Mar 16' },
      { domain: 'dentalcare.co.in', da: 32, type: 'Directory', date: 'Mar 21' },
      { domain: 'healthtips.india.com', da: 37, type: 'Guest Post', date: 'Mar 25' },
    ],
  },
  'February 2026': {
    summary: [
      '12 new keywords entered top 20 rankings this month',
      'SCRIBE published 8 SEO-optimized articles — avg 1,200 words each',
      'LINX acquired 9 quality backlinks — domain authority growing steadily',
    ],
    agents: [
      { agent: 'ARIA', tasks: 19, achievement: 'Mapped 54 high-intent keywords, found 19 competitor gaps', status: '✅ Active' },
      { agent: 'SCRIBE', tasks: 8, achievement: 'Published 8 articles, 2 in review, avg position 9.1', status: '✅ Active' },
      { agent: 'LOCL', tasks: 26, achievement: '4 weekly GBP posts, 42 directories updated, 2 new photos', status: '✅ Active' },
      { agent: 'LINX', tasks: 9, achievement: '9 backlinks acquired from DA 30+ Indian sites', status: '✅ Active' },
      { agent: 'CORE', tasks: 15, achievement: 'Fixed 10 crawl errors, page speed 88, schema on 3 pages', status: '✅ Active' },
      { agent: 'PULSE', tasks: 610, achievement: 'Tracked 500+ keywords daily, detected 28 position improvements', status: '✅ Active' },
      { agent: 'REPUTE', tasks: 7, achievement: 'Triggered 11 review requests, rating improved 4.1→4.3', status: '✅ Active' },
      { agent: 'RIVAL', tasks: 4, achievement: 'Monday reports delivered, tracked 5 competitors continuously', status: '✅ Active' },
      { agent: 'AMPLI', tasks: 8, achievement: 'Pushed 8 articles to 27 channels, avg index time 5.0 hrs', status: '✅ Active' },
    ],
    keywords: [
      { keyword: 'dentist andheri west', start: 17, end: 6, change: 11, volume: 2400 },
      { keyword: 'dental implants mumbai', start: 11, end: 9, change: 2, volume: 1900 },
      { keyword: 'root canal andheri', start: 14, end: 8, change: 6, volume: 880 },
      { keyword: 'teeth whitening mumbai', start: 15, end: 12, change: 3, volume: 720 },
      { keyword: 'best dentist mumbai', start: 16, end: 15, change: 1, volume: 5400 },
      { keyword: 'dental clinic near me', start: 14, end: 6, change: 8, volume: 12000 },
      { keyword: 'dental checkup andheri', start: 10, end: 5, change: 5, volume: 440 },
      { keyword: 'emergency dentist mumbai', start: 13, end: 9, change: 4, volume: 1100 },
      { keyword: 'cosmetic dentist andheri', start: 16, end: 11, change: 5, volume: 590 },
      { keyword: 'dental crown mumbai', start: 17, end: 14, change: 3, volume: 430 },
    ],
    content: [
      { title: 'Top 5 Dental Services in Andheri 2026', words: '1,330 words', date: 'Feb 4', position: 'Position #9' },
      { title: 'Root Canal Cost Mumbai: Complete Guide', words: '1,600 words', date: 'Feb 8', position: 'Position #12' },
      { title: 'Dental Implants vs Bridges: Which is Better?', words: '1,520 words', date: 'Feb 12', position: 'Position #14' },
      { title: 'Emergency Dentist Andheri: What to Expect', words: '1,120 words', date: 'Feb 15', position: 'Position #9' },
      { title: 'Teeth Whitening Mumbai: Costs & Options', words: '1,260 words', date: 'Feb 18', position: 'Position #13' },
      { title: 'Best Orthodontist Near Me — How to Choose', words: '1,430 words', date: 'Feb 21', position: 'Position #16' },
      { title: 'Wisdom Tooth Removal: Mumbai Cost Guide', words: '1,210 words', date: 'Feb 24', position: 'Position #10' },
      { title: 'Dental Crown vs Cap: Full Comparison', words: '1,320 words', date: 'Feb 27', position: 'Position #13' },
      { title: "Kids Dentist Andheri: Parent's Guide", words: '1,090 words', date: 'Feb 29', position: 'Position #9' },
    ],
    backlinks: [
      { domain: 'wellnessindia.in', da: 38, type: 'Guest Post', date: 'Feb 5' },
      { domain: 'dentalnetwork.in', da: 35, type: 'Directory', date: 'Feb 8' },
      { domain: 'cityhealthmumbai.com', da: 33, type: 'Resource Page', date: 'Feb 12' },
      { domain: 'carejournal.org', da: 41, type: 'Editorial', date: 'Feb 17' },
      { domain: 'oralhealth.co.in', da: 31, type: 'Directory', date: 'Feb 22' },
      { domain: 'medguide.india.com', da: 34, type: 'Guest Post', date: 'Feb 26' },
    ],
  },
  'January 2026': {
    summary: [
      'First month baseline established — 47 keywords tracked',
      'CORE fixed 34 technical SEO issues on site audit',
      'LOCL completed full GBP setup and optimization — 50+ directories synced',
    ],
    agents: [
      { agent: 'ARIA', tasks: 14, achievement: 'Mapped 38 high-intent keywords, found 14 competitor gaps', status: '✅ Active' },
      { agent: 'SCRIBE', tasks: 7, achievement: 'Published 7 articles, 2 in review, avg position 10.6', status: '✅ Active' },
      { agent: 'LOCL', tasks: 21, achievement: '4 weekly GBP posts, 50+ directories synced, initial setup complete', status: '✅ Active' },
      { agent: 'LINX', tasks: 7, achievement: '7 backlinks acquired from trusted Indian sites', status: '✅ Active' },
      { agent: 'CORE', tasks: 34, achievement: 'Fixed 34 technical issues from site audit, page speed 84', status: '✅ Active' },
      { agent: 'PULSE', tasks: 470, achievement: 'Tracked baseline keyword positions and daily shifts', status: '✅ Active' },
      { agent: 'REPUTE', tasks: 5, achievement: 'Triggered 8 review requests, improved rating to 4.2', status: '✅ Active' },
      { agent: 'RIVAL', tasks: 3, achievement: 'Monday reports delivered, tracked 5 competitors continuously', status: '✅ Active' },
      { agent: 'AMPLI', tasks: 7, achievement: 'Pushed 7 articles to 22 channels, avg index time 6.1 hrs', status: '✅ Active' },
    ],
    keywords: [
      { keyword: 'dentist andheri west', start: 20, end: 9, change: 11, volume: 2400 },
      { keyword: 'dental implants mumbai', start: 13, end: 11, change: 2, volume: 1900 },
      { keyword: 'root canal andheri', start: 17, end: 11, change: 6, volume: 880 },
      { keyword: 'teeth whitening mumbai', start: 18, end: 15, change: 3, volume: 720 },
      { keyword: 'best dentist mumbai', start: 19, end: 18, change: 1, volume: 5400 },
      { keyword: 'dental clinic near me', start: 17, end: 9, change: 8, volume: 12000 },
      { keyword: 'dental checkup andheri', start: 13, end: 8, change: 5, volume: 440 },
      { keyword: 'emergency dentist mumbai', start: 16, end: 12, change: 4, volume: 1100 },
      { keyword: 'cosmetic dentist andheri', start: 19, end: 14, change: 5, volume: 590 },
      { keyword: 'dental crown mumbai', start: 20, end: 17, change: 3, volume: 430 },
    ],
    content: [
      { title: 'Top 5 Dental Services in Andheri 2026', words: '1,220 words', date: 'Jan 3', position: 'Position #12' },
      { title: 'Root Canal Cost Mumbai: Complete Guide', words: '1,420 words', date: 'Jan 7', position: 'Position #15' },
      { title: 'Dental Implants vs Bridges: Which is Better?', words: '1,330 words', date: 'Jan 10', position: 'Position #17' },
      { title: 'Emergency Dentist Andheri: What to Expect', words: '1,020 words', date: 'Jan 14', position: 'Position #12' },
      { title: 'Teeth Whitening Mumbai: Costs & Options', words: '1,140 words', date: 'Jan 18', position: 'Position #16' },
      { title: 'Best Orthodontist Near Me — How to Choose', words: '1,260 words', date: 'Jan 21', position: 'Position #19' },
      { title: 'Wisdom Tooth Removal: Mumbai Cost Guide', words: '1,080 words', date: 'Jan 24', position: 'Position #13' },
      { title: 'Dental Crown vs Cap: Full Comparison', words: '1,170 words', date: 'Jan 27', position: 'Position #16' },
      { title: "Kids Dentist Andheri: Parent's Guide", words: '980 words', date: 'Jan 30', position: 'Position #12' },
    ],
    backlinks: [
      { domain: 'healthconnect.in', da: 34, type: 'Guest Post', date: 'Jan 6' },
      { domain: 'oraldirectory.in', da: 31, type: 'Directory', date: 'Jan 9' },
      { domain: 'mumbaicarehub.net', da: 30, type: 'Resource Page', date: 'Jan 13' },
      { domain: 'clinicinsights.org', da: 37, type: 'Editorial', date: 'Jan 18' },
      { domain: 'citydental.co.in', da: 29, type: 'Directory', date: 'Jan 23' },
      { domain: 'medtips.india.com', da: 32, type: 'Guest Post', date: 'Jan 27' },
    ],
  },
};

export default function ReportsPage() {
  const [activeMonth, setActiveMonth] = useState<ReportKey | null>(null);
  const [printing, setPrinting] = useState(false);

  const openReport = (month: string) => {
    setActiveMonth(month as ReportKey);
  };

  const closeReport = () => {
    setActiveMonth(null);
    setPrinting(false);
  };

  const handlePrint = (month: string) => {
    setActiveMonth(month as ReportKey);
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(false), 1700);
    }, 300);
  };

  const activeData = activeMonth ? reportDetails[activeMonth] : null;

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <DemoSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-[#8892A4] mb-8">Monthly performance summaries</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {reports.map((r) => (
              <div key={r.month} className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-1">{r.month}</h2>
                <p className="text-sm text-[#8892A4] mb-4">Generated by PULSE + ARIA</p>
                <ul className="space-y-2 mb-5 text-sm">
                  {r.metrics.map((m) => (
                    <li key={m} className="flex items-center gap-2">
                      <span className="text-[#1D9E75]">✓</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint(r.month)}
                    className="flex-1 border border-[#1D9E75]/50 text-[#1D9E75] rounded-lg py-2 text-sm"
                  >
                    {printing && activeMonth === r.month ? 'Opening print dialog...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={() => openReport(r.month)}
                    className="flex-1 bg-[#7F77DD] text-white rounded-lg py-2 text-sm"
                  >
                    View Full Report
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5 mb-8">
            <h2 className="text-lg font-semibold mb-3">6-Month Keyword Growth</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={growthData}>
                <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#8892A4" />
                <YAxis stroke="#8892A4" label={{ value: 'Keywords Improved', angle: -90, position: 'insideLeft', fill: '#8892A4' }} />
                <Tooltip contentStyle={{ background: '#12141A', border: '1px solid #1E2130' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {growthData.map((entry) => (
                    <Cell key={entry.month} fill={entry.projected ? '#7F77DD55' : '#7F77DD'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-[#8892A4] mt-2">Apr-Jun are projected</div>
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Executive Summary</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Domain Authority improved from 34 to 41 — a 20% increase in 90 days</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Dental clinic andheri west keyword reached position #3 — from position #14</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>GBP rating improved from 4.2 to 4.6 stars — 73% more clicks vs 3.9-star competitors</span></li>
            </ul>
          </div>

          {activeMonth && activeData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
              <div className="print-report w-full max-w-[800px] max-h-[90vh] overflow-y-auto bg-[#12141A] border border-white/30 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="text-sm text-white mb-2">🎯 CLAUX</div>
                    <h2 className="text-2xl font-bold">Monthly SEO Report — {activeMonth}</h2>
                    <p className="text-sm text-[#8892A4]">Generated by CLAUX AI Suite</p>
                  </div>
                  <button onClick={closeReport} className="no-print text-xl px-3 py-1 border border-[#2A2E3E] rounded-lg hover:bg-white/5">
                    ✕
                  </button>
                </div>

                <section className="mb-6 border-l-4 border-[#7F77DD] pl-4">
                  <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                  <div className="bg-[#0E1016] border border-[#1E2130] rounded-xl p-4">
                    <ul className="space-y-2 text-sm">
                      {activeData.summary.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-[#1D9E75]">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Agent Activity Summary</h3>
                  <div className="overflow-x-auto border border-[#1E2130] rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0E1016] text-[#8892A4]">
                        <tr>
                          <th className="p-3 text-left">Agent</th>
                          <th className="p-3 text-left">Tasks Completed</th>
                          <th className="p-3 text-left">Key Achievement</th>
                          <th className="p-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeData.agents.map((row) => (
                          <tr key={row.agent} className="border-t border-[#1E2130]">
                            <td className="p-3 font-semibold">{row.agent}</td>
                            <td className="p-3">{row.tasks}</td>
                            <td className="p-3 text-[#8892A4]">{row.achievement}</td>
                            <td className="p-3 text-[#1D9E75]">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Keyword Performance</h3>
                  <div className="overflow-x-auto border border-[#1E2130] rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0E1016] text-[#8892A4]">
                        <tr>
                          <th className="p-3 text-left">Keyword</th>
                          <th className="p-3 text-left">Start Position</th>
                          <th className="p-3 text-left">End Position</th>
                          <th className="p-3 text-left">Change</th>
                          <th className="p-3 text-left">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeData.keywords.map((row) => (
                          <tr key={row.keyword} className="border-t border-[#1E2130]">
                            <td className="p-3">{row.keyword}</td>
                            <td className="p-3">#{row.start}</td>
                            <td className="p-3">#{row.end}</td>
                            <td className="p-3 text-[#1D9E75]">↑{row.change}</td>
                            <td className="p-3">{row.volume.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Content Published This Month</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeData.content.map((item) => (
                      <div key={item.title} className="bg-[#0E1016] border border-[#1E2130] rounded-xl p-4">
                        <h4 className="font-semibold mb-2">{item.title}</h4>
                        <div className="text-sm text-[#8892A4]">{item.words}</div>
                        <div className="text-sm text-[#8892A4]">{item.date}</div>
                        <div className="text-sm text-[#1D9E75] mt-1">{item.position}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Backlinks Acquired</h3>
                  <div className="overflow-x-auto border border-[#1E2130] rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0E1016] text-[#8892A4]">
                        <tr>
                          <th className="p-3 text-left">Source Domain</th>
                          <th className="p-3 text-left">DA Score</th>
                          <th className="p-3 text-left">Link Type</th>
                          <th className="p-3 text-left">Date Acquired</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeData.backlinks.map((row) => (
                          <tr key={row.domain} className="border-t border-[#1E2130] text-[#1D9E75]">
                            <td className="p-3">{row.domain}</td>
                            <td className="p-3">{row.da}</td>
                            <td className="p-3">{row.type}</td>
                            <td className="p-3">
                              <span>{row.date}</span>
                              <span className="ml-2 inline-flex items-center rounded-full bg-[#1D9E75]/15 border border-[#1D9E75]/30 px-2 py-0.5 text-xs">✓ Live</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Next Month Recommendations (ARIA-generated)</h3>
                  <div className="space-y-3">
                    <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl p-4 text-sm">
                      Target 'cosmetic dentist andheri' — competitor gap detected, volume 590/mo, low competition
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl p-4 text-sm">
                      Publish location page for Bandra — ARIA detected 340 monthly searches for 'dentist bandra'
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl p-4 text-sm">
                      REPUTE alert: 2 unanswered Google reviews from March — respond within 48 hours for rating protection
                    </div>
                  </div>
                </section>

                <button onClick={closeReport} className="no-print w-full bg-[#7F77DD] text-white rounded-lg py-3 font-medium">
                  Close Report
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-report, .print-report * { visibility: visible; }
          .print-report { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; }
          .print-report .no-print { display: none !important; }
          .print-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
}
