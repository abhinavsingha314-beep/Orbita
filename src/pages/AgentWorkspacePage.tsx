import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  Bookmark,
  Check,
  Copy,
  Edit3,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { useAuth } from '../contexts/AuthContext';
import { streamAgentResponse } from '../lib/api';
import {
  addConversationMessage,
  createConversation,
  createSavedOutput,
  deleteConversationMessage,
  deleteConversationWithMessages,
  listConversationMessages,
  listUserConversations,
  recordAgentUsage,
  updateConversationMeta,
} from '../lib/db';
import type { ConversationDoc, MessageDoc } from '../lib/db';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import type { AgentId } from '../shared/agents';

function formatTimestamp(ts?: { toDate?: () => Date }): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AgentWorkspacePage() {
  const { agentId: paramAgent } = useParams<{ agentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const agentId: AgentId = AGENT_IDS.includes(paramAgent as AgentId)
    ? (paramAgent as AgentId)
    : 'sales';

  const {
    firebaseUser,
    userProfile,
    monthlyRequestCount,
    monthlyRequestLimit,
    agentOverrides,
    refreshUsage,
  } = useAuth();

  const baseAgent = AGENT_REGISTRY[agentId];
  const override = agentOverrides[agentId];
  const agent = useMemo(
    () => ({
      ...baseAgent,
      name: override?.name || baseAgent.name,
      role: override?.role || baseAgent.role,
      description: override?.description || baseAgent.description,
      systemInstructions: override?.systemInstructions || baseAgent.systemInstructions,
      status: override?.status || baseAgent.status,
      model: override?.model || baseAgent.model,
    }),
    [baseAgent, override],
  );

  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(searchParams.get('conv'));
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedMsgIds, setSavedMsgIds] = useState<Record<string, boolean>>({});
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Pre-fill prompt from query parameter (?prompt=...)
  useEffect(() => {
    const prefill = searchParams.get('prompt');
    if (prefill) {
      setInput(prefill);
      const next = new URLSearchParams(searchParams);
      next.delete('prompt');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Sync active conversation ID from URL when navigating
  useEffect(() => {
    const convParam = searchParams.get('conv');
    if (convParam && convParam !== activeConvId) {
      setActiveConvId(convParam);
    }
  }, [searchParams, activeConvId]);

  const loadConversations = useCallback(async () => {
    if (!firebaseUser) return;
    setLoadingConvs(true);
    try {
      const list = await listUserConversations(firebaseUser.uid, agentId);
      setConversations(list.filter((c) => !c.archived));
    } finally {
      setLoadingConvs(false);
    }
  }, [firebaseUser, agentId]);

  useEffect(() => {
    setActiveConvId(searchParams.get('conv'));
    setMessages([]);
    setError(null);
    void loadConversations();
  }, [agentId, loadConversations, searchParams]);

  const loadMessages = useCallback(
    async (convId: string) => {
      if (!firebaseUser) return;
      setLoadingMsgs(true);
      try {
        const list = await listConversationMessages(convId, firebaseUser.uid);
        setMessages(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load conversation messages.');
      } finally {
        setLoadingMsgs(false);
      }
    },
    [firebaseUser],
  );

  useEffect(() => {
    if (activeConvId) {
      void loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingText]);

  const startNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setError(null);
    setMobileDrawerOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('conv');
    setSearchParams(next, { replace: true });
    textareaRef.current?.focus();
  };

  const selectConversation = (convId: string) => {
    setActiveConvId(convId);
    setError(null);
    setMobileDrawerOpen(false);
    setSearchParams({ conv: convId }, { replace: true });
  };

  const handleRenameConversation = async (convId: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingConvId(null);
      return;
    }
    await updateConversationMeta(convId, { title: trimmed });
    setConversations((prev) =>
      prev.map((c) => (c.conversationId === convId ? { ...c, title: trimmed } : c)),
    );
    setEditingConvId(null);
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!firebaseUser) return;
    await deleteConversationWithMessages(convId, firebaseUser.uid);
    setConversations((prev) => prev.filter((c) => c.conversationId !== convId));
    if (activeConvId === convId) {
      startNewConversation();
    }
  };

  const runAiTurn = async (
    convId: string,
    historyForModel: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentCount: number,
  ) => {
    if (!firebaseUser) return;
    setSending(true);
    setStreamingText('');
    setError(null);

    try {
      const result = await streamAgentResponse({
        agentId,
        messages: historyForModel,
        systemInstructionsOverride: override?.systemInstructions,
        model: agent.model,
        plan: userProfile?.plan ?? 'free',
        monthlyRequestCount,
        onChunk: (partial) => setStreamingText(partial),
      });

      const assistantMsg = await addConversationMessage({
        conversationId: convId,
        userId: firebaseUser.uid,
        role: 'assistant',
        content: result.reply,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        model: result.model,
      });

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingText('');

      await Promise.all([
        updateConversationMeta(convId, {
          messageCount: currentCount + 1,
          lastMessagePreview: result.reply.slice(0, 220),
        }),
        recordAgentUsage(firebaseUser.uid, agentId, result.inputTokens, result.outputTokens),
      ]);

      await Promise.all([refreshUsage(), loadConversations()]);
    } catch (err) {
      setStreamingText('');
      setError(err instanceof Error ? err.message : 'Failed to generate response.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (customText?: string) => {
    if (!firebaseUser || sending) return;
    if (agent.status !== 'active') {
      setError(`${agent.name} is currently marked as ${agent.status} by an administrator.`);
      return;
    }

    const promptText = (customText ?? input).trim();
    if (!promptText) return;
    if (promptText.length > 16000) {
      setError('Prompt is too long (maximum 16,000 characters).');
      return;
    }

    if (monthlyRequestCount >= monthlyRequestLimit) {
      setError(
        `You have reached your ${userProfile?.plan ?? 'free'} plan limit (${monthlyRequestLimit} requests this month).`,
      );
      return;
    }

    setError(null);
    if (!customText) setInput('');

    let convId = activeConvId;
    let baseMessageCount = messages.length;

    if (!convId) {
      const title = promptText.slice(0, 72) + (promptText.length > 72 ? '...' : '');
      const created = await createConversation(firebaseUser.uid, agentId, title, promptText.slice(0, 200));
      convId = created.conversationId;
      setActiveConvId(convId);
      setSearchParams({ conv: convId }, { replace: true });
      baseMessageCount = 0;
    }

    const userMsg = await addConversationMessage({
      conversationId: convId,
      userId: firebaseUser.uid,
      role: 'user',
      content: promptText,
      inputTokens: 0,
      outputTokens: 0,
      model: agent.model,
    });

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    await updateConversationMeta(convId, {
      messageCount: baseMessageCount + 1,
      lastMessagePreview: promptText.slice(0, 220),
    });

    const historyForModel = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await runAiTurn(convId, historyForModel, baseMessageCount + 1);
  };

  const handleRegenerate = async () => {
    if (!firebaseUser || !activeConvId || sending || messages.length === 0) return;
    const last = messages[messages.length - 1];
    let trimmedHistory = [...messages];

    if (last.role === 'assistant') {
      await deleteConversationMessage(activeConvId, last.messageId);
      trimmedHistory = messages.slice(0, -1);
      setMessages(trimmedHistory);
    }

    if (trimmedHistory.length === 0 || trimmedHistory[trimmedHistory.length - 1].role !== 'user') {
      setError('Cannot regenerate without a user prompt.');
      return;
    }

    await runAiTurn(
      activeConvId,
      trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
      trimmedHistory.length,
    );
  };

  const handleCopy = async (msgId: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId((prev) => (prev === msgId ? null : prev)), 2000);
  };

  const handleSaveOutput = async (msg: MessageDoc) => {
    if (!firebaseUser) return;
    const firstLine = msg.content.split('\n')[0]?.replace(/^[#*\-\s]+/, '').trim() || agent.name;
    const title = firstLine.slice(0, 90) || `${agent.name} Output`;
    await createSavedOutput({
      userId: firebaseUser.uid,
      agentId,
      title,
      content: msg.content,
      conversationId: activeConvId ?? undefined,
    });
    setSavedMsgIds((prev) => ({ ...prev, [msg.messageId]: true }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const conversationListPanel = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#252D40] space-y-2">
        <button
          type="button"
          onClick={startNewConversation}
          className="w-full min-h-[42px] flex items-center justify-center gap-2 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Quick Agent Switcher */}
        <select
          aria-label="Switch AI agent"
          value={agentId}
          onChange={(e) => navigate(`/workspace/${e.target.value}`)}
          className="w-full min-h-[38px] rounded-lg bg-[#090B12] border border-[#252D40] px-2.5 text-xs text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
        >
          {AGENT_IDS.map((id) => (
            <option key={id} value={id}>
              {AGENT_REGISTRY[id].name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loadingConvs ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-[#151C2B] animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-[#9CA7BB] px-3 py-6 text-center">
            No conversations with {agent.shortName} yet.
          </p>
        ) : (
          conversations.map((conv) => {
            const active = conv.conversationId === activeConvId;
            return (
              <div
                key={conv.conversationId}
                className={`group rounded-lg px-2.5 py-2 flex items-center justify-between gap-2 transition-colors ${
                  active
                    ? 'bg-[#151C2B] border border-[#252D40] text-[#F7F8FC]'
                    : 'text-[#9CA7BB] hover:bg-[#151C2B]/60 hover:text-[#F7F8FC]'
                }`}
              >
                {editingConvId === conv.conversationId ? (
                  <input
                    type="text"
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => void handleRenameConversation(conv.conversationId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleRenameConversation(conv.conversationId);
                      if (e.key === 'Escape') setEditingConvId(null);
                    }}
                    className="flex-1 min-w-0 bg-[#090B12] border border-[#527CFF] rounded px-2 py-1 text-xs text-[#F7F8FC] focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => selectConversation(conv.conversationId)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <p className="text-xs font-medium truncate">{conv.title}</p>
                    <p className="text-[11px] text-[#9CA7BB]/75 truncate">
                      {conv.messageCount} turns
                    </p>
                  </button>
                )}

                <div className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Rename conversation"
                    aria-label="Rename conversation"
                    onClick={() => {
                      setEditingConvId(conv.conversationId);
                      setEditingTitle(conv.title);
                    }}
                    className="p-1.5 rounded hover:bg-[#101522] text-[#9CA7BB] hover:text-[#F7F8FC] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete conversation"
                    aria-label="Delete conversation"
                    onClick={() => void handleDeleteConversation(conv.conversationId)}
                    className="p-1.5 rounded hover:bg-[#101522] text-[#9CA7BB] hover:text-[#EF5350] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <AppLayout
      title={agent.name}
      hideMobilePadding
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden min-h-[38px] px-2.5 rounded-lg border border-[#252D40] bg-[#101522] text-xs font-medium text-[#F7F8FC] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#527CFF]" />
            <span>Chats</span>
          </button>
          <button
            type="button"
            onClick={startNewConversation}
            className="min-h-[38px] px-3 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-3.5rem-3.5rem)] lg:h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Desktop Conversation Sidebar */}
        <aside className="hidden md:block w-[250px] shrink-0 bg-[#101522] border-r border-[#252D40]">
          {conversationListPanel}
        </aside>

        {/* Mobile Conversation Drawer */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
            <div className="w-72 max-w-[85vw] h-full bg-[#101522] border-r border-[#252D40] flex flex-col">
              <div className="h-14 px-4 flex items-center justify-between border-b border-[#252D40]">
                <span className="text-sm font-semibold text-[#F7F8FC]">{agent.shortName} Chats</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close chats drawer"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#9CA7BB]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">{conversationListPanel}</div>
            </div>
            <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
          </div>
        )}

        {/* Workspace Main Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090B12]">
          {/* Compact Agent Header */}
          <div className="px-4 sm:px-6 py-3 bg-[#101522]/60 border-b border-[#252D40] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <AgentIconBox agentId={agentId} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm sm:text-base font-semibold text-[#F7F8FC] truncate">
                    {agent.name}
                  </h2>
                  <span className="hidden sm:inline text-xs text-[#9CA7BB]">· {agent.role}</span>
                </div>
                <p className="text-xs text-[#9CA7BB] truncate">{agent.description}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-[#9CA7BB] shrink-0">
              <span className="font-mono tabular-nums">
                {monthlyRequestCount}/{monthlyRequestLimit} req
              </span>
            </div>
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            {loadingMsgs ? (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="h-16 rounded-xl bg-[#151C2B] animate-pulse" />
                <div className="h-32 rounded-xl bg-[#151C2B] animate-pulse" />
              </div>
            ) : messages.length === 0 && !streamingText ? (
              <div className="max-w-3xl mx-auto space-y-6 py-4">
                <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <AgentIconBox agentId={agentId} size="md" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#F7F8FC]">{agent.name}</h3>
                      <p className="text-xs text-[#9CA7BB]">{agent.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#9CA7BB] leading-relaxed">{agent.description}</p>
                  <div className="text-xs text-[#9CA7BB] pt-2 border-t border-[#252D40]">
                    Capabilities: {agent.capabilities.join(' · ')}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-[#9CA7BB]">Suggested Prompts</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {agent.suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void handleSend(prompt)}
                        className="text-left rounded-xl bg-[#101522] hover:bg-[#151C2B] border border-[#252D40] hover:border-[#527CFF]/60 p-4 text-xs sm:text-sm text-[#E3E7F2] leading-relaxed transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isLastAssistant = !isUser && idx === messages.length - 1 && !sending;
                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`w-full sm:w-auto max-w-full rounded-xl p-4 sm:p-5 ${
                          isUser
                            ? 'sm:max-w-[85%] bg-[#527CFF]/15 border border-[#527CFF]/40 text-[#F7F8FC]'
                            : 'bg-[#151C2B] border border-[#252D40] text-[#F7F8FC]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2 text-[11px] text-[#9CA7BB]">
                          <span className="font-medium text-[#F7F8FC]">
                            {isUser ? userProfile?.name || 'You' : agent.name}
                          </span>
                          <span className="font-mono tabular-nums">
                            {formatTimestamp(msg.createdAt)}
                          </span>
                        </div>

                        {isUser ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        ) : (
                          <div className="orbita-prose">
                            <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                          </div>
                        )}

                        {!isUser && (
                          <div className="mt-4 pt-3 border-t border-[#252D40] flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleCopy(msg.messageId, msg.content)}
                              className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg bg-[#101522] hover:bg-[#1B2438] border border-[#252D40] text-xs text-[#E3E7F2] cursor-pointer"
                            >
                              {copiedId === msg.messageId ? (
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
                              onClick={() => void handleSaveOutput(msg)}
                              disabled={Boolean(savedMsgIds[msg.messageId])}
                              className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg bg-[#101522] hover:bg-[#1B2438] border border-[#252D40] text-xs text-[#E3E7F2] disabled:opacity-75 cursor-pointer"
                            >
                              {savedMsgIds[msg.messageId] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#20B981]" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3.5 h-3.5 text-[#527CFF]" />
                                  <span>Save Output</span>
                                </>
                              )}
                            </button>

                            {isLastAssistant && (
                              <button
                                type="button"
                                onClick={() => void handleRegenerate()}
                                className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg bg-[#101522] hover:bg-[#1B2438] border border-[#252D40] text-xs text-[#E3E7F2] cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-[#8666FF]" />
                                <span>Regenerate</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Live Streaming Bubble */}
                {sending && (
                  <div className="rounded-xl bg-[#151C2B] border border-[#527CFF]/50 p-4 sm:p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#527CFF]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{agent.name} is thinking...</span>
                    </div>
                    {streamingText && (
                      <div className="orbita-prose">
                        <Markdown remarkPlugins={[remarkGfm]}>{streamingText}</Markdown>
                      </div>
                    )}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-4 sm:px-6 pb-2">
              <div className="max-w-3xl mx-auto rounded-lg bg-[#EF5350]/10 border border-[#EF5350]/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-[#EF5350]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-[#EF5350] hover:underline shrink-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="px-3 sm:px-6 py-3 bg-[#101522] border-t border-[#252D40]">
            <div className="max-w-3xl mx-auto space-y-1.5">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${agent.name}...`}
                  disabled={sending || agent.status !== 'active'}
                  className="flex-1 min-h-[48px] max-h-40 rounded-xl bg-[#090B12] border border-[#252D40] px-3.5 py-2.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/60 focus:outline-none focus:border-[#527CFF] resize-y"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !input.trim() || agent.status !== 'active'}
                  aria-label="Send message"
                  className="min-h-[48px] min-w-[48px] px-4 rounded-xl bg-[#527CFF] hover:bg-[#4168E8] disabled:opacity-50 text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#9CA7BB] px-1">
                <span>
                  {agent.status !== 'active'
                    ? `Agent currently in ${agent.status} mode`
                    : 'Enter to send · Shift+Enter for new line'}
                </span>
                <Link to="/prompts" className="text-[#527CFF] hover:underline">
                  Insert from Prompt Library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
