'use client';

import { motion } from 'framer-motion';
import DemoSidebar from '@/components/demo/DemoSidebar';

const usage = [
  { label: 'Keywords Tracked', value: 63, total: 70 },
  { label: 'Blog Posts', value: 9, total: 40 },
  { label: 'Business Locations', value: 1, total: 3 },
  { label: 'Competitor Rivals', value: 4, total: 6 },
];

const plans = [
  { name: 'Starter', price: '₹7,499', action: 'Downgrade', actionStyle: 'border border-[#1E2130] text-[#8892A4]' },
  { name: 'Growth', price: '₹14,999', action: 'Current Plan', actionStyle: 'bg-[#2A2D38] text-[#8892A4] cursor-not-allowed' },
  { name: 'Dominator', price: '₹24,999', action: 'Upgrade', actionStyle: 'bg-[#7F77DD] text-white' },
];

const invoices = [
  ['April 1, 2026', 'Growth Plan', '₹14,999', 'Paid'],
  ['March 1, 2026', 'Growth Plan', '₹14,999', 'Paid'],
  ['February 1, 2026', 'Starter Plan', '₹7,499', 'Paid'],
];

export default function BillingPage() {
  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <DemoSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Billing</h1>
          <p className="text-[#8892A4] mb-8">Manage your Claux subscription</p>

          <div className="bg-[#12141A] border border-[#7F77DD]/40 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">Growth</h2>
                <p className="text-[#8892A4]">₹14,999/month</p>
                <p className="text-sm text-[#1D9E75] mt-1">All 9 AI Agents Active</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/30">Active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-5">
              <div><span className="text-[#8892A4]">Next billing:</span> May 1, 2026</div>
              <div><span className="text-[#8892A4]">Payment method:</span> Visa ●●●● 4242</div>
              <div><span className="text-[#8892A4]">Plan:</span> Growth</div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg border border-[#7F77DD]/50 text-[#7F77DD]">Change Plan</button>
              <button className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm">Cancel Subscription</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {usage.map((u) => {
              const pct = Math.round((u.value / u.total) * 100);
              return (
                <div key={u.label} className="bg-[#12141A] border border-[#1E2130] rounded-xl p-4">
                  <div className="text-sm text-[#8892A4] mb-1">{u.label}</div>
                  <div className="font-semibold mb-2">{u.value} / {u.total} used</div>
                  <div className="h-2 bg-[#1E2130] rounded-full">
                    <div className="h-2 rounded-full bg-[#1D9E75]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold mb-4">Upgrade / Downgrade</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div key={p.name} className="border border-[#1E2130] rounded-lg p-4">
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-[#8892A4] mb-4">{p.price}/month</div>
                  <button className={`w-full py-2 rounded-lg text-sm ${p.actionStyle}`}>{p.action}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#0E1016] text-[#8892A4]">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Plan</th>
                  <th className="p-4 text-left">Amount</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i[0]} className="border-t border-[#1E2130]">
                    <td className="p-4">{i[0]}</td>
                    <td className="p-4">{i[1]}</td>
                    <td className="p-4">{i[2]}</td>
                    <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-[#1D9E75]/15 text-[#1D9E75]">{i[3]}</span></td>
                    <td className="p-4"><button className="text-[#7F77DD] hover:underline">Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
