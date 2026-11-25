import { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bookmark, Check, Copy, Edit3, Eye, Search, Trash2, X } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteSavedOutput,
  listSavedOutputs,
  updateSavedOutput,
} from '../lib/db';
import type { SavedOutputDoc } from '../lib/db';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import type { AgentId } from '../shared/agents';

export function SavedOutputsPage() {
  const { firebaseUser } = useAuth();

  const [outputs, setOutputs] = useState<SavedOutputDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<'all' | AgentId>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [viewing, setViewing] = useState<SavedOutputDoc | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    listSavedOutputs(firebaseUser.uid)
      .then(setOutputs)
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  const filtered = useMemo(() => {
    return outputs.filter((o) => {
      if (agentFilter !== 'all' && o.agentId !== agentFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.content.toLowerCase().includes(q) ||
        AGENT_REGISTRY[o.agentId]?.name.toLowerCase().includes(q)
      );
    });
  }, [outputs, agentFilter, search]);

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  };

  const handleRename = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    await updateSavedOutput(id, { title: trimmed });
    setOutputs((prev) => prev.map((o) => (o.outputId === id ? { ...o, title: trimmed } : o)));
    if (viewing?.outputId === id) {
      setViewing((prev) => (prev ? { ...prev, title: trimmed } : null));
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteSavedOutput(id);
    setOutputs((prev) => prev.filter((o) => o.outputId !== id));
    if (viewing?.outputId === id) setViewing(null);
  };

  return (
    <AppLayout title="Saved Outputs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F8FC]">
            Saved Outputs Vault
          </h2>
          <p className="text-sm text-[#9CA7BB] mt-1">
            Access, rename, copy, and manage deliverables saved from your AI agents.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA7BB] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved deliverables..."
              className="w-full min-h-[44px] rounded-lg bg-[#101522] border border-[#252D40] pl-10 pr-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/60 focus:outline-none focus:border-[#527CFF]"
            />
          </div>

          <select
            aria-label="Filter saved outputs by agent"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value as 'all' | AgentId)}
            className="min-h-[44px] rounded-lg bg-[#101522] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
          >
            <option value="all">All Agents</option>
            {AGENT_IDS.map((id) => (
              <option key={id} value={id}>
                {AGENT_REGISTRY[id].name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-[#151C2B] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-10 text-center space-y-3">
            <Bookmark className="w-7 h-7 text-[#9CA7BB] mx-auto" />
            <p className="text-base font-medium text-[#F7F8FC]">No saved outputs yet</p>
            <p className="text-xs text-[#9CA7BB]">
              Click &ldquo;Save Output&rdquo; beneath any AI agent response to keep it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((out) => (
              <div
                key={out.outputId}
                className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AgentIconBox agentId={out.agentId} size="sm" />
                    <div className="min-w-0 flex-1">
                      {editingId === out.outputId ? (
                        <input
                          type="text"
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => void handleRename(out.outputId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleRename(out.outputId);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full rounded bg-[#090B12] border border-[#527CFF] px-2 py-1 text-sm text-[#F7F8FC] focus:outline-none"
                        />
                      ) : (
                        <h3 className="text-sm font-semibold text-[#F7F8FC] truncate">{out.title}</h3>
                      )}
                      <p className="text-xs text-[#9CA7BB] mt-0.5">
                        {AGENT_REGISTRY[out.agentId]?.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#9CA7BB] line-clamp-3 leading-relaxed">
                    {out.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#252D40]">
                  <button
                    type="button"
                    onClick={() => setViewing(out)}
                    className="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-lg bg-[#101522] hover:bg-[#1B2438] border border-[#252D40] text-xs font-medium text-[#F7F8FC] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#527CFF]" />
                    <span>Open</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleCopy(out.outputId, out.content)}
                      className="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-lg bg-[#101522] hover:bg-[#1B2438] border border-[#252D40] text-xs text-[#E3E7F2] cursor-pointer"
                    >
                      {copiedId === out.outputId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#20B981]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#9CA7BB]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label="Rename saved output"
                      onClick={() => {
                        setEditingId(out.outputId);
                        setEditTitle(out.title);
                      }}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete saved output"
                      onClick={() => void handleDelete(out.outputId)}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#EF5350] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Full Output Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[88vh] rounded-xl bg-[#151C2B] border border-[#252D40] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#252D40] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold text-[#F7F8FC] truncate">
                  {viewing.title}
                </h3>
                <p className="text-xs text-[#9CA7BB]">{AGENT_REGISTRY[viewing.agentId]?.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleCopy(viewing.outputId, viewing.content)}
                  className="px-3 min-h-[38px] rounded-lg bg-[#527CFF] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === viewing.outputId ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  aria-label="Close modal"
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto orbita-prose">
              <Markdown remarkPlugins={[remarkGfm]}>{viewing.content}</Markdown>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
