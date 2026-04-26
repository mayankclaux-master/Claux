'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import Sidebar from '@/components/dashboard/Sidebar';

type AgentsPageClientProps = {
  organizationName: string;
};

type Agent = {
  name: string;
  role: string;
  description: string;
  metric: string;
  tasks: string[];
  taskHistory: Array<{ task: string; timestamp: string }>;
  performance: Array<{ day: string; score: number }>;
  progress: number;
};

type ThinkingEntry = {
  timestamp: string;
  reasoning: string;
  action: string;
  outcome: string;
};

const agents: Agent[] = [
  {
    name: 'ARIA',
    role: 'Keyword Intelligence',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'SCRIBE',
    role: 'Content Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'LOCL',
    role: 'GBP Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'LINX',
    role: 'Backlink Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'CORE',
    role: 'Technical SEO',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'PULSE',
    role: 'Rank Tracker',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'REPUTE',
    role: 'Reputation Mgmt',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'RIVAL',
    role: 'Competitor Intel',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  },
  {
    name: 'AMPLI',
    role: 'Distribution',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0
  }
];

const agentChipColors: Record<string, string> = {
  ARIA: 'bg-[#7F77DD]/25 text-[#B3AEF3] border border-[#7F77DD]/40',
  SCRIBE: 'bg-[#3B82F6]/20 text-[#93C5FD] border border-[#3B82F6]/40',
  LOCL: 'bg-[#14B8A6]/20 text-[#5EEAD4] border border-[#14B8A6]/40',
  LINX: 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/40',
  CORE: 'bg-[#94A3B8]/20 text-[#CBD5E1] border border-[#94A3B8]/40',
  PULSE: 'bg-[#22C55E]/20 text-[#86EFAC] border border-[#22C55E]/40',
  REPUTE: 'bg-[#EAB308]/20 text-[#FDE047] border border-[#EAB308]/40',
  RIVAL: 'bg-[#EF4444]/20 text-[#FCA5A5] border border-[#EF4444]/40',
  AMPLI: 'bg-[#EC4899]/20 text-[#F9A8D4] border border-[#EC4899]/40'
};

const thinkingLogByAgent: Record<string, ThinkingEntry[]> = {};

export default function AgentsPageClient({ organizationName }: AgentsPageClientProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'thinking' | 'history' | 'performance'>('thinking');
  const [taskIndexByAgent, setTaskIndexByAgent] = useState<Record<string, number>>(() =>
    agents.reduce<Record<string, number>>((acc, agent) => {
      acc[agent.name] = 0;
      return acc;
    }, {})
  );
  const [typedReasoning, setTypedReasoning] = useState('');
  const isInitializing = true;

  useEffect(() => {
    const interval = setInterval(() => {
      setTaskIndexByAgent((prev) => {
        const next: Record<string, number> = { ...prev };
        agents.forEach((agent) => {
          next[agent.name] = ((prev[agent.name] ?? 0) + 1) % agent.tasks.length;
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const activeThinkingEntries = useMemo(() => {
    if (!activeAgent) {
      return [];
    }
    return thinkingLogByAgent[activeAgent.name] ?? [];
  }, [activeAgent]);

  useEffect(() => {
    if (!activeAgent || activeTab !== 'thinking' || activeThinkingEntries.length === 0) {
      setTypedReasoning('');
      return;
    }

    const fullText = activeThinkingEntries[0].reasoning;
    let idx = 0;
    setTypedReasoning('');

    const typer = setInterval(() => {
      idx += 1;
      setTypedReasoning(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(typer);
      }
    }, 18);

    return () => clearInterval(typer);
  }, [activeAgent, activeTab, activeThinkingEntries]);

  const closeModal = () => {
    setActiveAgent(null);
    setActiveTab('thinking');
  };

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <Sidebar organizationName={organizationName} />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1200px] mx-auto"
        >
          <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
          <p className="text-[#8892A4] mb-8">System initializing. Live agent actions will appear after asset connections.</p>

          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6, boxShadow: '0 0 0 1px #7F77DD, 0 20px 40px rgba(127,119,221,0.2)' }}
                onHoverStart={() => setHoveredAgent(agent.name)}
                onHoverEnd={() => setHoveredAgent((prev) => (prev === agent.name ? null : prev))}
                className="relative overflow-hidden bg-[#12141A] border border-[#1E2130] rounded-xl p-5"
              >
                <motion.div
                  className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-[#7F77DD] to-[#1D9E75] origin-left"
                  animate={{ scaleX: hoveredAgent === agent.name ? 1 : 0 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{agent.name}</h2>
                    <p className="text-sm text-[#8892A4]">{agent.role}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8892A4] bg-[#8892A4]/10 px-2 py-1 rounded-full">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#1D9E75] opacity-50 animate-ping" />
                      <span
                        className="absolute inline-flex h-6 w-6 rounded-full bg-[#1D9E75] opacity-40 animate-ping"
                        style={{ animationDuration: '2s' }}
                      />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D9E75]" />
                    </span>
                    System Initializing
                  </div>
                </div>

                <p className="text-sm text-[#8892A4] leading-relaxed mb-4 min-h-[56px]">{agent.description}</p>

                <div className="mb-4">
                  <div className="text-xs text-[#8892A4] mb-2">Last Action</div>
                  <div className="min-h-[44px] rounded-lg border border-[#1E2130] bg-[#0E1016] p-3">
                    <p className="text-sm text-[#8892A4]">System Initializing...</p>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8892A4]">Performance Metric</span>
                  <span className="text-[#8892A4] font-medium">N/A</span>
                </div>
                <div className="w-full bg-[#1E2130] rounded-full h-2 mb-4 relative overflow-hidden">
                  <div className="bg-[#7F77DD] h-2 rounded-full relative" style={{ width: '0%' }} />
                  <div className={`progress-shimmer ${hoveredAgent === agent.name ? 'progress-shimmer-active' : ''}`} />
                </div>

                <button
                  onClick={() => setActiveAgent(agent)}
                  className="w-full border border-[#7F77DD]/40 text-[#7F77DD] rounded-lg py-2.5 text-sm hover:bg-[#7F77DD]/10 transition-colors"
                >
                  Agent Thinking
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {activeAgent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80"
              onClick={closeModal}
            />

            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-4xl bg-[#0D0F15] border-l border-[#1E2130] overflow-y-auto"
            >
              <div className="p-8 border-b border-[#1E2130]">
                <button onClick={closeModal} className="absolute right-6 top-6 text-[#8892A4] hover:text-white text-xl">
                  ✕
                </button>

                <div className="flex items-start justify-between pr-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold leading-tight">
                      {activeAgent.name} — {activeAgent.role}
                    </h2>
                    <p className="text-sm text-[#8892A4] mt-2">Transparency Log — Last 30 Days</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#1D9E75] bg-[#1D9E75]/10 px-3 py-1.5 rounded-full h-fit">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#1D9E75] opacity-50 animate-ping" />
                      <span
                        className="absolute inline-flex h-6 w-6 rounded-full bg-[#1D9E75] opacity-40 animate-ping"
                        style={{ animationDuration: '2s' }}
                      />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D9E75]" />
                    </span>
                    Active 24/7
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    { key: 'thinking', label: 'THINKING LOG' },
                    { key: 'history', label: 'TASK HISTORY' },
                    { key: 'performance', label: 'PERFORMANCE' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as 'thinking' | 'history' | 'performance')}
                      className={`px-4 py-2 rounded-lg text-xs tracking-[0.1em] font-semibold border transition-all ${
                        activeTab === tab.key
                          ? 'bg-[#7F77DD]/25 border-[#7F77DD]/45 text-[#C9C5F8]'
                          : 'bg-[#11131A] border-[#1E2130] text-[#8892A4] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <motion.div layout className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'thinking' && (
                    <motion.div
                      key="thinking"
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <div className="relative pl-8">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: '100%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="absolute left-2.5 top-0 w-px bg-[#7F77DD]/70"
                        />

                        {isInitializing ? (
                          <div className="relative mb-5 rounded-xl border border-[#1E2130] bg-[#12141A] border-l-[3px] border-l-[#7F77DD] p-4 text-sm text-[#8892A4]">
                            System Initializing. Thinking logs will appear after first real execution.
                          </div>
                        ) : (
                          activeThinkingEntries.map((entry, idx) => (
                            <motion.div
                              key={`${entry.timestamp}-${idx}`}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.12 }}
                              className="relative mb-5 rounded-xl border border-[#1E2130] bg-[#12141A] border-l-[3px] border-l-[#7F77DD] p-4"
                            >
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${agentChipColors[activeAgent.name]}`}>
                                  {activeAgent.name}
                                </span>
                                <span className="text-[11px] italic text-[#8892A4]">{entry.timestamp}</span>
                              </div>

                              <div className="mb-3">
                                <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#7F77DD] mb-1.5 flex items-center gap-1.5">
                                  <span>◈</span>
                                  <span>REASONING:</span>
                                </div>
                                <p className="text-[13px] leading-[1.6] text-white">{idx === 0 ? typedReasoning : entry.reasoning}</p>
                              </div>

                              <div className="mb-3">
                                <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#1D9E75] mb-1.5">ACTION TAKEN:</div>
                                <p className="font-mono text-[13px] leading-[1.6] text-white">{entry.action}</p>
                              </div>

                              <div>
                                <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#22c55e] mb-1.5">OUTCOME:</div>
                                <p className="font-mono text-[13px] leading-[1.6] text-white">{entry.outcome}</p>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      {isInitializing ? (
                        <div className="rounded-xl border border-[#1E2130] bg-[#12141A] p-4 text-sm text-[#8892A4]">
                          System Initializing. Task history will appear after first run.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeAgent.taskHistory.map((item) => (
                            <div
                              key={`${item.task}-${item.timestamp}`}
                              className="rounded-xl border border-[#1E2130] bg-[#12141A] p-4 flex items-start justify-between gap-4"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-[#1D9E75] mt-0.5">✓</span>
                                <div>
                                  <p className="text-sm text-white">{item.task}</p>
                                  <p className="text-xs text-[#8892A4] mt-1">Completed</p>
                                </div>
                              </div>
                              <span className="text-xs italic text-[#8892A4] whitespace-nowrap">{item.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'performance' && (
                    <motion.div
                      key="performance"
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <div className="rounded-xl border border-[#1E2130] bg-[#12141A] p-5">
                        <h3 className="text-lg font-semibold mb-1">Performance Trajectory</h3>
                        <p className="text-sm text-[#8892A4] mb-4">Awaiting data from first completed agent cycles</p>
                        {isInitializing ? (
                          <div className="h-[320px] rounded-lg border border-[#1E2130] bg-[#0E1016] flex items-center justify-center text-sm text-[#8892A4]">
                            N/A — System Initializing
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={activeAgent.performance}>
                              <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
                              <XAxis dataKey="day" stroke="#8892A4" />
                              <YAxis stroke="#8892A4" domain={[40, 100]} />
                              <Tooltip contentStyle={{ background: '#12141A', border: '1px solid #1E2130' }} />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#7F77DD"
                                strokeWidth={2.8}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes progressShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        .progress-shimmer {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40%;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          transform: translateX(-100%);
          opacity: 0;
        }

        .progress-shimmer-active {
          opacity: 1;
          animation: progressShimmer 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
