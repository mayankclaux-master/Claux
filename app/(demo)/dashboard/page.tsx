'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import DemoSidebar from '@/components/demo/DemoSidebar';

const sparklineData = [
  { value: 120 },
  { value: 180 },
  { value: 150 },
  { value: 220 },
  { value: 280 },
  { value: 340 },
  { value: 380 },
];

const agents = [
  {
    name: 'ARIA',
    role: 'Keyword Intelligence',
    action: 'Mapped 67 high-intent keywords',
    progress: 94,
    time: '2 min ago',
  },
  {
    name: 'SCRIBE',
    role: 'Content Agent',
    action: 'Published: Top 5 Dental Services Mumbai',
    progress: 78,
    time: '8 min ago',
  },
  {
    name: 'LOCL',
    role: 'GBP Agent',
    action: 'Updated 3 GBP attributes + weekly post',
    progress: 100,
    time: '1 min ago',
  },
  {
    name: 'LINX',
    role: 'Backlink Agent',
    action: 'Acquired 3 backlinks from Indian health directories',
    progress: 61,
    time: '34 min ago',
  },
  {
    name: 'CORE',
    role: 'Technical SEO',
    action: 'Fixed 12 crawl errors, page speed 91',
    progress: 88,
    time: '19 min ago',
  },
  {
    name: 'PULSE',
    role: 'Rank Tracker',
    action: 'Detected +4 jump: dentist andheri west',
    progress: 100,
    time: 'Just now',
  },
  {
    name: 'RIVAL',
    role: 'Competitor Intel',
    action: 'SmileCare published 2 new pages this week',
    progress: 100,
    time: 'Monday 9am',
  },
  {
    name: 'REPUTE',
    role: 'Reputation Mgmt',
    action: 'Review request sent to 14 patients',
    progress: 71,
    time: '3 hrs ago',
  },
  {
    name: 'AMPLI',
    role: 'Distribution',
    action: 'Article pushed to 31 syndication channels',
    progress: 100,
    time: '8 min ago',
  },
];

const tasksList = [
  { agent: 'ARIA', task: '"andheri dentist implants" added to keyword map' },
  { agent: 'SCRIBE', task: 'Article outline: "Root Canal Cost Mumbai 2025"' },
  { agent: 'LOCL', task: 'GBP post: "Summer Dental Camp"' },
  { agent: 'PULSE', task: '"dental clinic andheri" → Position 4 ↑2' },
  { agent: 'CORE', task: 'Broken link fixed /services/teeth-whitening' },
  { agent: 'LINX', task: 'New backlink: healthindia.in DA41' },
  { agent: 'REPUTE', task: 'Review request sent +91 98XXXXXX' },
  { agent: 'RIVAL', task: 'SmileCare published "Invisalign Mumbai Pricing"' },
  { agent: 'AMPLI', task: 'Article indexed in 4.2 hours' },
];

const rankings = [
  { keyword: 'dentist andheri west', position: 3, change: 4, volume: 2400, agent: 'PULSE' },
  { keyword: 'dental implants mumbai', position: 7, change: 2, volume: 1900, agent: 'ARIA' },
  { keyword: 'root canal andheri', position: 5, change: 6, volume: 880, agent: 'SCRIBE' },
  { keyword: 'teeth whitening mumbai', position: 9, change: 3, volume: 720, agent: 'LOCL' },
  { keyword: 'best dentist mumbai', position: 12, change: 1, volume: 5400, agent: 'PULSE' },
  { keyword: 'dental clinic near me', position: 4, change: 8, volume: 12000, agent: 'ARIA' },
  { keyword: 'dental checkup andheri', position: 2, change: 5, volume: 440, agent: 'SCRIBE' },
  { keyword: 'emergency dentist mumbai', position: 6, change: 'NEW', volume: 1100, agent: 'PULSE' },
];

const contentPipeline = [
  { title: 'Top 10 Dentists in Andheri 2025', status: 'PUBLISHED', color: 'bg-claux-teal' },
  { title: 'Root Canal Cost Mumbai', status: 'IN REVIEW', color: 'bg-amber-500' },
  { title: 'Teeth Whitening vs Bleaching', status: 'WRITING', color: 'bg-blue-500' },
  { title: 'Dental Implants: Complete Guide', status: 'SCHEDULED', color: 'bg-claux-muted' },
];

const notifications = [
  { agent: 'PULSE', message: "'dentist andheri' → Position 3 ↑" },
  { agent: 'ARIA', message: "'dental implants mumbai' → Position 7 ↑2" },
  { agent: 'SCRIBE', message: 'New article published: Top Dental Services' },
  { agent: 'LOCL', message: 'GBP post engagement +47%' },
  { agent: 'LINX', message: 'New backlink acquired: DA 41' },
  { agent: 'CORE', message: 'Page speed improved to 91' },
];

const agentDetailsData: Record<string, any> = {
  ARIA: {
    metrics: [
      { label: 'Keywords Mapped', value: '67', trend: '+12 this week' },
      { label: 'Competitor Gaps', value: '23', trend: '+5 identified' },
      { label: 'Intent Accuracy', value: '94%', trend: '+3% improvement' },
    ],
    activationDate: 'January 15, 2025',
    tasks: [
      { task: '"andheri dentist implants" added to keyword map', time: '2 min ago' },
      { task: 'Competitor gap analysis: SmileCare vs Sharma Dental', time: '18 min ago' },
      { task: 'High-intent keyword cluster identified: emergency dental', time: '1 hr ago' },
      { task: 'Search volume trend analysis completed', time: '2 hrs ago' },
      { task: 'Long-tail keyword opportunities mapped', time: '3 hrs ago' },
      { task: 'Local search intent patterns analyzed', time: '5 hrs ago' },
      { task: 'Seasonal keyword trends updated', time: '8 hrs ago' },
      { task: 'Voice search optimization keywords added', time: '12 hrs ago' },
    ],
    performanceData: [
      { week: 'Week 1', value: 12 },
      { week: 'Week 2', value: 18 },
      { week: 'Week 3', value: 24 },
      { week: 'Week 4', value: 31 },
      { week: 'Week 5', value: 38 },
      { week: 'Week 6', value: 47 },
      { week: 'Week 7', value: 58 },
      { week: 'Week 8', value: 67 },
    ],
  },
};

export default function DashboardPage() {
  const [domainAuthority, setDomainAuthority] = useState(34);
  const [keywordsRanking, setKeywordsRanking] = useState(47);
  const [roiValue, setRoiValue] = useState(0);
  const [visibleTasks, setVisibleTasks] = useState<typeof tasksList>([]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'performance'>('overview');
  const [notification, setNotification] = useState<{ agent: string; message: string } | null>(null);
  const [notificationIndex, setNotificationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roiResetKey, setRoiResetKey] = useState(0);

  useEffect(() => {
    const daTimer = setTimeout(() => setDomainAuthority(41), 500);
    return () => clearTimeout(daTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setKeywordsRanking((prev) => {
        if (prev >= 89) return 47;
        return prev + 1;
      });
    }, 30000 / 42);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const duration = 8000;
    const steps = 60;
    const increment = 124000 / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= 124000) {
        setRoiValue(124000);
        clearInterval(interval);
      } else {
        setRoiValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [roiResetKey]);

  useEffect(() => {
    const roiRestartInterval = setInterval(() => {
      setRoiValue(0);
      setRoiResetKey((prev) => prev + 1);
    }, 45000);

    return () => clearInterval(roiRestartInterval);
  }, []);

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    const notificationInterval = setInterval(() => {
      const notif = notifications[notificationIndex % notifications.length];
      setNotification(notif);
      setNotificationIndex((prev) => prev + 1);

      setTimeout(() => {
        setNotification(null);
      }, 4000);
    }, 12000);

    return () => clearInterval(notificationInterval);
  }, [notificationIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleTasks((prev) => {
        const newTask = tasksList[taskIndex % tasksList.length];
        const updated = [newTask, ...prev].slice(0, 6);
        return updated;
      });
      setTaskIndex((prev) => prev + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, [taskIndex]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-claux-bg text-claux-text overflow-hidden">
        <DemoSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-claux-surface border border-claux-border rounded-xl animate-pulse"></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-40 bg-claux-surface border border-claux-border rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-mobile-outer">
      <div className="dashboard-mobile-inner flex h-screen bg-claux-bg text-claux-text overflow-hidden relative">
      <div className="absolute top-8 right-8 text-claux-text text-4xl font-bold opacity-[0.15] pointer-events-none z-50">
        DEMO
      </div>
      <DemoSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-8 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <motion.div
              className="bg-claux-surface border border-claux-border rounded-xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-xs text-claux-muted mb-2">Domain Authority</div>
              <div className="flex items-end gap-2">
                <motion.div
                  className="text-3xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {domainAuthority}
                </motion.div>
                <motion.div
                  className="text-claux-teal text-sm mb-1 flex items-center gap-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span>↑</span>
                  <span>+7</span>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="bg-claux-surface border border-claux-border rounded-xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-xs text-claux-muted mb-2">Keywords Ranking</div>
              <motion.div className="text-3xl font-bold" key={keywordsRanking}>
                {keywordsRanking}
              </motion.div>
            </motion.div>

            <motion.div
              className="bg-claux-surface border border-claux-border rounded-xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-xs text-claux-muted mb-2">Organic Traffic</div>
              <div className="text-lg font-bold text-claux-teal mb-2">+2,340 this month</div>
              <ResponsiveContainer width="100%" height={30}>
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#1D9E75"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              className="bg-claux-surface border border-claux-border rounded-xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-xs text-claux-muted mb-2">GBP Rating</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <div className="text-xl font-bold">4.2 → 4.6</div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">AI Agents</h2>
                <div className="grid grid-cols-3 gap-4">
                  {agents.map((agent, idx) => (
                    <motion.div
                      key={agent.name}
                      className="bg-claux-surface border border-claux-border rounded-xl p-4 cursor-pointer transition-all"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ 
                        y: -4, 
                        borderColor: '#7F77DD',
                        boxShadow: '0 0 20px rgba(127, 119, 221, 0.4)'
                      }}
                      onClick={() => {
                        setSelectedAgent(agent.name);
                        setActiveTab('overview');
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-sm">{agent.name}</div>
                          <div className="text-xs text-claux-muted">{agent.role}</div>
                        </div>
                        <div className="relative">
                          <div className="w-2 h-2 bg-claux-teal rounded-full"></div>
                          <div className="absolute inset-0 w-2 h-2 bg-claux-teal rounded-full animate-ping"></div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs px-2 py-1 bg-claux-teal/10 text-claux-teal rounded-full">
                          Active 24/7
                        </span>
                      </div>
                      <div className="text-xs text-claux-muted mb-3 line-clamp-2">{agent.action}</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-claux-muted">{agent.time}</span>
                          <span className="font-medium">{agent.progress}%</span>
                        </div>
                        <div className="w-full bg-claux-border rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="h-full bg-claux-purple rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${agent.progress}%` }}
                            transition={{ duration: 1, delay: idx * 0.05 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Keyword Rankings</h2>
                <div className="bg-claux-surface border border-claux-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-claux-border">
                      <tr className="text-xs text-claux-muted">
                        <th className="text-left p-4 font-medium">Keyword</th>
                        <th className="text-left p-4 font-medium">Position</th>
                        <th className="text-left p-4 font-medium">Change</th>
                        <th className="text-left p-4 font-medium">Volume</th>
                        <th className="text-left p-4 font-medium">Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((rank, idx) => (
                        <motion.tr
                          key={rank.keyword}
                          className="border-b border-claux-border/50 hover:bg-claux-border/20"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <td className="p-4 text-sm">{rank.keyword}</td>
                          <td className="p-4">
                            <span className="text-2xl font-bold">#{rank.position}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-claux-teal font-medium flex items-center gap-1">
                              {rank.change === 'NEW' ? (
                                <span className="text-xs px-2 py-1 bg-claux-teal/10 rounded-full">
                                  NEW
                                </span>
                              ) : (
                                <>
                                  <span>↑</span>
                                  <span>{rank.change}</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-claux-muted">
                            {rank.volume.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="text-xs px-2 py-1 bg-claux-purple/10 text-claux-purple rounded-full">
                              {rank.agent}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-claux-surface border border-claux-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">ROI This Month</h2>
                <div className="text-center">
                  <div className="text-5xl font-bold text-claux-teal mb-2">
                    ₹{roiValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-claux-muted">
                    vs <span className="line-through">₹45,000 agency retainer</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Content Pipeline</h2>
                <div className="space-y-3">
                  {contentPipeline.map((item, idx) => (
                    <motion.div
                      key={item.title}
                      className="bg-claux-surface border border-claux-border rounded-xl p-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.color} ${item.status === 'WRITING' ? 'animate-pulse' : ''}`}></div>
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${item.color} bg-opacity-10`}>
                        {item.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Live Task Feed</h2>
              <div className="bg-claux-surface border border-claux-border rounded-xl p-4 space-y-3 h-[800px] overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {visibleTasks.map((task, idx) => (
                    <motion.div
                      key={`${task.agent}-${idx}-${taskIndex}`}
                      className="flex gap-3 p-3 bg-claux-bg rounded-lg border border-claux-border/50"
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <div className="text-claux-teal mt-0.5">✅</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-claux-purple mb-1">
                          {task.agent}
                        </div>
                        <div className="text-xs text-claux-muted leading-relaxed">
                          {task.task}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedAgent && agentDetailsData[selectedAgent] && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAgent(null)}
            />
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-[600px] bg-claux-surface border-l border-claux-border z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="sticky top-0 bg-claux-surface border-b border-claux-border p-6 z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedAgent}</h2>
                    <p className="text-sm text-claux-muted">
                      {agents.find((a) => a.name === selectedAgent)?.role}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="text-claux-muted hover:text-claux-text transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2">
                  {(['overview', 'tasks', 'performance'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        activeTab === tab
                          ? 'bg-claux-purple text-white'
                          : 'text-claux-muted hover:text-claux-text hover:bg-claux-border/30'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {agentDetailsData[selectedAgent].metrics.map((metric: any, idx: number) => (
                        <motion.div
                          key={metric.label}
                          className="bg-claux-bg border border-claux-border rounded-xl p-4"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <div className="text-xs text-claux-muted mb-2">{metric.label}</div>
                          <div className="text-3xl font-bold mb-1">{metric.value}</div>
                          <div className="text-xs text-claux-teal">{metric.trend}</div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-claux-bg border border-claux-border rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-claux-muted mb-1">Activation Date</div>
                          <div className="text-lg font-semibold">
                            {agentDetailsData[selectedAgent].activationDate}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-3 h-3 bg-claux-teal rounded-full"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-claux-teal rounded-full animate-ping"></div>
                          </div>
                          <span className="text-sm font-medium text-claux-teal">Active 24/7</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-claux-bg border border-claux-border rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Agent Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-claux-muted">Uptime</span>
                          <span className="text-sm font-medium">99.8%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-claux-muted">Tasks Completed</span>
                          <span className="text-sm font-medium">1,247</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-claux-muted">Avg Response Time</span>
                          <span className="text-sm font-medium">1.2s</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tasks' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {agentDetailsData[selectedAgent].tasks.map((taskItem: any, idx: number) => (
                      <motion.div
                        key={idx}
                        className="bg-claux-bg border border-claux-border rounded-xl p-4 flex gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="text-claux-teal mt-0.5">✅</div>
                        <div className="flex-1">
                          <div className="text-sm mb-1">{taskItem.task}</div>
                          <div className="text-xs text-claux-muted">{taskItem.time}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'performance' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-claux-bg border border-claux-border rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-4">Keywords Mapped (8 Weeks)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={agentDetailsData[selectedAgent].performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
                          <XAxis
                            dataKey="week"
                            stroke="#8892A4"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis stroke="#8892A4" style={{ fontSize: '12px' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#12141A',
                              border: '1px solid #1E2130',
                              borderRadius: '8px',
                              color: '#F0F2F8',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#7F77DD"
                            strokeWidth={3}
                            dot={{ fill: '#7F77DD', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-claux-bg border border-claux-border rounded-xl p-4">
                        <div className="text-xs text-claux-muted mb-2">Growth Rate</div>
                        <div className="text-2xl font-bold text-claux-teal">+458%</div>
                        <div className="text-xs text-claux-muted mt-1">Over 8 weeks</div>
                      </div>
                      <div className="bg-claux-bg border border-claux-border rounded-xl p-4">
                        <div className="text-xs text-claux-muted mb-2">Weekly Average</div>
                        <div className="text-2xl font-bold">+8.4</div>
                        <div className="text-xs text-claux-muted mt-1">Keywords/week</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed bottom-6 right-6 bg-claux-surface border border-claux-purple/50 rounded-xl p-4 shadow-lg shadow-claux-purple/20 z-50 max-w-sm"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="flex items-start gap-3">
              <div className="relative mt-1">
                <div className="w-2 h-2 bg-claux-teal rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-claux-teal rounded-full animate-ping"></div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-claux-purple mb-1">
                  {notification.agent} detected:
                </div>
                <div className="text-sm text-claux-text">{notification.message}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
