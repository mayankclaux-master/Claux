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

const baseAgents = [
  {
    name: 'ARIA',
    role: 'Keyword Intelligence',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'SCRIBE',
    role: 'Content Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'LOCL',
    role: 'GBP Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'LINX',
    role: 'Backlink Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'CORE',
    role: 'Technical SEO',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'REPUTE',
    role: 'Reputation Mgmt',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'AMPLI',
    role: 'Distribution',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'PRISM',
    role: 'Analytics Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  },
  {
    name: 'PULSE',
    role: 'Monitoring Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
    lastRunAt: null
  }
] as const;

const initialKeywordRankings: RankingRow[] = [];

const initialLiveTaskFeed: FeedItem[] = [
  
];

function statusIcon(status?: FeedItem['status']) {
  if (status === 'failed') return '❌';
  if (status === 'pending') return '⏳';
  return '✅';
}

function normalizeAgentStatus(value: string | number | null | undefined) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (normalized === 'completed') {
    return 'Completed';
  }

  if (normalized === 'pending' || normalized === 'in_progress' || normalized === 'running') {
    return 'In Progress';
  }

  if (normalized === 'failed' || normalized === 'error') {
    return 'Failed';
  }

  return 'System Initializing';
}

function normalizeAgentProgress(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getInitialAgentStateByName(): Record<AgentName, AgentState> {
  const state: Record<AgentName, AgentState> = {} as Record<AgentName, AgentState>;
  for (const name of AGENT_NAMES) {
    state[name] = { statusLine: 'System Initializing', progress: 0, runCount: 0, errorCount: 0, lastRunAt: null };
  }
  return state;
}

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
  const [agentStateByName, setAgentStateByName] = useState<Record<AgentName, AgentState>>(() => getInitialAgentStateByName());
  const [dashboardStats, setDashboardStats] = useState<{
    aria: { totalKeywords: number; topKeywords: Array<{ keyword: string; search_volume: number; intent: string }>; intentBreakdown: { [key: string]: number } } | null;
    scribe: { draftCount: number; publishedCount: number } | null;
    publish: { successCount: number; failedCount: number; latestPublishedUrls: Array<{ url: string; published_at: string }> } | null;
    pulse: { averageRank: number | null; averageVisibilityScore: number | null; topImprovingKeywords: Array<{ keyword: string; rank_change: number }> } | null;
    locl: { optimizationScore: number | null; completenessScore: number | null; recommendations: string[] } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = [
    { label: 'Total Keywords', value: String(dashboardStats?.aria?.totalKeywords ?? '0'), helper: dashboardStats?.aria?.totalKeywords ? 'Tracked' : 'Awaiting Data' },
    { label: 'Draft Content', value: String(dashboardStats?.scribe?.draftCount ?? '0'), helper: dashboardStats?.scribe?.draftCount ? 'Generated' : 'Awaiting Data' },
    { label: 'Published Posts', value: String(dashboardStats?.scribe?.publishedCount ?? '0'), helper: dashboardStats?.scribe?.publishedCount ? 'Live' : 'Awaiting Data' },
    { label: 'Live Agent Signals', value: String(liveTaskFeed.length), helper: liveTaskFeed.length ? 'Realtime Active' : 'System Initializing' }
  ];

  useEffect(() => {
    if (!isUserLoaded || !user) {
      setLiveTaskFeed([]);
      setKeywordRankings([]);
      setAgentStateByName(getInitialAgentStateByName());
      setDashboardStats(null);
      return;
    }

    if (!orgId) {
      setLiveTaskFeed([]);
      setKeywordRankings([]);
      setAgentStateByName(getInitialAgentStateByName());
      setDashboardStats(null);
      return;
    }

    async function loadDashboardStats() {
      try {
        const response = await fetch(`/api/dashboard/stats`);
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
        const response = await fetch(`/api/dashboard/activity-feed`);
        if (!response.ok) {
          setError("Failed to load activity feed");
          return;
        }
        const json = await response.json();
        const activities = json.data;

        if (!activities) return;

        const nextFeed = activities.map((row: any) => ({
          agent: row.agent as string,
          task: row.message as string,
          status: (row.status as FeedItem['status']) ?? 'completed'
        }));

        setLiveTaskFeed(nextFeed);
      } catch (err) {
        setError("Failed to load activity feed");
      }
    }

    async function loadAgentStates() {
      try {
        const response = await fetch(`/api/dashboard/agent-status`);
        if (!response.ok) {
          setError("Failed to load agent status");
          return;
        }
        const json = await response.json();
        const agentStatusData = json.data;

        if (!agentStatusData || agentStatusData.length === 0) {
          setAgentStateByName(getInitialAgentStateByName());
          return;
        }

        // Map agent status data to UI state
        const nextState = getInitialAgentStateByName();
        for (const status of agentStatusData) {
          const agentName = status.agent as AgentName;
          if (AGENT_NAMES.includes(agentName)) {
            nextState[agentName] = {
              statusLine: normalizeAgentStatus(status.status),
              progress: normalizeAgentProgress(status.status === 'running' ? 50 : status.status === 'completed' ? 100 : 0),
              lastRunAt: status.lastRun
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
        const response = await fetch(`/api/dashboard/stats`);
        if (!response.ok) {
          return;
        }
        const json = await response.json();
        const pulseStats = json.pulse;

        if (!pulseStats || !pulseStats.topImprovingKeywords) {
          setKeywordRankings([]);
          return;
        }

        const nextKeywords = pulseStats.topImprovingKeywords.slice(0, 5).map((item: any) => ({
          keyword: item.keyword,
          position: 0, // Will be updated when real ranking data is available
          change: item.rank_change,
          volume: 0, // Will be updated when real volume data is available
          agent: 'PULSE'
        }));

        setKeywordRankings(nextKeywords);
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

  const agents = baseAgents.map((agent) => {
    const runtimeState = agentStateByName[agent.name as AgentName] ?? { statusLine: 'System Initializing', progress: 0 };
    const statusLine =
      agent.name === 'CORE' && isWordPress && runtimeState.statusLine === 'System Initializing'
        ? 'WordPress Managed'
        : runtimeState.statusLine;

    const action =
      statusLine === 'Completed'
        ? `${agent.name} cycle completed. Awaiting next sync.`
        : statusLine === 'In Progress'
          ? 'Execution in progress. Receiving live updates.'
          : statusLine === 'Failed'
            ? 'Last run failed. Awaiting orchestrator retry.'
            : 'System initializing. Waiting for connected assets.';

    return {
      ...agent,
      action,
      progress: runtimeState.progress,
      statusLine,
      time: runtimeState.progress > 0 ? 'Live' : 'N/A'
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
