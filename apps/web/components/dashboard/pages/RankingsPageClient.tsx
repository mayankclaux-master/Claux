'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import Sidebar from '@/components/dashboard/Sidebar';

type RankingsPageClientProps = {
  organizationName: string;
};

type KeywordRow = {
  keyword: string;
  position: number;
  change: number | 'NEW';
  volume: number;
  agent: string;
};

const allKeywords: KeywordRow[] = [
];

const chartData = [
  { week: 'W1', value: 0 },
  { week: 'W2', value: 0 },
  { week: 'W3', value: 0 },
  { week: 'W4', value: 0 }
];

export default function RankingsPageClient({ organizationName }: RankingsPageClientProps) {
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
      <Sidebar organizationName={organizationName} />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Keyword Rankings</h1>
          <p className="text-[#8892A4] mb-6">Awaiting Connection — keyword tracking starts after assets are connected.</p>

          <div className="flex gap-2 mb-3 flex-wrap">
            {[
              { key: 'all', label: 'All', count: allKeywords.length },
              {
                key: 'top10',
                label: 'Top 10',
                count: allKeywords.filter((k) => typeof k.position === 'number' && k.position <= 10).length
              },
              {
                key: 'improved',
                label: 'Improved',
                count: allKeywords.filter((k) => typeof k.change === 'number' && k.change > 0).length
              },
              { key: 'new', label: 'New Entries', count: allKeywords.filter((k) => k.change === 'NEW').length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2
      ${
        activeFilter === filter.key
          ? 'bg-[#7F77DD] text-white'
          : 'bg-[#12141A] text-[#8892A4] border border-[#1E2130] hover:text-white hover:border-[#7F77DD]/50'
      }`}
              >
                {filter.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full
      ${activeFilter === filter.key ? 'bg-white/20 text-white' : 'bg-[#1E2130] text-[#8892A4]'}`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          <p className="text-sm text-[#8892A4] mb-6">Showing {filteredKeywords.length} of {allKeywords.length} keywords</p>

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
                {filteredKeywords.length === 0 ? (
                  <tr className="border-t border-[#1E2130]">
                    <td colSpan={5} className="p-8 text-center text-[#8892A4]">
                      Awaiting Connection
                    </td>
                  </tr>
                ) : (
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
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded bg-[#7F77DD]/20 text-[#7F77DD]">{row.agent}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
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
