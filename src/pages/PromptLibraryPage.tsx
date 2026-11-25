import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import {
  createCustomPromptTemplate,
  deletePromptTemplate,
  listFavoritePromptIds,
  listPromptTemplates,
  setPromptFavorite,
} from '../lib/db';
import { AGENT_IDS, AGENT_REGISTRY, DEFAULT_PROMPT_LIBRARY } from '../shared/agents';
import type { AgentId } from '../shared/agents';

interface UnifiedPrompt {
  templateId: string;
  category: AgentId;
  title: string;
  description: string;
  promptContent: string;
  isCustom: boolean;
}

export function PromptLibraryPage() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [customTemplates, setCustomTemplates] = useState<UnifiedPrompt[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<'all' | 'favorites' | 'custom' | AgentId>('all');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<AgentId>('sales');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    Promise.all([
      listPromptTemplates(firebaseUser.uid),
      listFavoritePromptIds(firebaseUser.uid),
    ])
      .then(([tpls, favs]) => {
        setCustomTemplates(
          tpls.map((t) => ({
            templateId: t.templateId,
            category: t.category,
            title: t.title,
            description: t.description,
            promptContent: t.promptContent,
            isCustom: t.userId === firebaseUser.uid && !t.isPublic,
          })),
        );
        setFavoriteIds(favs);
      })
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  const allPrompts = useMemo(() => {
    const map = new Map<string, UnifiedPrompt>();
    for (const seed of DEFAULT_PROMPT_LIBRARY) {
      map.set(seed.templateId, {
        ...seed,
        isCustom: false,
      });
    }
    for (const tpl of customTemplates) {
      map.set(tpl.templateId, tpl);
    }
    return Array.from(map.values());
  }, [customTemplates]);

  const filtered = useMemo(() => {
    return allPrompts.filter((p) => {
      if (filter === 'favorites' && !favoriteIds.includes(p.templateId)) return false;
      if (filter === 'custom' && !p.isCustom) return false;
      if (
        filter !== 'all' &&
        filter !== 'favorites' &&
        filter !== 'custom' &&
        p.category !== filter
      ) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.promptContent.toLowerCase().includes(q)
      );
    });
  }, [allPrompts, filter, favoriteIds, search]);

  const handleToggleFavorite = async (templateId: string) => {
    if (!firebaseUser) return;
    const isFav = favoriteIds.includes(templateId);
    setFavoriteIds((prev) =>
      isFav ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    );
    await setPromptFavorite(firebaseUser.uid, templateId, !isFav);
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const created = await createCustomPromptTemplate({
        userId: firebaseUser.uid,
        category: newCategory,
        title: newTitle,
        description: newDesc,
        promptContent: newContent,
      });
      setCustomTemplates((prev) => [
        {
          templateId: created.templateId,
          category: created.category,
          title: created.title,
          description: created.description,
          promptContent: created.promptContent,
          isCustom: true,
        },
        ...prev,
      ]);
      setModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewContent('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustom = async (templateId: string) => {
    await deletePromptTemplate(templateId);
    setCustomTemplates((prev) => prev.filter((t) => t.templateId !== templateId));
  };

  return (
    <AppLayout
      title="Prompt Library"
      actions={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Prompt</span>
          <span className="sm:hidden">New</span>
        </button>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F8FC]">
              Prompt Library
            </h2>
            <p className="text-sm text-[#9CA7BB] mt-1">
              Launch proven prompt templates or save custom workflows for your team.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#9CA7BB] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full min-h-[42px] rounded-lg bg-[#101522] border border-[#252D40] pl-10 pr-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/60 focus:outline-none focus:border-[#527CFF]"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'custom', label: 'My Prompts' },
            ...AGENT_IDS.map((id) => ({ id, label: AGENT_REGISTRY[id].shortName })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-3.5 min-h-[38px] rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                filter === tab.id
                  ? 'bg-[#527CFF] text-white'
                  : 'bg-[#101522] border border-[#252D40] text-[#9CA7BB] hover:text-[#F7F8FC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-[#151C2B] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-10 text-center space-y-2">
            <p className="text-base font-medium text-[#F7F8FC]">No prompts match this filter</p>
            <p className="text-xs text-[#9CA7BB]">
              Try clearing your search or create a new custom prompt template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tpl) => {
              const isFav = favoriteIds.includes(tpl.templateId);
              return (
                <div
                  key={tpl.templateId}
                  className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AgentIconBox agentId={tpl.category} size="sm" />
                        <span className="text-xs text-[#9CA7BB] truncate">
                          {AGENT_REGISTRY[tpl.category].shortName}
                          {tpl.isCustom ? ' · Custom' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={isFav ? 'Remove favorite' : 'Favorite prompt'}
                          onClick={() => void handleToggleFavorite(tpl.templateId)}
                          className="p-1.5 rounded-lg hover:bg-[#101522] cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFav ? 'text-[#F5B942] fill-[#F5B942]' : 'text-[#9CA7BB]'
                            }`}
                          />
                        </button>
                        {tpl.isCustom && (
                          <button
                            type="button"
                            aria-label="Delete custom prompt"
                            onClick={() => void handleDeleteCustom(tpl.templateId)}
                            className="p-1.5 rounded-lg text-[#9CA7BB] hover:text-[#EF5350] hover:bg-[#101522] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display text-base font-semibold text-[#F7F8FC]">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-[#9CA7BB] mt-1">{tpl.description}</p>
                    </div>

                    <p className="text-xs text-[#E3E7F2] bg-[#101522] border border-[#252D40] rounded-lg p-3 line-clamp-3">
                      {tpl.promptContent}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/workspace/${tpl.category}?prompt=${encodeURIComponent(tpl.promptContent)}`,
                      )
                    }
                    className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#101522] hover:bg-[#527CFF] border border-[#252D40] hover:border-[#527CFF] text-xs font-medium text-[#F7F8FC] transition-colors cursor-pointer"
                  >
                    <span>Use Prompt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Custom Prompt Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#F7F8FC]">
                Create Custom Prompt
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-2 rounded-lg text-[#9CA7BB] hover:text-[#F7F8FC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA7BB]">Target Agent</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AgentId)}
                  className="w-full min-h-[42px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
                >
                  {AGENT_IDS.map((id) => (
                    <option key={id} value={id}>
                      {AGENT_REGISTRY[id].name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA7BB]">Title</label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Weekly Investor Update Draft"
                  className="w-full min-h-[42px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA7BB]">Short Description</label>
                <input
                  type="text"
                  required
                  maxLength={300}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Structured highlights, metrics, and asks."
                  className="w-full min-h-[42px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA7BB]">Prompt Content</label>
                <textarea
                  rows={4}
                  required
                  maxLength={4000}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write a concise update summarizing..."
                  className="w-full rounded-lg bg-[#090B12] border border-[#252D40] p-3 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 min-h-[42px] rounded-lg border border-[#252D40] text-xs font-medium text-[#9CA7BB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 min-h-[42px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
