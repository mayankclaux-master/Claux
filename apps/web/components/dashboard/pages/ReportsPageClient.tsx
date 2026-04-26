'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import Sidebar from '@/components/dashboard/Sidebar';

type ReportsPageClientProps = {
  organizationName: string;
};

type ReportKey = string;

const reports: Array<{ month: ReportKey; metrics: string[] }> = [
];

const growthData = [
  { month: 'M1', value: 0, projected: true },
  { month: 'M2', value: 0, projected: true },
  { month: 'M3', value: 0, projected: true },
  { month: 'M4', value: 0, projected: true },
  { month: 'M5', value: 0, projected: true },
  { month: 'M6', value: 0, projected: true }
];

const reportSummary: Record<ReportKey, string[]> = {
  Initializing: ['First report generating in 30 days']
};

export default function ReportsPageClient({ organizationName }: ReportsPageClientProps) {
  const [activeMonth, setActiveMonth] = useState<ReportKey | null>(null);

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <Sidebar organizationName={organizationName} />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-[#8892A4] mb-8">First report generating in 30 days</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5 md:col-span-3">
              <h2 className="text-xl font-semibold mb-1">System Initializing</h2>
              <p className="text-sm text-[#8892A4] mb-2">Connect assets and allow data collection to generate reports.</p>
              <p className="text-sm text-[#8892A4]">First report generating in 30 days</p>
            </div>
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5 mb-8">
            <h2 className="text-lg font-semibold mb-3">6-Month Keyword Growth</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={growthData}>
                <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#8892A4" />
                <YAxis stroke="#8892A4" />
                <Tooltip contentStyle={{ background: '#12141A', border: '1px solid #1E2130' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {growthData.map((entry) => (
                    <Cell key={entry.month} fill={entry.projected ? '#7F77DD55' : '#7F77DD'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-[#8892A4] mt-2">Awaiting historical data</div>
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Executive Summary</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>System Initializing</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Connect assets to begin report generation</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>First report generating in 30 days</span></li>
            </ul>
          </div>

          {activeMonth ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
              <div className="w-full max-w-2xl bg-[#12141A] border border-[#2A2E3E] rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold">{activeMonth} Report</h3>
                    <p className="text-sm text-[#8892A4]">Detailed highlights and recommendations</p>
                  </div>
                  <button onClick={() => setActiveMonth(null)} className="text-xl px-3 py-1 border border-[#2A2E3E] rounded-lg hover:bg-white/5">✕</button>
                </div>
                <ul className="space-y-2 text-sm">
                  {reportSummary[activeMonth].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[#1D9E75] mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}
