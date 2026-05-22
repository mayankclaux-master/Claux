'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/dashboard/Sidebar';

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  delay?: number;
};

type AgentCardProps = {
  name: string;
  role: string;
  action: string;
  progress: number;
  time: string;
  statusLine: string;
  delay?: number;
};

type MissionControlProps = {
  isWordPress: boolean;
  orgId: string | null;
};

type RankingRow = {
  keyword: string;
  position: number;
  change: number | 'NEW';
  volume: number;
  agent: string;
};

type FeedItem = {
  agent: string;
  task: string;
  status?: 'pending' | 'completed' | 'failed';
};

type AgentName = 'ARIA' | 'SCRIBE' | 'LOCL' | 'LINX' | 'CORE' | 'REPUTE' | 'AMPLI' | 'PRISM' | 'PULSE';
type AgentState = {
  statusLine: string;
  progress: number;
  runCount?: number;
  errorCount?: number;
  lastRunAt?: string | null;
};

const AGENT_NAMES: AgentName[] = ['ARIA', 'SCRIBE', 'LOCL', 'LINX', 'CORE', 'REPUTE', 'AMPLI', 'PRISM', 'PULSE'];

// REMOVED: Hardcoded agent array with fake execution states (Phase 2C)
// Dashboard now uses canonical runtime data from RuntimeService via API routes
// Agents are pure visualization layer over canonical runtime authority

const initialKeywordRankings: RankingRow[] = [];

const initialLiveTaskFeed: FeedItem[] = [
  
];

function statusIcon(status?: FeedItem['status']) {
  if (status === 'failed') return '❌';
  if (status === 'pending') return '⏳';
  return '✅';
}

// REMOVED: Hardcoded status normalization and initial agent state (Phase 2C)
// Dashboard now uses canonical execution statuses from RuntimeService
// Status mapping: PENDING -> 'Pending', RUNNING -> 'Running', COMPLETED -> 'Completed', FAILED -> 'Failed', CANCELLED -> 'Cancelled', RETRYING -> 'Retrying'

function StatCard({ label, value, helper, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="bg-claux-surface border border-claux-border rounded-xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="text-xs text-[#8892A4] mb-2">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold text-claux-text">{value}</div>
        {helper ? <div className="text-claux-teal text-sm mb-1">{helper}</div> : null}
      </div>
    </motion.div>
  );
}

function AgentCard({ name, role, action, progress, time, statusLine, delay = 0 }: AgentCardProps) {
  return (
    <motion.div
      className="bg-claux-surface border border-claux-border rounded-xl p-4 transition-all"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ y: -4, borderColor: '#7F77DD', boxShadow: '0 0 20px rgba(127, 119, 221, 0.4)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold text-sm text-claux-text">{name}</div>
          <div className="text-xs text-[#8892A4]">{role}</div>
        </div>
        <div className="relative">
          <div className="w-2 h-2 bg-claux-teal rounded-full"></div>
          <div className="absolute inset-0 w-2 h-2 bg-claux-teal rounded-full animate-ping"></div>
        </div>
      </div>
      <div className="mb-3">
        <span className="text-xs px-2 py-1 bg-claux-teal/10 text-claux-teal rounded-full">{statusLine}</span>
      </div>
      <div className="text-xs text-[#8892A4] mb-3 line-clamp-2">{action}</div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#8892A4]">{time}</span>
          <span className="font-medium text-claux-text">{progress}%</span>
        </div>
        <div className="w-full bg-claux-border rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-claux-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function MissionControl({ isWordPress, orgId }: MissionControlProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [liveTaskFeed, setLiveTaskFeed] = useState<FeedItem[]>(initialLiveTaskFeed);
  const [keywordRankings, setKeywordRankings] = useState<RankingRow[]>(initialKeywordRankings);
  const [agentStateByName, setAgentStateByName] = useState<Record<AgentName, AgentState>>({} as Record<AgentName, AgentState>);
  const [dashboardStats, setDashboardStats] = useState<{
    aria: { totalExecutions: number; successfulExecutions: number; failedExecutions: number; totalKeywords: number; avgDurationMs: number; totalCost: number; totalTokens: number } | null;
    scribe: { totalExecutions: number; successfulExecutions: number; failedExecutions: number; draftCount: number; publishedCount: number; avgDurationMs: number; totalCost: number; totalTokens: number } | null;
    overall: { totalExecutions: number; runningExecutions: number; totalTasks: number; completedTasks: number; failedTasks: number } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = [
    { label: 'Total Executions', value: String(dashboardStats?.overall?.totalExecutions ?? '0'), helper: dashboardStats?.overall?.totalExecutions ? 'Run' : 'Awaiting Data' },
    { label: 'Total Keywords', value: String(dashboardStats?.aria?.totalKeywords ?? '0'), helper: dashboardStats?.aria?.totalKeywords ? 'Tracked' : 'Awaiting Data' },
    { label: 'Draft Content', value: String(dashboardStats?.scribe?.draftCount ?? '0'), helper: dashboardStats?.scribe?.draftCount ? 'Generated' : 'Awaiting Data' },
    { label: 'Running Tasks', value: String(dashboardStats?.overall?.runningExecutions ?? '0'), helper: dashboardStats?.overall?.runningExecutions ? 'Active' : 'Idle' }
  ];

  useEffect(() => {
    if (!isUserLoaded || !user) {
      setLiveTaskFeed([]);
      setKeywordRankings([]);
      setAgentStateByName({} as Record<AgentName, AgentState>);
      setDashboardStats(null);
      return;
    }

    if (!orgId) {
      setLiveTaskFeed([]);
      setKeywordRankings([]);
      setAgentStateByName({} as Record<AgentName, AgentState>);
      setDashboardStats(null);
      return;
    }

    async function loadDashboardStats() {
      try {
        const response = await fetch(`/api/dashboard/runtime-stats`);
        if (!response.ok) {
          setError("Failed to load dashboard stats");
          return;
        }
        const json = await response.json();
        setDashboardStats(json);
      } catch (err) {
        setError("Failed to load dashboard stats");
      }
    }

    async function loadActivityFeed() {
      try {
        const response = await fetch(`/api/dashboard/runtime-activity-feed`);
        if (!response.ok) {
          setError("Failed to load activity feed");
          return;
        }
        const json = await response.json();
        const activities = json.data;

        if (!activities) return;

        const nextFeed = activities.map((row: any) => ({
          agent: row.agent as string,
          task: row.task as string,
          status: (row.status as FeedItem['status']) ?? 'completed'
        }));

        setLiveTaskFeed(nextFeed);
      } catch (err) {
        setError("Failed to load activity feed");
      }
    }

    async function loadAgentStates() {
      try {
        const response = await fetch(`/api/dashboard/runtime-agent-status`);
        if (!response.ok) {
          setError("Failed to load agent status");
          return;
        }
        const json = await response.json();
        const agentStatusData = json.data;

        if (!agentStatusData || agentStatusData.length === 0) {
          setAgentStateByName({} as Record<AgentName, AgentState>);
          return;
        }

        // Map canonical runtime agent status to UI state
        // Dashboard is pure visualization layer over canonical runtime authority
        const nextState: Record<AgentName, AgentState> = {} as Record<AgentName, AgentState>;
        for (const status of agentStatusData) {
          const agentName = status.agent as AgentName;
          if (AGENT_NAMES.includes(agentName)) {
            // Use canonical execution status directly from RuntimeService
            // Progress derived from status: RUNNING=50, COMPLETED=100, others=0
            const progress = status.status === 'running' ? 50 : status.status === 'completed' ? 100 : 0;
            
            nextState[agentName] = {
              statusLine: status.status.charAt(0).toUpperCase() + status.status.slice(1), // Capitalize first letter
              progress,
              lastRunAt: status.lastExecutionAt,
              runCount: status.totalExecutions,
              errorCount: status.failedExecutions
            };
          }
        }
        setAgentStateByName(nextState);
      } catch (err) {
        setError("Failed to load agent status");
      }
    }

    async function loadKeywordRankings() {
      try {
        // Keyword rankings from seo_keywords table
        const response = await fetch(`/api/dashboard/runtime-stats`);
        if (!response.ok) {
          return;
        }
        const json = await response.json();
        
        // Get top keywords from ARIA stats
        const ariaStats = json.aria;
        
        // For now, clear keyword rankings as this requires ranking pipeline
        setKeywordRankings([]);
      } catch (err) {
        // Silently fail for keyword rankings
      }
    }

    void loadDashboardStats();
    void loadActivityFeed();
    void loadAgentStates();
    void loadKeywordRankings();

    const interval = setInterval(() => {
      void loadAgentStates();
      void loadActivityFeed();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [orgId, isUserLoaded, user]);

  // REMOVED: Hardcoded baseAgents array (Phase 2C)
  // Dashboard now constructs agent cards from canonical runtime data
  const agents = AGENT_NAMES.map((agentName) => {
    const runtimeState = agentStateByName[agentName] ?? { statusLine: 'Not Executed', progress: 0, runCount: 0, errorCount: 0, lastRunAt: null };
    
    // Agent roles for display
    const agentRoles: Record<AgentName, string> = {
      ARIA: 'Keyword Intelligence',
      SCRIBE: 'Content Agent',
      LOCL: 'GBP Agent',
      LINX: 'Backlink Agent',
      CORE: 'Technical SEO',
      REPUTE: 'Reputation Mgmt',
      AMPLI: 'Distribution',
      PRISM: 'Analytics Agent',
      PULSE: 'Monitoring Agent'
    };

    // Action message based on canonical runtime state
    const getActionMessage = (status: string) => {
      switch (status) {
        case 'Completed':
          return `${agentName} cycle completed. Awaiting next sync.`;
        case 'Running':
          return 'Execution in progress. Receiving live updates.';
        case 'Failed':
          return 'Last run failed. Awaiting orchestrator retry.';
        case 'Pending':
          return 'Execution queued. Awaiting start.';
        case 'Cancelled':
          return 'Execution cancelled.';
        case 'Retrying':
          return 'Execution retrying.';
        default:
          return 'No executions yet.';
      }
    };

    const displayAction = runtimeState.runCount > 0 ? getActionMessage(runtimeState.statusLine) : 'No executions yet.';
    const displayTime = runtimeState.lastRunAt ? new Date(runtimeState.lastRunAt).toLocaleString() : 'N/A';

    return {
      name: agentName,
      role: agentRoles[agentName],
      action: displayAction,
      progress: runtimeState.progress,
      time: displayTime,
      statusLine: runtimeState.statusLine
    };
  });

  return (
    <div className="flex h-screen bg-claux-bg text-claux-text overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-8 space-y-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                helper={stat.helper}
                delay={index * 0.08}
              />
            ))}
          </div>

          <section>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">AI Agents</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {agents.map((agent, index) => (
                      <AgentCard
                        key={agent.name}
                        name={agent.name}
                        role={agent.role}
                        action={agent.action}
                        progress={agent.progress}
                        time={agent.time}
                        statusLine={agent.statusLine}
                        delay={index * 0.05}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Keyword Rankings</h2>
                  <div className="bg-claux-surface border border-claux-border rounded-xl overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="border-b border-claux-border">
                        <tr className="text-xs text-[#8892A4]">
                          <th className="text-left p-4 font-medium">Keyword</th>
                          <th className="text-left p-4 font-medium">Position</th>
                          <th className="text-left p-4 font-medium">Change</th>
                          <th className="text-left p-4 font-medium">Volume</th>
                          <th className="text-left p-4 font-medium">Agent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywordRankings.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-sm text-[#8892A4]">
                              Connect Assets to start keyword tracking.
                            </td>
                          </tr>
                        ) : (
                          keywordRankings.map((row, index) => (
                            <motion.tr
                              key={`${row.keyword}-${index}`}
                              className="border-b border-claux-border/50 hover:bg-claux-border/20"
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.06 }}
                            >
                              <td className="p-4 text-sm text-claux-text">{row.keyword}</td>
                              <td className="p-4">
                                <span className="text-xl font-bold text-claux-text">#{row.position}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-claux-teal font-medium flex items-center gap-1 text-sm">
                                  <span>•</span>
                                  <span>{row.change}</span>
                                </span>
                              </td>
                              <td className="p-4 text-sm text-[#8892A4]">{row.volume.toLocaleString()}</td>
                              <td className="p-4">
                                <span className="text-xs px-2 py-1 bg-claux-purple/10 text-claux-purple rounded-full">
                                  {row.agent}
                                </span>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-1">
                <h2 className="text-lg font-semibold mb-4">Live Task Feed</h2>
                <div className="bg-claux-surface border border-claux-border rounded-xl p-4 space-y-3 xl:h-[780px] xl:overflow-y-auto">
                  {liveTaskFeed.length === 0 ? (
                    <div className="text-xs text-[#8892A4] p-3 bg-claux-bg rounded-lg border border-claux-border/50">
                      Waiting for Agent Signal...
                    </div>
                  ) : (
                    liveTaskFeed.map((item, index) => (
                      <motion.div
                        key={`${item.agent}-${index}`}
                        className="flex gap-3 p-3 bg-claux-bg rounded-lg border border-claux-border/50"
                        initial={{ opacity: 0, x: 32 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06 }}
                      >
                        <div className="text-claux-teal mt-0.5">{statusIcon(item.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-claux-purple mb-1">{item.agent}</div>
                          <div className="text-xs text-[#8892A4] leading-relaxed">{item.task}</div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
