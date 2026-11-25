import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Edit3,
  MessageSquare,
  Search,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteConversationWithMessages,
  listUserConversations,
  updateConversationMeta,
} from '../lib/db';
import type { ConversationDoc } from '../lib/db';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import type { AgentId } from '../shared/agents';

export function HistoryPage() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<'all' | AgentId>('all');
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    listUserConversations(firebaseUser.uid)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (viewMode === 'active' && c.archived) return false;
      if (viewMode === 'archived' && !c.archived) return false;
      if (agentFilter !== 'all' && c.agentId !== agentFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q) ||
        AGENT_REGISTRY[c.agentId]?.name.toLowerCase().includes(q)
      );
    });
  }, [conversations, viewMode, agentFilter, search]);

  const handleRename = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    await updateConversationMeta(id, { title: trimmed });
    setConversations((prev) =>
      prev.map((c) => (c.conversationId === id ? { ...c, title: trimmed } : c)),
    );
    setEditingId(null);
  };

  const handleToggleArchive = async (conv: ConversationDoc) => {
    const nextArchived = !conv.archived;
    await updateConversationMeta(conv.conversationId, { archived: nextArchived });
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conv.conversationId ? { ...c, archived: nextArchived } : c,
      ),
    );
  };

  const handleDelete = async (id: string) => {
    if (!firebaseUser) return;
    await deleteConversationWithMessages(id, firebaseUser.uid);
    setConversations((prev) => prev.filter((c) => c.conversationId !== id));
  };

  return (
    <AppLayout title="Chat History">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F8FC]">
              Conversation Archive
            </h2>
            <p className="text-sm text-[#9CA7BB] mt-1">
              Search, filter, rename, archive, or resume any previous agent session.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-lg bg-[#101522] border border-[#252D40] self-start">
            <button
              type="button"
              onClick={() => setViewMode('active')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                viewMode === 'active' ? 'bg-[#527CFF] text-white' : 'text-[#9CA7BB]'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setViewMode('archived')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                viewMode === 'archived' ? 'bg-[#527CFF] text-white' : 'text-[#9CA7BB]'
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* Search & Agent Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA7BB] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversation titles or previews..."
              className="w-full min-h-[44px] rounded-lg bg-[#101522] border border-[#252D40] pl-10 pr-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/60 focus:outline-none focus:border-[#527CFF]"
            />
          </div>

          <select
            aria-label="Filter conversations by agent"
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
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-[#151C2B] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-10 text-center space-y-3">
            <MessageSquare className="w-7 h-7 text-[#9CA7BB] mx-auto" />
            <p className="text-base font-medium text-[#F7F8FC]">No conversations found</p>
            <p className="text-xs text-[#9CA7BB]">
              {viewMode === 'archived'
                ? 'Archived conversations will appear here.'
                : 'Start a new conversation with any AI agent from the workspace.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((conv) => (
              <div
                key={conv.conversationId}
                className="rounded-xl bg-[#151C2B] border border-[#252D40] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <AgentIconBox agentId={conv.agentId} size="md" />
                  <div className="min-w-0 flex-1 space-y-1">
                    {editingId === conv.conversationId ? (
                      <input
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => void handleRename(conv.conversationId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleRename(conv.conversationId);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full max-w-md rounded bg-[#090B12] border border-[#527CFF] px-2.5 py-1 text-sm text-[#F7F8FC] focus:outline-none"
                      />
                    ) : (
                      <h3 className="text-sm sm:text-base font-semibold text-[#F7F8FC] truncate">
                        {conv.title}
                      </h3>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA7BB]">
                      <span>{AGENT_REGISTRY[conv.agentId]?.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{conv.messageCount} messages</span>
                    </div>

                    {conv.lastMessagePreview && (
                      <p className="text-xs text-[#9CA7BB]/80 line-clamp-1">
                        {conv.lastMessagePreview}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    title="Rename"
                    aria-label="Rename conversation"
                    onClick={() => {
                      setEditingId(conv.conversationId);
                      setEditTitle(conv.title);
                    }}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title={conv.archived ? 'Restore' : 'Archive'}
                    aria-label={conv.archived ? 'Restore conversation' : 'Archive conversation'}
                    onClick={() => void handleToggleArchive(conv)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC] cursor-pointer"
                  >
                    {conv.archived ? (
                      <ArchiveRestore className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    aria-label="Delete conversation"
                    onClick={() => void handleDelete(conv.conversationId)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#EF5350] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/workspace/${conv.agentId}?conv=${conv.conversationId}`)
                    }
                    className="min-h-[40px] px-3.5 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
