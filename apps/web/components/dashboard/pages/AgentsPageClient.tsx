'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/dashboard/Sidebar';
import { useTenant } from '@/contexts/TenantContext';
import { getAgentAuditLogs } from '@/actions/audit-log';


type AgentName = 'ARIA' | 'SCRIBE' | 'LOCL' | 'LINX' | 'CORE' | 'REPUTE' | 'AMPLI' | 'PRISM' | 'PULSE';

type ViewerProfile = {
  tenantId: string;
  role: 'owner' | 'admin' | 'member';
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
  action: string;
  last_error?: string | null;
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
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'SCRIBE',
    role: 'Content Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'LOCL',
    role: 'GBP Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'LINX',
    role: 'Backlink Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'CORE',
    role: 'Technical SEO',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'VISUAL',
    role: 'Creative Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'REPUTE',
    role: 'Reputation Mgmt',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'FORGE',
    role: 'Implementation Agent',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  },
  {
    name: 'AMPLI',
    role: 'Distribution',
    description: 'System initializing. Awaiting asset connections and first crawl cycle.',
    metric: 'N/A',
    tasks: ['System Initializing'],
    taskHistory: [],
    performance: [],
    progress: 0,
    action: 'System Initializing',
    last_error: null
  }
];

const AGENT_NAMES: AgentName[] = ['ARIA', 'SCRIBE', 'LOCL', 'LINX', 'CORE', 'REPUTE', 'AMPLI', 'PRISM', 'PULSE'];

const agentChipColors: Record<string, string> = {
  ARIA: 'bg-[#7F77DD]/25 text-[#B3AEF3] border border-[#7F77DD]/40',
  SCRIBE: 'bg-[#3B82F6]/20 text-[#93C5FD] border border-[#3B82F6]/40',
  VISUAL: 'bg-[#22C55E]/20 text-[#86EFAC] border border-[#22C55E]/40',
  FORGE: 'bg-[#EF4444]/20 text-[#FCA5A5] border border-[#EF4444]/40',
  LOCL: 'bg-[#14B8A6]/20 text-[#5EEAD4] border border-[#14B8A6]/40',
  LINX: 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/40',
  CORE: 'bg-[#94A3B8]/20 text-[#CBD5E1] border border-[#94A3B8]/40',
  REPUTE: 'bg-[#EAB308]/20 text-[#FDE047] border border-[#EAB308]/40',
  AMPLI: 'bg-[#EC4899]/20 text-[#F9A8D4] border border-[#EC4899]/40'
};

const thinkingLogByAgent: Record<string, ThinkingEntry[]> = {};

export default function AgentsPageClient() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { tenant, loading } = useTenant();
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'thinking' | 'history' | 'performance'>('thinking');
  const [viewerProfile, setViewerProfile] = useState<ViewerProfile | null>(null);
  const [isDeveloperModeOpen, setIsDeveloperModeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggeringByAgent, setTriggeringByAgent] = useState<Record<AgentName, boolean>>(() =>
    AGENT_NAMES.reduce((acc, name) => {
      acc[name] = false;
      return acc;
    }, {} as Record<AgentName, boolean>)
  );
  const [isTriggeringAll, setIsTriggeringAll] = useState(false);
  const [isRunningSanity, setIsRunningSanity] = useState(false);
  const [developerMessage, setDeveloperMessage] = useState<string | null>(null);
  const [taskIndexByAgent, setTaskIndexByAgent] = useState<Record<string, number>>(() =>
    agents.reduce<Record<string, number>>((acc, agent) => {
      acc[agent.name] = 0;
      return acc;
    }, {})
  );
  const [typedReasoning, setTypedReasoning] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const isInitializing = true;
  const isAdminOrOwner = viewerProfile?.role === 'owner' || viewerProfile?.role === 'admin';

  useEffect(() => {
    async function loadViewerProfile() {
      if (!isUserLoaded || !user) {
        setViewerProfile(null);
        return;
      }

      try {
        const response = await fetch('/api/dashboard/profile');
        if (!response.ok) {
          setError("Failed to load profile");
          setViewerProfile(null);
          return;
        }
        const json = await response.json();
        const data = json.data;

        if (!data?.profile) {
          setError("Profile not found");
          setViewerProfile(null);
          return;
        }

        const normalizedRole = String(data.profile.role ?? 'member').toLowerCase();
        const role: ViewerProfile['role'] =
          normalizedRole === 'owner' || normalizedRole === 'admin' ? (normalizedRole as ViewerProfile['role']) : 'member';

        setViewerProfile({
          tenantId: String(data.profile.tenant_id),
          role
        });
      } catch (err) {
        setError("Failed to load profile");
        setViewerProfile(null);
      }
    }
    loadViewerProfile();
  }, [isUserLoaded, user]);

  async function triggerAgentNow(agentName: AgentName) {
    if (!viewerProfile?.tenantId) {
      setDeveloperMessage('Workspace tenant context is missing. Refresh and try again.');
      return;
    }

    setDeveloperMessage(null);
    setTriggeringByAgent((prev) => ({ ...prev, [agentName]: true }));

    try {
      const response = await fetch('/api/v1/orchestrator/trigger-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: viewerProfile.tenantId,
          agent_name: agentName,
          task_type: `manual_${agentName.toLowerCase()}_run`,
          idempotency_key: `agents-page:${viewerProfile.tenantId}:${agentName}:${Date.now()}`,
          payload: {
            source: 'agents_page_admin_panel'
          }
        })
      });

      const body = (await response.json()) as { error?: string; task_id?: string };

      if (!response.ok) {
        setDeveloperMessage(body.error ?? `Failed to trigger ${agentName}.`);
        return;
      }

      setDeveloperMessage(`${agentName} triggered successfully${body.task_id ? ` (task ${body.task_id.slice(0, 8)})` : ''}.`);
    } catch {
      setDeveloperMessage(`Failed to trigger ${agentName}.`);
    } finally {
      setTriggeringByAgent((prev) => ({ ...prev, [agentName]: false }));
    }
  }

  async function triggerEntireWorkforce() {
    if (!isAdminOrOwner) {
      return;
    }

    setDeveloperMessage(null);
    setIsTriggeringAll(true);

    try {
      await Promise.all(AGENT_NAMES.map((agentName) => triggerAgentNow(agentName)));
      setDeveloperMessage('Workforce force-start command sent to all 9 agents.');
    } finally {
      setIsTriggeringAll(false);
    }
  }

  async function runSanityCheck() {
    if (!viewerProfile?.tenantId) {
      setDeveloperMessage('Workspace tenant context is missing. Refresh and try again.');
      return;
    }

    setDeveloperMessage(null);
    setIsRunningSanity(true);

    try {
      const response = await fetch('/api/v1/orchestrator/sanity-heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: viewerProfile.tenantId,
          agent_name: 'ARIA'
        })
      });

      const body = (await response.json()) as { error?: string; ok?: boolean; task_id?: string };

      if (!response.ok || !body.ok) {
        setDeveloperMessage(body.error ?? 'Sanity check failed.');
        return;
      }

      setDeveloperMessage(`Sanity heartbeat sent (task ${String(body.task_id ?? '').slice(0, 8)}).`);
    } catch {
      setDeveloperMessage('Sanity check failed.');
    } finally {
      setIsRunningSanity(false);
    }
  }

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

  useEffect(() => {
    async function loadAuditLogs() {
      if (!tenant?.id || !activeAgent || activeAgent.name !== 'CORE') {
        setAuditLogs([]);
        return;
      }

      setLoadingAuditLogs(true);
      try {
        const logs = await getAgentAuditLogs(tenant.id);
        setAuditLogs(logs);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        setAuditLogs([]);
      } finally {
        setLoadingAuditLogs(false);
      }
    }

    loadAuditLogs();
  }, [tenant?.id, activeAgent?.name, activeTab]);

  const closeModal = () => {
    setActiveAgent(null);
    setActiveTab('thinking');
  };

  return (
    <div className="flex min-h-screen bg-[#0A0B0F] text-[#F0F2F8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1200px] mx-auto"
        >
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
          <p className="text-[#8892A4] mb-8">System initializing. Live agent actions will appear after asset connections.</p>

          {isAdminOrOwner ? (
            <div className="mb-8 rounded-xl border border-[#7F77DD]/35 bg-[#12141A] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.12em] uppercase text-[#B3AEF3]">Developer Mode</p>
                  <h2 className="text-lg font-semibold">Admin Control Surface</h2>
                  <p className="text-sm text-[#8892A4]">Owner/Admin only — trigger agents and run realtime smoke checks.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeveloperModeOpen((prev) => !prev)}
                  className="rounded-lg border border-[#7F77DD]/40 px-3 py-2 text-xs font-semibold text-[#C9C5F8] hover:bg-[#7F77DD]/10"
                >
                  {isDeveloperModeOpen ? 'Hide Panel' : 'Open Panel'}
                </button>
              </div>

              {isDeveloperModeOpen ? (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={triggerEntireWorkforce}
                      disabled={isTriggeringAll}
                      className="rounded-lg bg-[#7F77DD] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {isTriggeringAll ? 'Triggering Workforce...' : 'Force-Start All 9 Agents'}
                    </button>
                    <button
                      type="button"
                      onClick={runSanityCheck}
                      disabled={isRunningSanity}
                      className="rounded-lg border border-[#1D9E75]/40 bg-[#1D9E75]/10 px-3 py-2 text-xs font-semibold text-[#6EE7C7] disabled:opacity-60"
                    >
                      {isRunningSanity ? 'Running Sanity Check...' : 'Sanity Check (Heartbeat)'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {AGENT_NAMES.map((agentName) => (
                      <div key={`trigger-${agentName}`} className="rounded-lg border border-[#1E2130] bg-[#0E1016] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">{agentName}</span>
                          <button
                            type="button"
                            onClick={() => triggerAgentNow(agentName)}
                            disabled={Boolean(triggeringByAgent[agentName]) || isTriggeringAll}
                            className="rounded-md border border-[#7F77DD]/40 px-2.5 py-1.5 text-[11px] font-semibold text-[#C9C5F8] hover:bg-[#7F77DD]/10 disabled:opacity-60"
                          >
                            {triggeringByAgent[agentName] ? 'Triggering...' : 'Trigger Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {developerMessage ? <p className="text-xs text-[#8892A4]">{developerMessage}</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}

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
                  <div className="text-xs text-[#8892A4] mb-2">Current Task</div>
                  <div className="min-h-[44px] rounded-lg border border-[#1E2130] bg-[#0E1016] p-3">
                    <p className="text-sm text-white">{agent.action}</p>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8892A4]">Performance Metric</span>
                  <span className="text-[#8892A4] font-medium">N/A</span>
                </div>
                <div className="w-full bg-[#1E2130] rounded-full h-2 mb-4 relative overflow-hidden">
                  <div className={`bg-[#7F77DD] h-2 rounded-full relative ${agent.progress > 0 ? 'animate-pulse' : ''}`} style={{ width: `${agent.progress}%` }} />
                  <div className={`progress-shimmer ${hoveredAgent === agent.name || agent.progress > 0 ? 'progress-shimmer-active' : ''}`} />
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
                        <h3 className="text-lg font-semibold mb-1">
                          {activeAgent.name === 'CORE' ? 'Technical Audit Log' : 'Performance Trajectory'}
                        </h3>
                        <p className="text-sm text-[#8892A4] mb-4">
                          {activeAgent.name === 'CORE' 
                            ? 'Recent technical fixes and agent actions'
                            : 'Awaiting data from first completed agent cycles'}
                        </p>
                        {activeAgent.name === 'CORE' ? (
                          <>
                            {activeAgent.last_error && (
                              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <div className="text-xs text-red-400 mb-1">Last Error</div>
                                <div className="text-sm text-red-300">{activeAgent.last_error}</div>
                              </div>
                            )}
                            {loadingAuditLogs ? (
                              <div className="h-[320px] rounded-lg border border-[#1E2130] bg-[#0E1016] flex items-center justify-center text-sm text-[#8892A4]">
                                Loading audit logs...
                              </div>
                            ) : auditLogs.length === 0 ? (
                              <div className="h-[320px] rounded-lg border border-[#1E2130] bg-[#0E1016] flex items-center justify-center text-sm text-[#8892A4]">
                                No audit logs found
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                                {auditLogs.map((log) => (
                                  <div key={log.id} className="p-3 bg-[#0E1016] rounded-lg border border-[#1E2130]">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs text-[#8892A4]">{log.table_name}</span>
                                      <span className="text-xs text-[#8892A4]">
                                        {new Date(log.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="text-sm text-white mb-1">
                                      <span className="text-[#7F77DD] font-semibold">{log.action}</span>: {log.record_id}
                                    </div>
                                    {log.new_values && typeof log.new_values === 'object' && (
                                      <div className="text-xs text-[#8892A4] mt-2">
                                        {JSON.stringify(log.new_values).slice(0, 100)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : isInitializing ? (
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
