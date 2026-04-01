'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DemoSidebar from '@/components/demo/DemoSidebar';

const summary = [
  { label: 'Tasks Today', value: '47', tone: 'text-[#1D9E75]' },
  { label: 'Tasks This Week', value: '312', tone: 'text-[#7F77DD]' },
  { label: 'Tasks This Month', value: '1,247', tone: 'text-[#1D9E75]' },
  { label: 'Avg Task Time', value: '4.2 min', tone: 'text-[#8892A4]' },
];

const tasks = [
  ['PULSE', "'dentist andheri west' moved to #3", 'Tracking', '2.1 min', 'Today, 09:42 AM'],
  ['ARIA', 'andheri dentist implants mapped', 'Keyword Research', '4.8 min', 'Today, 09:30 AM'],
  ['CORE', '12 crawl errors fixed', 'Technical', '6.2 min', 'Today, 09:10 AM'],
  ['SCRIBE', 'Top 5 Dental Services Mumbai published', 'Content', '5.4 min', 'Today, 08:54 AM'],
  ['LOCL', 'Summer Dental Camp post published', 'GBP', '3.6 min', 'Today, 08:40 AM'],
  ['LINX', 'healthindia.in backlink acquired (DA41)', 'Backlinks', '4.1 min', 'Today, 08:19 AM'],
  ['REPUTE', 'Review request sent to 14 patients', 'Reputation', '2.8 min', 'Today, 07:58 AM'],
  ['RIVAL', 'Competitor keyword gap report generated', 'Competitor', '5.9 min', 'Today, 07:22 AM'],
  ['AMPLI', 'Article pushed to 31 channels', 'Distribution', '3.4 min', 'Today, 06:48 AM'],
  ['CORE', 'Page speed improved to 91', 'Technical', '4.7 min', 'Yesterday, 10:15 PM'],
  ['ARIA', '23 competitor gaps identified', 'Keyword Research', '5.1 min', 'Yesterday, 09:46 PM'],
  ['PULSE', '5 keywords entered top 10', 'Tracking', '3.2 min', 'Yesterday, 09:20 PM'],
  ['SCRIBE', 'Root Canal Cost outline created', 'Content', '4.3 min', 'Yesterday, 08:57 PM'],
  ['LOCL', '3 GBP attributes updated', 'GBP', '2.9 min', 'Yesterday, 08:29 PM'],
  ['LINX', 'dentistryindia.com outreach sent', 'Backlinks', '5.0 min', 'Yesterday, 07:44 PM'],
  ['REPUTE', '4.2→4.6 star rating achieved', 'Reputation', '3.8 min', 'Yesterday, 06:31 PM'],
  ['RIVAL', 'SmileCare published 2 new pages tracked', 'Competitor', '4.6 min', '2 days ago, 04:55 PM'],
  ['AMPLI', 'Google indexed new blog in 4.2 hours', 'Distribution', '3.3 min', '2 days ago, 04:08 PM'],
  ['CORE', 'Schema markup added to 4 pages', 'Technical', '6.4 min', '2 days ago, 02:47 PM'],
  ['ARIA', 'Intent cluster report generated', 'Keyword Research', '4.4 min', '2 days ago, 11:20 AM'],
  ['PULSE', 'AI Overview appearance detected', 'Tracking', '2.5 min', '3 days ago, 10:35 PM'],
  ['SCRIBE', 'Teeth Whitening article in review', 'Content', '3.9 min', '3 days ago, 09:12 PM'],
  ['LOCL', 'NAP synced across 12 directories', 'GBP', '4.0 min', '3 days ago, 07:50 PM'],
  ['LINX', '2 guest post slots confirmed', 'Backlinks', '5.7 min', '4 days ago, 06:28 PM'],
  ['REPUTE', 'Negative review flagged for response', 'Reputation', '2.4 min', '4 days ago, 03:15 PM'],
  ['RIVAL', 'Monday morning briefing delivered', 'Competitor', '3.1 min', '5 days ago, 09:04 AM'],
  ['AMPLI', '3 social signals amplified', 'Distribution', '2.7 min', '5 days ago, 08:43 AM'],
  ['CORE', 'Broken links audit re-run complete', 'Technical', '5.2 min', '6 days ago, 08:10 PM'],
  ['ARIA', 'Local intent map refreshed', 'Keyword Research', '3.5 min', '6 days ago, 06:39 PM'],
  ['PULSE', 'Weekly serp volatility scan complete', 'Tracking', '2.6 min', '7 days ago, 11:17 AM'],
];

export default function TasksPage() {
  const [exporting, setExporting] = useState(false);

  const exportCSV = () => {
    setExporting(true);

    const headers = ['Agent', 'Task Description', 'Category', 'Time Taken', 'Timestamp', 'Status'];

    const rows = [
      ['PULSE', "'dentist andheri west' moved to #3", 'Tracking', '2.1 min', 'Today 09:42 AM', 'Completed'],
      ['ARIA', 'andheri dentist implants mapped', 'Keyword Research', '4.8 min', 'Today 09:30 AM', 'Completed'],
      ['CORE', '12 crawl errors fixed', 'Technical', '6.2 min', 'Today 09:10 AM', 'Completed'],
      ['SCRIBE', 'Top 5 Dental Services Mumbai published', 'Content', '5.4 min', 'Today 08:54 AM', 'Completed'],
      ['LOCL', 'Summer Dental Camp post published', 'GBP', '3.6 min', 'Today 08:40 AM', 'Completed'],
      ['LINX', 'healthindia.in backlink acquired (DA41)', 'Backlinks', '4.1 min', 'Today 08:19 AM', 'Completed'],
      ['REPUTE', 'Review request sent to 14 patients', 'Reputation', '2.8 min', 'Today 07:58 AM', 'Completed'],
      ['RIVAL', 'Competitor keyword gap report generated', 'Competitor', '5.9 min', 'Today 07:22 AM', 'Completed'],
      ['AMPLI', 'Article pushed to 31 channels', 'Distribution', '3.4 min', 'Today 06:48 AM', 'Completed'],
      ['CORE', 'Page speed improved to 91', 'Technical', '4.7 min', 'Yesterday 10:15 PM', 'Completed'],
      ['ARIA', '23 competitor gaps identified', 'Keyword Research', '5.1 min', 'Yesterday 09:46 PM', 'Completed'],
      ['PULSE', '5 keywords entered top 10', 'Tracking', '3.2 min', 'Yesterday 09:20 PM', 'Completed'],
      ['SCRIBE', 'Root Canal Cost outline created', 'Content', '4.3 min', 'Yesterday 08:57 PM', 'Completed'],
      ['LOCL', '3 GBP attributes updated', 'GBP', '2.1 min', 'Yesterday 08:30 PM', 'Completed'],
      ['LINX', 'dentistryindia.com outreach sent', 'Backlinks', '3.8 min', 'Yesterday 07:45 PM', 'Completed'],
      ['RIVAL', 'SmileCare published 2 new pages — alert sent', 'Competitor', '1.2 min', 'Yesterday 07:00 PM', 'Completed'],
      ['AMPLI', 'Article indexed by Google in 4.2 hours', 'Distribution', '0.5 min', 'Yesterday 06:30 PM', 'Completed'],
      ['REPUTE', 'Google review flagged for response', 'Reputation', '1.8 min', 'Yesterday 05:55 PM', 'Completed'],
      ['ARIA', 'Intent cluster report generated', 'Keyword Research', '7.2 min', 'Yesterday 04:20 PM', 'Completed'],
      ['CORE', 'Schema markup added to 4 pages', 'Technical', '8.1 min', 'Yesterday 03:10 PM', 'Completed'],
      ['PULSE', 'AI Overview appearance detected — dentist andheri', 'Tracking', '1.5 min', 'Yesterday 02:45 PM', 'Completed'],
      ['SCRIBE', 'Teeth Whitening article submitted for review', 'Content', '5.8 min', 'Yesterday 01:30 PM', 'Completed'],
      ['LOCL', 'NAP synced across 12 directories', 'GBP', '4.4 min', 'Yesterday 12:15 PM', 'Completed'],
      ['LINX', '2 guest post slots confirmed', 'Backlinks', '6.3 min', 'Yesterday 11:00 AM', 'Completed'],
      ['REPUTE', 'Rating improved 4.2 to 4.6 — milestone alert', 'Reputation', '0.8 min', 'Yesterday 10:30 AM', 'Completed'],
      ['RIVAL', 'Monday morning briefing delivered', 'Competitor', '2.3 min', '2 days ago 09:00 AM', 'Completed'],
      ['AMPLI', '3 social signals amplified', 'Distribution', '1.9 min', '2 days ago 08:30 AM', 'Completed'],
      ['ARIA', 'High-intent keyword cluster: dental emergencies', 'Keyword Research', '6.7 min', '2 days ago 07:45 AM', 'Completed'],
      ['CORE', 'Mobile usability issues resolved — 3 pages', 'Technical', '5.5 min', '2 days ago 06:20 AM', 'Completed'],
      ['PULSE', 'Weekly ranking summary report generated', 'Tracking', '2.9 min', '2 days ago 05:00 AM', 'Completed'],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Claux_Task_History_April2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setExporting(false), 1500);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <DemoSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Task History</h1>
              <p className="text-[#8892A4]">Complete log of all agent actions</p>
            </div>
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-lg border border-[#1E2130] text-[#8892A4] hover:text-[#F0F2F8] hover:bg-white/5 text-sm"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {summary.map((s) => (
              <div key={s.label} className="bg-[#12141A] border border-[#1E2130] rounded-xl p-4">
                <div className="text-sm text-[#8892A4] mb-1">{s.label}</div>
                <div className={`text-2xl font-bold ${s.tone}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#12141A] border border-[#1E2130] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#0E1016] text-[#8892A4]">
                <tr>
                  <th className="p-4 text-left">Agent</th>
                  <th className="p-4 text-left">Task Description</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Time Taken</th>
                  <th className="p-4 text-left">Timestamp</th>
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, idx) => (
                  <tr key={`${t[0]}-${idx}`} className="border-t border-[#1E2130]">
                    <td className="p-4"><span className="px-2 py-1 rounded bg-[#7F77DD]/20 text-[#7F77DD] text-xs">{t[0]}</span></td>
                    <td className="p-4">{t[1]}</td>
                    <td className="p-4 text-[#8892A4]">{t[2]}</td>
                    <td className="p-4 text-[#8892A4]">{t[3]}</td>
                    <td className="p-4 text-[#8892A4]">{t[4]}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/30">Completed</span>
                    </td>
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
