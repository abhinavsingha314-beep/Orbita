import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Search } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import type { AgentId } from '../shared/agents';

export function AgentMarketplacePage() {
  const { agentOverrides } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<'all' | AgentId>('all');

  const agents = useMemo(() => {
    return AGENT_IDS.map((id) => {
      const base = AGENT_REGISTRY[id];
      const ov = agentOverrides[id];
      return {
        ...base,
        name: ov?.name || base.name,
        role: ov?.role || base.role,
        description: ov?.description || base.description,
        status: ov?.status || base.status,
      };
    }).filter((a) => {
      if (selected !== 'all' && a.agentId !== selected) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [agentOverrides, search, selected]);

  return (
    <AppLayout title="AI Agent Marketplace">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F8FC]">
              Specialized AI Workforce
            </h2>
            <p className="text-sm text-[#9CA7BB] mt-1">
              Select a specialist to launch a dedicated multi-turn workspace.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#9CA7BB] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search capabilities or agents..."
              className="w-full min-h-[42px] rounded-lg bg-[#101522] border border-[#252D40] pl-10 pr-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/60 focus:outline-none focus:border-[#527CFF]"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelected('all')}
            className={`px-3.5 min-h-[38px] rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              selected === 'all'
                ? 'bg-[#527CFF] text-white'
                : 'bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC]'
            }`}
          >
            All Agents
          </button>
          {AGENT_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`px-3.5 min-h-[38px] rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                selected === id
                  ? 'bg-[#527CFF] text-white'
                  : 'bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC]'
              }`}
            >
              {AGENT_REGISTRY[id].shortName}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.agentId}
              className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <AgentIconBox agentId={agent.agentId} size="lg" />
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#F7F8FC]">{agent.name}</h3>
                      <p className="text-xs text-[#527CFF]">{agent.role}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      agent.status === 'active'
                        ? 'text-[#20B981]'
                        : agent.status === 'maintenance'
                          ? 'text-[#F5B942]'
                          : 'text-[#EF5350]'
                    }`}
                  >
                    {agent.status === 'active'
                      ? 'Active'
                      : agent.status === 'maintenance'
                        ? 'Maintenance'
                        : 'Disabled'}
                  </span>
                </div>

                <p className="text-sm text-[#9CA7BB] leading-relaxed">{agent.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-[#252D40]">
                  {agent.capabilities.map((cap) => (
                    <div key={cap} className="flex items-center gap-2 text-xs text-[#E3E7F2]">
                      <Check className="w-3.5 h-3.5 text-[#20B981] shrink-0" />
                      <span className="truncate">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/workspace/${agent.agentId}`)}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <span>Open {agent.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
