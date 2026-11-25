import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import { listUserUsage } from '../lib/db';
import type { UsageRecordDoc } from '../lib/db';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import type { AgentId } from '../shared/agents';

export function AnalyticsPage() {
  const { firebaseUser, userProfile, monthlyRequestCount, monthlyRequestLimit } = useAuth();
  const [usage, setUsage] = useState<UsageRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    listUserUsage(firebaseUser.uid)
      .then((rows) => {
        const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
        setUsage(sorted);
      })
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  const totals = useMemo(() => {
    return usage.reduce(
      (acc, row) => {
        acc.requests += row.requestCount || 0;
        acc.input += row.inputTokens || 0;
        acc.output += row.outputTokens || 0;
        return acc;
      },
      { requests: 0, input: 0, output: 0 },
    );
  }, [usage]);

  const byAgent = useMemo(() => {
    const map: Record<AgentId, { requests: number; tokens: number }> = {
      sales: { requests: 0, tokens: 0 },
      marketing: { requests: 0, tokens: 0 },
      research: { requests: 0, tokens: 0 },
      finance: { requests: 0, tokens: 0 },
      support: { requests: 0, tokens: 0 },
      operations: { requests: 0, tokens: 0 },
    };
    for (const row of usage) {
      if (map[row.agentId]) {
        map[row.agentId].requests += row.requestCount || 0;
        map[row.agentId].tokens += (row.inputTokens || 0) + (row.outputTokens || 0);
      }
    }
    return map;
  }, [usage]);

  const dailyChartData = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const row of usage) {
      dayMap.set(row.date, (dayMap.get(row.date) ?? 0) + (row.requestCount || 0));
    }
    return Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14);
  }, [usage]);

  const maxDaily = Math.max(1, ...dailyChartData.map((d) => d[1]));
  const quotaPct = Math.min(100, Math.round((monthlyRequestCount / Math.max(1, monthlyRequestLimit)) * 100));

  return (
    <AppLayout title="Usage Analytics">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F8FC]">
            Usage &amp; Token Telemetry
          </h2>
          <p className="text-sm text-[#9CA7BB] mt-1">
            Genuine database-backed request volume and token metrics across your six AI agents.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9CA7BB]">
              <span>Monthly Allowance ({userProfile?.plan ?? 'free'})</span>
              <span className="font-mono tabular-nums">{quotaPct}%</span>
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#F7F8FC]">
              {monthlyRequestCount} / {monthlyRequestLimit}
            </p>
            <div className="h-1.5 w-full bg-[#090B12] rounded-full overflow-hidden">
              <div className="h-full bg-[#527CFF]" style={{ width: `${quotaPct}%` }} />
            </div>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-1.5">
            <p className="text-xs text-[#9CA7BB]">Lifetime AI Requests</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#F7F8FC]">
              {loading ? '—' : totals.requests.toLocaleString()}
            </p>
            <p className="text-xs text-[#9CA7BB]">Across all agents</p>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-1.5">
            <p className="text-xs text-[#9CA7BB]">Total Tokens Processed</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#F7F8FC]">
              {loading ? '—' : (totals.input + totals.output).toLocaleString()}
            </p>
            <p className="text-xs text-[#9CA7BB] font-mono tabular-nums">
              {totals.input.toLocaleString()} in · {totals.output.toLocaleString()} out
            </p>
          </div>
        </div>

        {/* Daily Activity Bar Chart */}
        <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-[#F7F8FC]">
            Daily Requests (Recent Active Days)
          </h3>
          {dailyChartData.length === 0 ? (
            <p className="text-sm text-[#9CA7BB] py-6 text-center">
              No request activity recorded yet. Start a conversation with any agent to track usage here.
            </p>
          ) : (
            <div className="flex items-end gap-2 sm:gap-3 h-40 pt-4 overflow-x-auto">
              {dailyChartData.map(([day, count]) => {
                const heightPct = Math.max(8, Math.round((count / maxDaily) * 100));
                return (
                  <div key={day} className="flex-1 min-w-[40px] flex flex-col items-center gap-2 h-full justify-end">
                    <span className="font-mono tabular-nums text-[11px] text-[#9CA7BB]">{count}</span>
                    <div
                      className="w-full max-w-[36px] rounded-t bg-[#527CFF] transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="font-mono tabular-nums text-[10px] text-[#9CA7BB]">
                      {day.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Usage by Agent */}
        <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Breakdown by Agent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENT_IDS.map((id) => {
              const stat = byAgent[id];
              return (
                <div
                  key={id}
                  className="rounded-lg bg-[#101522] border border-[#252D40] p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AgentIconBox agentId={id} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F7F8FC] truncate">
                        {AGENT_REGISTRY[id].shortName}
                      </p>
                      <p className="text-xs text-[#9CA7BB] font-mono tabular-nums">
                        {stat.tokens.toLocaleString()} tokens
                      </p>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums text-base font-semibold text-[#F7F8FC]">
                    {stat.requests}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Usage Log Table */}
        <div className="rounded-xl bg-[#151C2B] border border-[#252D40] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#252D40]">
            <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Usage Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101522] text-[#9CA7BB] border-b border-[#252D40]">
                <tr>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Agent</th>
                  <th className="py-3 px-4 font-medium text-right">Requests</th>
                  <th className="py-3 px-4 font-medium text-right">Input Tokens</th>
                  <th className="py-3 px-4 font-medium text-right">Output Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252D40]">
                {usage.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 px-4 text-center text-[#9CA7BB]">
                      No usage records yet.
                    </td>
                  </tr>
                ) : (
                  usage.slice(0, 30).map((row) => (
                    <tr key={row.usageId} className="hover:bg-[#101522]/50">
                      <td className="py-2.5 px-4 font-mono tabular-nums text-[#F7F8FC]">{row.date}</td>
                      <td className="py-2.5 px-4 text-[#E3E7F2]">{AGENT_REGISTRY[row.agentId]?.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#F7F8FC]">
                        {row.requestCount}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#9CA7BB]">
                        {row.inputTokens.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#9CA7BB]">
                        {row.outputTokens.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
