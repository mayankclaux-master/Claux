'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import DemoSidebar from '@/components/demo/DemoSidebar';

const allKeywords = [
  { keyword: 'dentist andheri west', position: 3, change: 4, volume: 2400, agent: 'PULSE' },
  { keyword: 'dental implants mumbai', position: 7, change: 2, volume: 1900, agent: 'PULSE' },
  { keyword: 'root canal andheri', position: 5, change: 6, volume: 880, agent: 'PULSE' },
  { keyword: 'teeth whitening mumbai', position: 9, change: 3, volume: 720, agent: 'PULSE' },
  { keyword: 'best dentist mumbai', position: 12, change: 1, volume: 5400, agent: 'PULSE' },
  { keyword: 'dental clinic near me', position: 4, change: 8, volume: 12000, agent: 'PULSE' },
  { keyword: 'dental checkup andheri', position: 2, change: 5, volume: 440, agent: 'PULSE' },
  { keyword: 'emergency dentist mumbai', position: 6, change: 'NEW' as const, volume: 1100, agent: 'PULSE' },
  { keyword: 'cosmetic dentist andheri', position: 8, change: 5, volume: 590, agent: 'PULSE' },
  { keyword: 'dental crown mumbai', position: 11, change: 3, volume: 430, agent: 'PULSE' },
  { keyword: 'kids dentist andheri', position: 6, change: 7, volume: 320, agent: 'PULSE' },
  { keyword: 'orthodontist near me', position: 14, change: 2, volume: 2800, agent: 'PULSE' },
  { keyword: 'dental pain relief mumbai', position: 5, change: 9, volume: 210, agent: 'PULSE' },
  { keyword: 'full mouth rehabilitation', position: 18, change: 'NEW' as const, volume: 390, agent: 'PULSE' },
  { keyword: 'wisdom tooth removal andheri', position: 7, change: 4, volume: 510, agent: 'PULSE' },
  { keyword: 'dental veneer mumbai', position: 15, change: 1, volume: 280, agent: 'PULSE' },
  { keyword: 'periodontist andheri west', position: 9, change: 6, volume: 190, agent: 'PULSE' },
  { keyword: 'dental bridge cost mumbai', position: 13, change: 3, volume: 340, agent: 'PULSE' },
  { keyword: 'smile makeover andheri', position: 10, change: 8, volume: 260, agent: 'PULSE' },
  { keyword: 'dental x-ray near me', position: 4, change: 11, volume: 1200, agent: 'PULSE' },
];

const chartData = [
  { week: 'W1', value: 12 },
  { week: 'W2', value: 10 },
  { week: 'W3', value: 9 },
  { week: 'W4', value: 8 },
  { week: 'W5', value: 7 },
  { week: 'W6', value: 6 },
  { week: 'W7', value: 5 },
  { week: 'W8', value: 4 },
];

export default function RankingsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'top10' | 'improved' | 'new'>('all');

  const filteredKeywords = useMemo(() => {
    switch (activeFilter) {
      case 'top10':
        return allKeywords.filter((k) => typeof k.position === 'number' && k.position <= 10);
      case 'improved':
        return allKeywords.filter((k) => typeof k.change === 'number' && k.change > 0);
      case 'new':
        return allKeywords.filter((k) => k.change === 'NEW');
      default:
        return allKeywords;
    }
  }, [activeFilter]);

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <DemoSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Keyword Rankings</h1>
          <p className="text-[#8892A4] mb-6">Live position tracking across Google Search, Maps & AI Overviews</p>

          <div className="flex gap-2 mb-3 flex-wrap">
            {[
              { key: 'all', label: 'All', count: allKeywords.length },
              { key: 'top10', label: 'Top 10', count: allKeywords.filter((k) => typeof k.position === 'number' && k.position <= 10).length },
              { key: 'improved', label: 'Improved', count: allKeywords.filter((k) => typeof k.change === 'number' && k.change > 0).length },
              { key: 'new', label: 'New Entries', count: allKeywords.filter((k) => k.change === 'NEW').length },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2
      ${activeFilter === filter.key
        ? 'bg-[#7F77DD] text-white'
        : 'bg-[#12141A] text-[#8892A4] border border-[#1E2130] hover:text-white hover:border-[#7F77DD]/50'
      }`}
              >
                {filter.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full
      ${activeFilter === filter.key ? 'bg-white/20 text-white' : 'bg-[#1E2130] text-[#8892A4]'}`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          <p className="text-sm text-[#8892A4] mb-6">
            Showing {filteredKeywords.length} of {allKeywords.length} keywords
          </p>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead className="bg-[#0E1016] text-[#8892A4]">
                <tr>
                  <th className="p-4 text-left">Keyword</th>
                  <th className="p-4 text-left">Position</th>
                  <th className="p-4 text-left">Change</th>
                  <th className="p-4 text-left">Volume</th>
                  <th className="p-4 text-left">Agent</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="wait">
                  {filteredKeywords.map((row) => (
                    <motion.tr
                      key={row.keyword}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#1E2130]"
                    >
                      <td className="p-4">{row.keyword}</td>
                      <td className="p-4 font-semibold">#{row.position}</td>
                      <td className="p-4 text-[#1D9E75]">{typeof row.change === 'number' ? `↑${row.change}` : 'NEW'}</td>
                      <td className="p-4 text-[#8892A4]">{row.volume.toLocaleString()}</td>
                      <td className="p-4"><span className="text-xs px-2 py-1 rounded bg-[#7F77DD]/20 text-[#7F77DD]">{row.agent}</span></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-1">Average Position Improvement</h2>
            <p className="text-sm text-[#8892A4] mb-4">Average ranking position (lower = better)</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#8892A4" />
                <YAxis stroke="#8892A4" />
                <Tooltip contentStyle={{ background: '#12141A', border: '1px solid #1E2130' }} />
                <Area type="monotone" dataKey="value" stroke="#7F77DD" fill="#7F77DD33" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
