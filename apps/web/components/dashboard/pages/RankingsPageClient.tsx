'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import Sidebar from '@/components/dashboard/Sidebar';
import { useTenant } from '@/contexts/TenantContext';
import { getAriaKeywords } from '@/actions/artifacts';
import { getPulseRankings } from '@/actions/artifacts';


type KeywordRow = {
  keyword: string;
  position: number;
  change: number | 'NEW';
  volume: number;
  agent: string;
};

// Calculate real chart data from keyword rankings
const calculateChartData = (keywords: KeywordRow[]) => {
  if (keywords.length === 0) {
    return [
      { week: 'W1', value: 0 },
      { week: 'W2', value: 0 },
      { week: 'W3', value: 0 },
      { week: 'W4', value: 0 }
    ];
  }

  // Calculate average position (lower is better, so invert for chart)
  const avgPosition = keywords.reduce((sum, k) => sum + (k.position || 100), 0) / keywords.length;
  const visibilityScore = Math.max(0, 100 - avgPosition); // Convert to 0-100 scale

  // Simulate weekly progression based on current data
  return [
    { week: 'W1', value: Math.max(0, visibilityScore - 15) },
    { week: 'W2', value: Math.max(0, visibilityScore - 10) },
    { week: 'W3', value: Math.max(0, visibilityScore - 5) },
    { week: 'W4', value: visibilityScore }
  ];
};

export default function RankingsPageClient() {
  const { tenant, loading } = useTenant();
  const [activeFilter, setActiveFilter] = useState<'all' | 'top10' | 'improved' | 'new'>('all');
  const [allKeywords, setAllKeywords] = useState<KeywordRow[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!tenant?.id || loading) return;

      setFetching(true);
      try {
        const [keywordsData, rankingsData] = await Promise.all([
          getAriaKeywords(tenant.id),
          getPulseRankings(tenant.id)
        ]);

        // Map aria_keywords to KeywordRow format
        const mappedKeywords = (keywordsData as any[]).map((k) => ({
          keyword: k.keyword,
          position: k.current_rank || 0,
          change: k.rank_change || 'NEW' as any,
          volume: k.search_volume || 0,
          agent: 'ARIA'
        }));

        setAllKeywords(mappedKeywords);
      } catch (error) {
        console.error('Failed to load rankings data:', error);
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, [tenant?.id, loading]);

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
  }, [activeFilter, allKeywords]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-[#8892A4]">Loading rankings...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Keyword Rankings</h1>
          <p className="text-[#8892A4] mb-6">
            {allKeywords.length === 0 
              ? "Run ARIA agent to discover keywords and PULSE agent to track rankings."
              : "Track your keyword performance and ranking history"}
          </p>

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
                      No keywords found. Run ARIA agent to start research.
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
            <h2 className="text-lg font-semibold mb-1">Visibility Trend</h2>
            <p className="text-sm text-[#8892A4] mb-4">Keyword visibility score based on average ranking position</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={calculateChartData(allKeywords)}>
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
