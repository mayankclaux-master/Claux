'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';

type TasksPageClientProps = {
  organizationName: string;
};

type TaskRow = [string, string, string, string, string];

const summary = [
  { label: 'Tasks Today', value: '0', tone: 'text-[#1D9E75]' },
  { label: 'Tasks This Week', value: '0', tone: 'text-[#7F77DD]' },
  { label: 'Tasks This Month', value: '0', tone: 'text-[#1D9E75]' },
  { label: 'Avg Task Time', value: '0 min', tone: 'text-[#8892A4]' }
];

const tasks: TaskRow[] = [
];

export default function TasksPageClient({ organizationName }: TasksPageClientProps) {
  const [exporting, setExporting] = useState(false);

  const exportCSV = () => {
    setExporting(true);

    const headers = ['Agent', 'Task Description', 'Category', 'Time Taken', 'Timestamp', 'Status'];

    const rows: string[][] = [];

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'claux_task_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setExporting(false), 1500);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <Sidebar organizationName={organizationName} />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Task History</h1>
              <p className="text-[#8892A4]">System Initializing — task history will appear after first execution.</p>
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
                {tasks.length === 0 ? (
                  <tr className="border-t border-[#1E2130]">
                    <td className="p-8 text-center text-[#8892A4]" colSpan={6}>
                      System Initializing
                    </td>
                  </tr>
                ) : (
                  tasks.map((t, idx) => (
                    <tr key={`${t[0]}-${idx}`} className="border-t border-[#1E2130]">
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-[#7F77DD]/20 text-[#7F77DD] text-xs">{t[0]}</span>
                      </td>
                      <td className="p-4">{t[1]}</td>
                      <td className="p-4 text-[#8892A4]">{t[2]}</td>
                      <td className="p-4 text-[#8892A4]">{t[3]}</td>
                      <td className="p-4 text-[#8892A4]">{t[4]}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/30">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
