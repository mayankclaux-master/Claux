'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import DemoSidebar from '@/components/demo/DemoSidebar';

const filters = ['All', 'Top 10', 'Improved', 'New Entries'];

const rows = [
  ['dentist andheri west', '#3', '↑4', 2400, 'PULSE'],
  ['dental implants mumbai', '#7', '↑2', 1900, 'PULSE'],
  ['root canal andheri', '#5', '↑6', 880, 'PULSE'],
  ['teeth whitening mumbai', '#9', '↑3', 720, 'PULSE'],
  ['best dentist mumbai', '#12', '↑1', 5400, 'PULSE'],
  ['dental clinic near me', '#4', '↑8', 12000, 'PULSE'],
  ['dental checkup andheri', '#2', '↑5', 440, 'PULSE'],
  ['emergency dentist mumbai', '#6', 'NEW', 1100, 'PULSE'],
  ['cosmetic dentist andheri', '#8', '↑5', 590, 'PULSE'],
  ['dental crown mumbai', '#11', '↑3', 430, 'PULSE'],
  ['kids dentist andheri', '#6', '↑7', 320, 'PULSE'],
  ['orthodontist near me', '#14', '↑2', 2800, 'PULSE'],
  ['dental pain relief mumbai', '#5', '↑9', 210, 'PULSE'],
  ['full mouth rehabilitation', '#18', 'NEW', 390, 'PULSE'],
  ['wisdom tooth removal andheri', '#7', '↑4', 510, 'PULSE'],
  ['dental veneer mumbai', '#15', '↑1', 280, 'PULSE'],
  ['periodontist andheri west', '#9', '↑6', 190, 'PULSE'],
  ['dental bridge cost mumbai', '#13', '↑3', 340, 'PULSE'],
  ['smile makeover andheri', '#10', '↑8', 260, 'PULSE'],
  ['dental x-ray near me', '#4', '↑11', 1200, 'PULSE'],
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
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <DemoSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Keyword Rankings</h1>
          <p className="text-[#8892A4] mb-6">Live position tracking across Google Search, Maps & AI Overviews</p>

          <div className="flex gap-2 mb-6 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-lg border text-sm transition ${activeFilter === f ? 'bg-[#7F77DD]/20 border-[#7F77DD]/40 text-[#7F77DD]' : 'bg-[#12141A] border-[#1E2130] text-[#8892A4] hover:text-[#F0F2F8]'}`}
              >
                {f}
              </button>
            ))}
          </div>

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
                {rows.map((r) => (
                  <tr key={r[0]} className="border-t border-[#1E2130]">
                    <td className="p-4">{r[0]}</td>
                    <td className="p-4 font-semibold">{r[1]}</td>
                    <td className="p-4 text-[#1D9E75]">{r[2]}</td>
                    <td className="p-4 text-[#8892A4]">{Number(r[3]).toLocaleString()}</td>
                    <td className="p-4"><span className="text-xs px-2 py-1 rounded bg-[#7F77DD]/20 text-[#7F77DD]">{r[4]}</span></td>
                  </tr>
                ))}
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
