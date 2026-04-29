'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import Sidebar from '@/components/dashboard/Sidebar';
import { useTenant } from '@/contexts/TenantContext';
import { getAriaKeywords, getScribeContent, getReputeReviews, getLinxBacklinks, getPrismAssets } from '@/actions/artifacts';


type ReportKey = string;

type ArtifactSummary = {
  ariaKeywords: number;
  scribeContent: number;
  reputeReviews: number;
  linxBacklinks: number;
  prismAssets: number;
  totalArtifacts: number;
};

const growthData = [
  { month: 'M1', value: 0, projected: true },
  { month: 'M2', value: 0, projected: true },
  { month: 'M3', value: 0, projected: true },
  { month: 'M4', value: 0, projected: true },
  { month: 'M5', value: 0, projected: true },
  { month: 'M6', value: 0, projected: true }
];

export default function ReportsPageClient() {
  const { tenant, loading } = useTenant();
  const [artifactSummary, setArtifactSummary] = useState<ArtifactSummary>({
    ariaKeywords: 0,
    scribeContent: 0,
    reputeReviews: 0,
    linxBacklinks: 0,
    prismAssets: 0,
    totalArtifacts: 0
  });
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    async function loadArtifactSummary() {
      if (!tenant?.id || loading) return;

      setFetching(true);
      try {
        const [keywords, content, reviews, backlinks, assets] = await Promise.all([
          getAriaKeywords(tenant.id),
          getScribeContent(tenant.id),
          getReputeReviews(tenant.id),
          getLinxBacklinks(tenant.id),
          getPrismAssets(tenant.id)
        ]);

        setArtifactSummary({
          ariaKeywords: keywords.length,
          scribeContent: content.length,
          reputeReviews: reviews.length,
          linxBacklinks: backlinks.length,
          prismAssets: assets.length,
          totalArtifacts: keywords.length + content.length + reviews.length + backlinks.length + assets.length
        });
      } catch (error) {
        console.error('Failed to load artifact summary:', error);
      } finally {
        setFetching(false);
      }
    }

    loadArtifactSummary();
  }, [tenant?.id, loading]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-[#8892A4]">Loading reports...</div>
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
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-[#8892A4] mb-8">
            {artifactSummary.totalArtifacts === 0
              ? "Run agents to generate artifacts and populate reports."
              : `Total artifacts produced: ${artifactSummary.totalArtifacts}`}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
              <h3 className="text-sm text-[#8892A4] mb-1">ARIA Keywords</h3>
              <p className="text-2xl font-semibold">{artifactSummary.ariaKeywords}</p>
            </div>
            <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
              <h3 className="text-sm text-[#8892A4] mb-1">SCRIBE Content</h3>
              <p className="text-2xl font-semibold">{artifactSummary.scribeContent}</p>
            </div>
            <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
              <h3 className="text-sm text-[#8892A4] mb-1">REPUTE Reviews</h3>
              <p className="text-2xl font-semibold">{artifactSummary.reputeReviews}</p>
            </div>
            <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
              <h3 className="text-sm text-[#8892A4] mb-1">LINX Backlinks</h3>
              <p className="text-2xl font-semibold">{artifactSummary.linxBacklinks}</p>
            </div>
            <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5">
              <h3 className="text-sm text-[#8892A4] mb-1">PRISM Assets</h3>
              <p className="text-2xl font-semibold">{artifactSummary.prismAssets}</p>
            </div>
            <div className="bg-[#12141A] border border-[#7F77DD]/30 rounded-xl p-5">
              <h3 className="text-sm text-[#8892A4] mb-1">Total Artifacts</h3>
              <p className="text-2xl font-semibold text-[#7F77DD]">{artifactSummary.totalArtifacts}</p>
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
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Total artifacts produced: {artifactSummary.totalArtifacts}</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Keywords discovered: {artifactSummary.ariaKeywords}</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Content generated: {artifactSummary.scribeContent}</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Reviews analyzed: {artifactSummary.reputeReviews}</span></li>
              <li className="flex items-start gap-2"><span className="text-[#1D9E75]">•</span><span>Backlinks found: {artifactSummary.linxBacklinks}</span></li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
