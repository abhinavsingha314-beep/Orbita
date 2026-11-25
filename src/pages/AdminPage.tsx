import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Check, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import { fetchAdminSystemHealth } from '../lib/api';
import {
  adminListAllFeedback,
  adminListAllUsage,
  adminListUsers,
  adminUpdateFeedbackStatus,
  adminUpdateUserAccount,
  adminUpsertAgentConfig,
} from '../lib/db';
import type { FeedbackDoc, UsageRecordDoc, UserProfile } from '../lib/db';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import type { AgentId, AgentStatus, SupportedModel } from '../shared/agents';
import type { PlanId } from '../shared/plans';

type AdminTab = 'users' | 'agents' | 'usage' | 'system' | 'feedback';

export function AdminPage() {
  const { userProfile, agentOverrides, refreshAgentConfigs } = useAuth();

  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usage, setUsage] = useState<UsageRecordDoc[]>([]);
  const [feedback, setFeedback] = useState<FeedbackDoc[]>([]);
  const [systemHealth, setSystemHealth] = useState<Awaited<ReturnType<typeof fetchAdminSystemHealth>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Agent editing state
  const [editingAgentId, setEditingAgentId] = useState<AgentId>('sales');
  const [agentForm, setAgentForm] = useState({
    name: AGENT_REGISTRY.sales.name,
    role: AGENT_REGISTRY.sales.role,
    description: AGENT_REGISTRY.sales.description,
    systemInstructions: AGENT_REGISTRY.sales.systemInstructions,
    status: AGENT_REGISTRY.sales.status as AgentStatus,
    model: AGENT_REGISTRY.sales.model as SupportedModel,
  });

  useEffect(() => {
    const base = AGENT_REGISTRY[editingAgentId];
    const ov = agentOverrides[editingAgentId];
    setAgentForm({
      name: ov?.name || base.name,
      role: ov?.role || base.role,
      description: ov?.description || base.description,
      systemInstructions: ov?.systemInstructions || base.systemInstructions,
      status: ov?.status || base.status,
      model: ov?.model || base.model,
    });
  }, [editingAgentId, agentOverrides]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [uList, usgList, fbList, sys] = await Promise.all([
        adminListUsers(),
        adminListAllUsage(),
        adminListAllFeedback(),
        fetchAdminSystemHealth(userProfile?.role || 'admin').catch(() => null),
      ]);
      setUsers(uList);
      setUsage(usgList);
      setFeedback(fbList);
      setSystemHealth(sys);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.role]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const totalRequests = usage.reduce((acc, r) => acc + (r.requestCount || 0), 0);
  const totalTokens = usage.reduce((acc, r) => acc + (r.inputTokens || 0) + (r.outputTokens || 0), 0);
  const openFeedbackCount = feedback.filter((f) => f.status !== 'resolved').length;

  const handleUserChange = async (
    u: UserProfile,
    updates: { role?: 'user' | 'admin'; plan?: PlanId; status?: 'active' | 'suspended' },
  ) => {
    const next = {
      role: updates.role ?? u.role,
      plan: updates.plan ?? u.plan,
      status: updates.status ?? u.status,
    };
    await adminUpdateUserAccount(u.uid, next);
    setUsers((prev) => prev.map((row) => (row.uid === u.uid ? { ...row, ...next } : row)));
    setNotice(`Updated account settings for ${u.email}.`);
  };

  const handleSaveAgent = async () => {
    await adminUpsertAgentConfig({
      agentId: editingAgentId,
      ...agentForm,
    });
    await refreshAgentConfigs();
    setNotice(`Saved configuration for ${agentForm.name}.`);
  };

  const handleFeedbackStatus = async (
    feedbackId: string,
    status: 'open' | 'in_review' | 'resolved',
  ) => {
    await adminUpdateFeedbackStatus(feedbackId, status);
    setFeedback((prev) => prev.map((f) => (f.feedbackId === feedbackId ? { ...f, status } : f)));
  };

  return (
    <AppLayout
      title="Admin Console"
      actions={
        <button
          type="button"
          onClick={() => void loadAdminData()}
          className="min-h-[38px] px-3 rounded-lg border border-[#252D40] bg-[#101522] text-xs font-medium text-[#F7F8FC] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#151C2B] border border-[#252D40] flex items-center justify-center text-[#8666FF]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#F7F8FC]">
                Platform Administration
              </h2>
              <p className="text-xs text-[#9CA7BB]">
                Server-verified admin governance for users, agents, usage, system health, and feedback.
              </p>
            </div>
          </div>
        </div>

        {notice && (
          <div className="rounded-lg bg-[#20B981]/10 border border-[#20B981]/40 px-4 py-2.5 flex items-center justify-between text-xs text-[#20B981]">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {notice}
            </span>
            <button type="button" onClick={() => setNotice(null)} className="hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Overview KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 space-y-1">
            <p className="text-xs text-[#9CA7BB]">Registered Users</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#F7F8FC]">
              {loading ? '—' : users.length}
            </p>
          </div>
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 space-y-1">
            <p className="text-xs text-[#9CA7BB]">Total AI Requests</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#F7F8FC]">
              {loading ? '—' : totalRequests.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 space-y-1">
            <p className="text-xs text-[#9CA7BB]">Total Tokens</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#F7F8FC]">
              {loading ? '—' : totalTokens.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 space-y-1">
            <p className="text-xs text-[#9CA7BB]">Open Feedback</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#F7F8FC]">
              {loading ? '—' : openFeedbackCount}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'users', label: 'Users' },
            { id: 'agents', label: 'Agent Config' },
            { id: 'usage', label: 'Usage Overview' },
            { id: 'system', label: 'System Health' },
            { id: 'feedback', label: 'Feedback' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as AdminTab)}
              className={`px-4 min-h-[40px] rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                tab === item.id
                  ? 'bg-[#527CFF] text-white'
                  : 'bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Users */}
        {tab === 'users' && (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] overflow-hidden">
            <div className="p-4 border-b border-[#252D40] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-[#F7F8FC]">User Accounts</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#9CA7BB] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter by name or email..."
                  className="w-full min-h-[38px] rounded-lg bg-[#090B12] border border-[#252D40] pl-9 pr-3 text-xs text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#101522] text-[#9CA7BB] border-b border-[#252D40]">
                  <tr>
                    <th className="py-3 px-4 font-medium">User</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252D40]">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-[#101522]/40">
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#F7F8FC]">{u.name}</p>
                        <p className="text-[#9CA7BB]">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Plan for ${u.email}`}
                          value={u.plan}
                          onChange={(e) =>
                            void handleUserChange(u, { plan: e.target.value as PlanId })
                          }
                          className="min-h-[34px] rounded bg-[#090B12] border border-[#252D40] px-2 text-xs text-[#F7F8FC]"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Role for ${u.email}`}
                          value={u.role}
                          onChange={(e) =>
                            void handleUserChange(u, { role: e.target.value as 'user' | 'admin' })
                          }
                          className="min-h-[34px] rounded bg-[#090B12] border border-[#252D40] px-2 text-xs text-[#F7F8FC]"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Status for ${u.email}`}
                          value={u.status}
                          onChange={(e) =>
                            void handleUserChange(u, {
                              status: e.target.value as 'active' | 'suspended',
                            })
                          }
                          className="min-h-[34px] rounded bg-[#090B12] border border-[#252D40] px-2 text-xs text-[#F7F8FC]"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Agent Config */}
        {tab === 'agents' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-2">
              {AGENT_IDS.map((id) => {
                const active = editingAgentId === id;
                const ov = agentOverrides[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEditingAgentId(id)}
                    className={`w-full rounded-xl p-4 border text-left flex items-center justify-between gap-3 cursor-pointer ${
                      active
                        ? 'bg-[#151C2B] border-[#527CFF]'
                        : 'bg-[#101522] border-[#252D40] hover:bg-[#151C2B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AgentIconBox agentId={id} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-[#F7F8FC]">
                          {ov?.name || AGENT_REGISTRY[id].name}
                        </p>
                        <p className="text-xs text-[#9CA7BB] capitalize">
                          {ov?.status || AGENT_REGISTRY[id].status}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-4">
              <h3 className="font-display text-base font-semibold text-[#F7F8FC]">
                Configure {AGENT_REGISTRY[editingAgentId].name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9CA7BB]">Display Name</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={agentForm.name}
                    onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full min-h-[42px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9CA7BB]">Role Subtitle</label>
                  <input
                    type="text"
                    maxLength={120}
                    value={agentForm.role}
                    onChange={(e) => setAgentForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full min-h-[42px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9CA7BB]">Operational Status</label>
                  <select
                    value={agentForm.status}
                    onChange={(e) =>
                      setAgentForm((f) => ({ ...f, status: e.target.value as AgentStatus }))
                    }
                    className="w-full min-h-[42px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC]"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9CA7BB]">Gemini Model</label>
                  <select
                    value={agentForm.model}
                    onChange={(e) =>
                      setAgentForm((f) => ({ ...f, model: e.target.value as SupportedModel }))
                    }
                    className="w-full min-h-[42px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC]"
                  >
                    <option value="gemini-4-hydrogen">gemini-4-hydrogen (Balanced)</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA7BB]">Description</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={agentForm.description}
                  onChange={(e) => setAgentForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg bg-[#090B12] border border-[#252D40] p-3 text-sm text-[#F7F8FC]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA7BB]">System Instructions</label>
                <textarea
                  rows={7}
                  maxLength={4000}
                  value={agentForm.systemInstructions}
                  onChange={(e) =>
                    setAgentForm((f) => ({ ...f, systemInstructions: e.target.value }))
                  }
                  className="w-full rounded-lg bg-[#090B12] border border-[#252D40] p-3 text-xs font-mono text-[#F7F8FC]"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSaveAgent()}
                className="px-5 min-h-[42px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium cursor-pointer"
              >
                Save Agent Configuration
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Usage Overview */}
        {tab === 'usage' && (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#252D40]">
              <h3 className="font-display text-base font-semibold text-[#F7F8FC]">
                Aggregate Platform Usage
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#101522] text-[#9CA7BB] border-b border-[#252D40]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">User ID</th>
                    <th className="py-3 px-4 font-medium">Agent</th>
                    <th className="py-3 px-4 font-medium text-right">Requests</th>
                    <th className="py-3 px-4 font-medium text-right">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252D40]">
                  {usage.slice(0, 50).map((r) => (
                    <tr key={r.usageId}>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-[#F7F8FC]">{r.date}</td>
                      <td className="py-2.5 px-4 font-mono text-[#9CA7BB]">{r.userId.slice(0, 14)}...</td>
                      <td className="py-2.5 px-4 text-[#E3E7F2]">{AGENT_REGISTRY[r.agentId]?.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#F7F8FC]">
                        {r.requestCount}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#9CA7BB]">
                        {(r.inputTokens + r.outputTokens).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: System Health */}
        {tab === 'system' && (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-[#20B981]" />
              <h3 className="font-display text-base font-semibold text-[#F7F8FC]">
                Server &amp; Integration Health
              </h3>
            </div>

            {!systemHealth ? (
              <p className="text-sm text-[#9CA7BB]">
                Unable to load live server diagnostics right now.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-4 space-y-1">
                  <p className="text-[#9CA7BB]">API Server Status</p>
                  <p className="text-base font-semibold text-[#20B981] capitalize">
                    {systemHealth.status}
                  </p>
                </div>
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-4 space-y-1">
                  <p className="text-[#9CA7BB]">Gemini API Configuration</p>
                  <p
                    className={`text-base font-semibold ${
                      systemHealth.geminiConfigured ? 'text-[#20B981]' : 'text-[#F5B942]'
                    }`}
                  >
                    {systemHealth.geminiConfigured ? 'Configured (Server-Side)' : 'Missing GEMINI_API_KEY'}
                  </p>
                </div>
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-4 space-y-1">
                  <p className="text-[#9CA7BB]">Server Uptime</p>
                  <p className="font-mono tabular-nums text-base font-semibold text-[#F7F8FC]">
                    {systemHealth.uptimeSeconds}s
                  </p>
                </div>
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-4 space-y-1">
                  <p className="text-[#9CA7BB]">Memory (RSS / Heap)</p>
                  <p className="font-mono tabular-nums text-base font-semibold text-[#F7F8FC]">
                    {systemHealth.memoryMb.rss} MB / {systemHealth.memoryMb.heapUsed} MB
                  </p>
                </div>
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-4 space-y-1">
                  <p className="text-[#9CA7BB]">Node Runtime</p>
                  <p className="font-mono text-base font-semibold text-[#F7F8FC]">
                    {systemHealth.nodeVersion}
                  </p>
                </div>
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-4 space-y-1">
                  <p className="text-[#9CA7BB]">Firebase Project</p>
                  <p className="font-mono text-sm font-semibold text-[#F7F8FC] truncate">
                    {systemHealth.firebaseProjectId}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Feedback */}
        {tab === 'feedback' && (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-4">
            <h3 className="font-display text-base font-semibold text-[#F7F8FC]">
              User Feedback Queue
            </h3>
            {feedback.length === 0 ? (
              <p className="text-sm text-[#9CA7BB] py-6 text-center">No feedback items submitted yet.</p>
            ) : (
              <div className="divide-y divide-[#252D40]">
                {feedback.map((fb) => (
                  <div
                    key={fb.feedbackId}
                    className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#9CA7BB]">
                        <span className="capitalize">{fb.feedbackType.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>{fb.userEmail}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#F7F8FC]">{fb.subject}</p>
                      <p className="text-xs text-[#9CA7BB] leading-relaxed">{fb.message}</p>
                    </div>
                    <select
                      aria-label={`Feedback status for ${fb.subject}`}
                      value={fb.status}
                      onChange={(e) =>
                        void handleFeedbackStatus(
                          fb.feedbackId,
                          e.target.value as 'open' | 'in_review' | 'resolved',
                        )
                      }
                      className="min-h-[38px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-xs text-[#F7F8FC] shrink-0"
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
