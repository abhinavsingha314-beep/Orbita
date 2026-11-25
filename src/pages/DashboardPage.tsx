import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Bot,
  History,
  Library,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import {
  listSavedOutputs,
  listUserConversations,
  listUserUsage,
} from '../lib/db';
import type { ConversationDoc, SavedOutputDoc, UsageRecordDoc } from '../lib/db';
import { AGENT_IDS, AGENT_REGISTRY, DEFAULT_PROMPT_LIBRARY } from '../shared/agents';

export function DashboardPage() {
  const {
    firebaseUser,
    userProfile,
    monthlyRequestCount,
    monthlyRequestLimit,
    agentOverrides,
  } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [savedOutputs, setSavedOutputs] = useState<SavedOutputDoc[]>([]);
  const [usage, setUsage] = useState<UsageRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listUserConversations(firebaseUser.uid),
      listSavedOutputs(firebaseUser.uid),
      listUserUsage(firebaseUser.uid),
    ])
      .then(([convs, outs, usg]) => {
        if (cancelled) return;
        setConversations(convs);
        setSavedOutputs(outs);
        setUsage(usg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const totalRequestsAllTime = usage.reduce((acc, u) => acc + (u.requestCount || 0), 0);
  const totalTokensAllTime = usage.reduce(
    (acc, u) => acc + (u.inputTokens || 0) + (u.outputTokens || 0),
    0,
  );
  const recentConversations = conversations.filter((c) => !c.archived).slice(0, 5);
  const recentOutputs = savedOutputs.slice(0, 4);
  const recommendedPrompts = DEFAULT_PROMPT_LIBRARY.slice(0, 4);

  return (
    <AppLayout
      title="Command Center"
      actions={
        <Link
          to="/workspace/sales"
          className="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New AI Task</span>
          <span className="sm:hidden">New</span>
        </Link>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Welcome Header */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#252D40]">
          <div className="space-y-1">
            <p className="text-xs text-[#9CA7BB]">
              {userProfile?.name ? `Signed in as ${userProfile.name}` : 'Command Center'}
              {' · '}
              <span className="capitalize">{userProfile?.plan ?? 'free'} plan</span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
              Welcome to ORBITA AI
            </h2>
            <p className="text-sm sm:text-base text-[#9CA7BB]">
              Your intelligent workforce is ready.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Link
              to="/workspace/sales"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium whitespace-nowrap transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start New Task</span>
            </Link>
            <Link
              to="/workspace"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] rounded-lg bg-[#151C2B] hover:bg-[#1E273B] border border-[#252D40] text-[#F7F8FC] text-xs font-medium whitespace-nowrap transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-[#527CFF]" />
              <span>Explore Agents</span>
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] rounded-lg bg-[#151C2B] hover:bg-[#1E273B] border border-[#252D40] text-[#F7F8FC] text-xs font-medium whitespace-nowrap transition-colors"
            >
              <History className="w-3.5 h-3.5 text-[#8666FF]" />
              <span>Chat History</span>
            </Link>
            <Link
              to="/prompts"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] rounded-lg bg-[#151C2B] hover:bg-[#1E273B] border border-[#252D40] text-[#F7F8FC] text-xs font-medium whitespace-nowrap transition-colors"
            >
              <Library className="w-3.5 h-3.5 text-[#20B981]" />
              <span>Prompt Library</span>
            </Link>
          </div>
        </section>

        {/* A. Real Database-Backed Overview Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 sm:p-5 space-y-1.5">
            <p className="text-xs text-[#9CA7BB]">Active Sessions</p>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#F7F8FC]">
              {loading ? '—' : conversations.length}
            </p>
            <p className="text-xs text-[#9CA7BB]">Persistent agent threads</p>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 sm:p-5 space-y-1.5">
            <p className="text-xs text-[#9CA7BB]">Monthly AI Requests</p>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#F7F8FC]">
              {monthlyRequestCount}
              <span className="text-sm font-normal text-[#9CA7BB]"> / {monthlyRequestLimit}</span>
            </p>
            <p className="text-xs text-[#9CA7BB]">
              {loading ? 'Loading...' : `${totalRequestsAllTime} lifetime requests`}
            </p>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 sm:p-5 space-y-1.5">
            <p className="text-xs text-[#9CA7BB]">Saved Outputs</p>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#F7F8FC]">
              {loading ? '—' : savedOutputs.length}
            </p>
            <p className="text-xs text-[#9CA7BB]">Reusable deliverables</p>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 sm:p-5 space-y-1.5">
            <p className="text-xs text-[#9CA7BB]">Tokens Processed</p>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#F7F8FC]">
              {loading ? '—' : totalTokensAllTime.toLocaleString()}
            </p>
            <p className="text-xs text-[#9CA7BB]">Input + output volume</p>
          </div>
        </section>

        {/* B. AI Workforce (All Six Core Agents) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#F7F8FC]">AI Workforce</h3>
              <p className="text-xs text-[#9CA7BB]">Launch any specialized agent workspace</p>
            </div>
            <Link
              to="/workspace"
              className="text-xs font-medium text-[#527CFF] hover:underline whitespace-nowrap"
            >
              View marketplace
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AGENT_IDS.map((id) => {
              const base = AGENT_REGISTRY[id];
              const override = agentOverrides[id];
              const name = override?.name || base.name;
              const description = override?.description || base.description;
              const status = override?.status || base.status;

              return (
                <div
                  key={id}
                  className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 flex flex-col justify-between gap-4 hover:border-[#527CFF]/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <AgentIconBox agentId={id} size="md" />
                      <span
                        className={`text-xs font-medium ${
                          status === 'active'
                            ? 'text-[#20B981]'
                            : status === 'maintenance'
                              ? 'text-[#F5B942]'
                              : 'text-[#EF5350]'
                        }`}
                      >
                        {status === 'active'
                          ? base.category
                          : status === 'maintenance'
                            ? 'Maintenance'
                            : 'Disabled'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display text-base font-semibold text-[#F7F8FC]">{name}</h4>
                      <p className="text-xs text-[#9CA7BB] mt-1 line-clamp-2">{description}</p>
                    </div>

                    <div className="text-xs text-[#9CA7BB] pt-1">
                      {base.capabilities.slice(0, 3).join(' · ')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/workspace/${id}`)}
                    className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#101522] hover:bg-[#527CFF] border border-[#252D40] hover:border-[#527CFF] text-xs font-medium text-[#F7F8FC] transition-colors cursor-pointer"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* C & E. Recent Activity + Recommended Prompts */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Conversations & Saved Outputs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Recent Conversations</h3>
                <Link to="/history" className="text-xs text-[#527CFF] hover:underline">
                  All history
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-[#101522] animate-pulse" />
                  ))}
                </div>
              ) : recentConversations.length === 0 ? (
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-5 text-center space-y-2">
                  <MessageSquare className="w-5 h-5 text-[#9CA7BB] mx-auto" />
                  <p className="text-sm text-[#F7F8FC]">No conversations yet</p>
                  <p className="text-xs text-[#9CA7BB]">
                    Open any AI agent above to start your first multi-turn task.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#252D40]">
                  {recentConversations.map((conv) => (
                    <Link
                      key={conv.conversationId}
                      to={`/workspace/${conv.agentId}?conv=${conv.conversationId}`}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-[#101522]/60 px-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AgentIconBox agentId={conv.agentId} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F7F8FC] truncate">{conv.title}</p>
                          <p className="text-xs text-[#9CA7BB] truncate">
                            {AGENT_REGISTRY[conv.agentId]?.name} · {conv.messageCount} messages
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#9CA7BB] shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Recent Saved Outputs</h3>
                <Link to="/saved" className="text-xs text-[#527CFF] hover:underline">
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="h-20 rounded-lg bg-[#101522] animate-pulse" />
              ) : recentOutputs.length === 0 ? (
                <div className="rounded-lg bg-[#101522] border border-[#252D40] p-5 text-center space-y-1.5">
                  <Bookmark className="w-5 h-5 text-[#9CA7BB] mx-auto" />
                  <p className="text-sm text-[#F7F8FC]">No saved outputs yet</p>
                  <p className="text-xs text-[#9CA7BB]">
                    Use the Save button on any AI reply to store deliverables here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#252D40]">
                  {recentOutputs.map((out) => (
                    <Link
                      key={out.outputId}
                      to="/saved"
                      className="py-3 flex items-center justify-between gap-3 hover:bg-[#101522]/60 px-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F7F8FC] truncate">{out.title}</p>
                        <p className="text-xs text-[#9CA7BB] truncate">
                          {AGENT_REGISTRY[out.agentId]?.name}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#9CA7BB] shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-5 rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Recommended Prompts</h3>
                <p className="text-xs text-[#9CA7BB]">One-tap starters across your workforce</p>
              </div>
              <Link to="/prompts" className="text-xs text-[#527CFF] hover:underline">
                Library
              </Link>
            </div>

            <div className="space-y-3">
              {recommendedPrompts.map((tpl) => (
                <button
                  key={tpl.templateId}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/workspace/${tpl.category}?prompt=${encodeURIComponent(tpl.promptContent)}`,
                    )
                  }
                  className="w-full text-left rounded-lg bg-[#101522] hover:bg-[#182034] border border-[#252D40] p-3.5 space-y-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#527CFF]">
                      {AGENT_REGISTRY[tpl.category].name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9CA7BB]" />
                  </div>
                  <p className="text-sm font-medium text-[#F7F8FC]">{tpl.title}</p>
                  <p className="text-xs text-[#9CA7BB] line-clamp-2">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
