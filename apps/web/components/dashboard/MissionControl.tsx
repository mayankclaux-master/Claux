'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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
  organizationName: string;
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

type ConnectionAgentState = {
  aria_status?: string | null;
  aria_progress?: number | null;
};

const baseAgents = [
  {
    name: 'ARIA',
    role: 'Keyword Intelligence',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'SCRIBE',
    role: 'Content Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'LOCL',
    role: 'GBP Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'LINX',
    role: 'Backlink Agent',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'CORE',
    role: 'Technical SEO',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'PULSE',
    role: 'Rank Tracker',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'RIVAL',
    role: 'Competitor Intel',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'REPUTE',
    role: 'Reputation Mgmt',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
  },
  {
    name: 'AMPLI',
    role: 'Distribution',
    action: 'System initializing. Waiting for connected assets.',
    progress: 0,
    time: 'N/A',
    statusLine: 'System Initializing'
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

function normalizeAriaStatus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

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

function normalizeAriaProgress(value: number | null | undefined) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
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

export default function MissionControl({ organizationName, isWordPress, orgId }: MissionControlProps) {
  const [liveTaskFeed, setLiveTaskFeed] = useState<FeedItem[]>(initialLiveTaskFeed);
  const [keywordRankings, setKeywordRankings] = useState<RankingRow[]>(initialKeywordRankings);
  const [ariaStatus, setAriaStatus] = useState<string>('System Initializing');
  const [ariaProgress, setAriaProgress] = useState<number>(0);

  const stats = [
    { label: 'Domain Authority', value: 'N/A', helper: 'Connect Assets' },
    { label: 'Keywords Ranking', value: String(keywordRankings.length), helper: keywordRankings.length ? 'Tracked' : 'Connect Assets' },
    { label: 'Organic Traffic', value: '0', helper: 'Awaiting Data' },
    { label: 'Live Agent Signals', value: String(liveTaskFeed.length), helper: liveTaskFeed.length ? 'Realtime Active' : 'System Initializing' }
  ];

  useEffect(() => {
    if (!orgId) {
      setLiveTaskFeed([]);
      setKeywordRankings([]);
      setAriaStatus('System Initializing');
      setAriaProgress(0);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    console.log('Realtime Subscribed for Org:', orgId);

    async function loadInitialFeed() {
      const { data, error } = await supabase
        .from('agent_activities')
        .select('agent_name, status_message, status')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(60);

      if (error || !data) {
        return;
      }

      const nextFeed = data
        .filter((row) => row.agent_name && row.status_message)
        .map((row) => ({
          agent: row.agent_name as string,
          task: row.status_message as string,
          status: (row.status as FeedItem['status']) ?? 'completed'
        }));

      setLiveTaskFeed(nextFeed);
    }

    async function loadKeywordInsights() {
      const { data, error } = await supabase
        .from('keyword_insights')
        .select('keyword, position, volume, agent_name')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(60);

      if (error || !data) {
        return;
      }

      const nextKeywords = data
        .filter((row) => row.keyword && row.agent_name)
        .map((row) => ({
          keyword: row.keyword as string,
          position: Number(row.position ?? 0),
          change: 0,
          volume: Number(row.volume ?? 0),
          agent: row.agent_name as string
        }));

      setKeywordRankings(nextKeywords);
    }

    async function loadConnectionAgentState() {
      const { data, error } = await supabase
        .from('connections')
        .select('aria_status, aria_progress')
        .eq('org_id', orgId)
        .maybeSingle();

      if (error || !data) {
        return;
      }

      const connectionState = data as ConnectionAgentState;
      setAriaStatus(normalizeAriaStatus(connectionState.aria_status));
      setAriaProgress(normalizeAriaProgress(connectionState.aria_progress));
    }

    void loadInitialFeed();
    void loadKeywordInsights();
    void loadConnectionAgentState();

    const channel = supabase
      .channel(`agent-activities-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activities',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          const row = payload.new as {
            agent_name?: string;
            status_message?: string;
            status?: FeedItem['status'];
          };

          const agentName = row.agent_name;
          const statusMessage = row.status_message;

          if (!agentName || !statusMessage) return;

          setLiveTaskFeed((prev) => [
            { agent: agentName, task: statusMessage, status: row.status ?? 'completed' },
            ...prev
          ].slice(0, 60));
        }
      )
      .subscribe();

    const connectionsChannel = supabase
      .channel(`connections-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          const row = payload.new as ConnectionAgentState;
          setAriaStatus(normalizeAriaStatus(row.aria_status));
          setAriaProgress(normalizeAriaProgress(row.aria_progress));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(connectionsChannel);
    };
  }, [orgId]);

  const agents = baseAgents.map((agent) => {
    if (agent.name === 'ARIA') {
      const isCompleted = ariaStatus === 'Completed';

      return {
        ...agent,
        action: isCompleted
          ? 'Keyword intelligence cycle completed. Awaiting next sync.'
          : 'System initializing. Waiting for connected assets.',
        progress: ariaProgress,
        statusLine: ariaStatus,
        time: isCompleted ? 'Live' : 'N/A'
      };
    }

    if (agent.name === 'CORE') {
      return {
        ...agent,
        statusLine: isWordPress ? 'WordPress Managed' : agent.statusLine
      };
    }

    return agent;
  });

  return (
    <div className="flex h-screen bg-claux-bg text-claux-text overflow-hidden">
      <Sidebar organizationName={organizationName} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-8 space-y-6">
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
