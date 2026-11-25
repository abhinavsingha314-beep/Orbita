import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  increment,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { AgentId, AgentStatus, SupportedModel } from '../shared/agents';
import type { PlanId } from '../shared/plans';

export const BOOTSTRAP_ADMIN_EMAIL = 'abhinavsingha369@gmail.com';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  plan: PlanId;
  status: 'active' | 'suspended';
  company?: string;
  jobTitle?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AgentConfigDoc {
  agentId: AgentId;
  name: string;
  role: string;
  description: string;
  systemInstructions: string;
  status: AgentStatus;
  model: SupportedModel;
  updatedAt?: Timestamp;
}

export interface ConversationDoc {
  conversationId: string;
  userId: string;
  agentId: AgentId;
  title: string;
  archived: boolean;
  messageCount: number;
  lastMessagePreview: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MessageDoc {
  messageId: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  createdAt?: Timestamp;
}

export interface SavedOutputDoc {
  outputId: string;
  userId: string;
  agentId: AgentId;
  title: string;
  content: string;
  conversationId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UsageRecordDoc {
  usageId: string;
  userId: string;
  agentId: AgentId;
  date: string;
  month: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  updatedAt?: Timestamp;
}

export interface PromptTemplateDoc {
  templateId: string;
  userId: string;
  isPublic: boolean;
  category: AgentId;
  title: string;
  description: string;
  promptContent: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FavoritePromptDoc {
  favoriteId: string;
  userId: string;
  templateId: string;
  createdAt?: Timestamp;
}

export interface FeedbackDoc {
  feedbackId: string;
  userId: string;
  userEmail: string;
  feedbackType: 'bug' | 'feature' | 'agent_quality' | 'general';
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

function clampStr(value: string | undefined | null, max: number, fallback = ''): string {
  const s = (value ?? fallback).trim();
  return s.length > max ? s.slice(0, max) : s;
}

export function generateSafeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function getTodayKey(): { date: string; month: string } {
  const now = new Date();
  const year = now.getFullYear();
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return {
    date: `${year}-${monthNum}-${day}`,
    month: `${year}-${monthNum}`,
  };
}

// Users
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function ensureUserProfile(user: User, preferredName?: string): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const email = clampStr(user.email, 254, 'user@orbita.ai');
  const isBootstrapAdmin =
    email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && user.emailVerified;

  const displayName = clampStr(preferredName || user.displayName || email.split('@')[0], 120, 'ORBITA User');
  const payload: Record<string, unknown> = {
    uid: user.uid,
    name: displayName,
    email,
    role: isBootstrapAdmin ? 'admin' : 'user',
    plan: isBootstrapAdmin ? 'enterprise' : 'free',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (user.photoURL) {
    payload.photoURL = clampStr(user.photoURL, 512);
  }

  try {
    await setDoc(doc(db, 'users', user.uid), payload);
    const created = await getUserProfile(user.uid);
    if (!created) throw new Error('Failed to load created user profile.');
    return created;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateUserProfileDetails(
  uid: string,
  updates: { name: string; company?: string; jobTitle?: string; photoURL?: string },
): Promise<void> {
  const path = `users/${uid}`;
  const payload: Record<string, unknown> = {
    name: clampStr(updates.name, 120, 'ORBITA User'),
    updatedAt: serverTimestamp(),
  };
  if (updates.company !== undefined) payload.company = clampStr(updates.company, 120);
  if (updates.jobTitle !== undefined) payload.jobTitle = clampStr(updates.jobTitle, 120);
  if (updates.photoURL !== undefined && updates.photoURL.trim().length > 0) {
    payload.photoURL = clampStr(updates.photoURL, 512);
  }

  try {
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Conversations & Messages
export async function listUserConversations(uid: string, agentFilter?: AgentId): Promise<ConversationDoc[]> {
  const path = 'conversations';
  try {
    const constraints = [
      where('userId', '==', uid),
      orderBy('updatedAt', 'desc'),
      limit(100),
    ];
    const q = agentFilter
      ? query(
          collection(db, 'conversations'),
          where('userId', '==', uid),
          where('agentId', '==', agentFilter),
          orderBy('updatedAt', 'desc'),
          limit(60),
        )
      : query(collection(db, 'conversations'), ...constraints);

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ConversationDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createConversation(
  uid: string,
  agentId: AgentId,
  title: string,
  preview = '',
): Promise<ConversationDoc> {
  const conversationId = generateSafeId('conv');
  const path = `conversations/${conversationId}`;
  const data = {
    conversationId,
    userId: uid,
    agentId,
    title: clampStr(title, 160, 'New Conversation'),
    archived: false,
    messageCount: 0,
    lastMessagePreview: clampStr(preview, 240),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'conversations', conversationId), data);
    const created = await getDoc(doc(db, 'conversations', conversationId));
    return created.data() as ConversationDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateConversationMeta(
  conversationId: string,
  updates: Partial<Pick<ConversationDoc, 'title' | 'archived' | 'messageCount' | 'lastMessagePreview'>>,
): Promise<void> {
  const path = `conversations/${conversationId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.title !== undefined) payload.title = clampStr(updates.title, 160, 'Untitled Conversation');
  if (updates.archived !== undefined) payload.archived = Boolean(updates.archived);
  if (updates.messageCount !== undefined) payload.messageCount = Math.max(0, Math.floor(updates.messageCount));
  if (updates.lastMessagePreview !== undefined) {
    payload.lastMessagePreview = clampStr(updates.lastMessagePreview, 240);
  }

  try {
    await updateDoc(doc(db, 'conversations', conversationId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function listConversationMessages(conversationId: string, uid: string): Promise<MessageDoc[]> {
  const path = `conversations/${conversationId}/messages`;
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('userId', '==', uid),
      orderBy('createdAt', 'asc'),
      limit(200),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as MessageDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function addConversationMessage(params: {
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}): Promise<MessageDoc> {
  const messageId = generateSafeId('msg');
  const path = `conversations/${params.conversationId}/messages/${messageId}`;
  const payload = {
    messageId,
    conversationId: params.conversationId,
    userId: params.userId,
    role: params.role,
    content: clampStr(params.content, 32000, '...'),
    inputTokens: Math.max(0, Math.floor(params.inputTokens)),
    outputTokens: Math.max(0, Math.floor(params.outputTokens)),
    model: clampStr(params.model, 64, 'gemini-4-hydrogen'),
    createdAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'conversations', params.conversationId, 'messages', messageId), payload);
    const snap = await getDoc(doc(db, 'conversations', params.conversationId, 'messages', messageId));
    return snap.data() as MessageDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteConversationMessage(conversationId: string, messageId: string): Promise<void> {
  const path = `conversations/${conversationId}/messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function deleteConversationWithMessages(conversationId: string, uid: string): Promise<void> {
  const path = `conversations/${conversationId}`;
  try {
    const msgs = await listConversationMessages(conversationId, uid);
    for (const msg of msgs) {
      await deleteDoc(doc(db, 'conversations', conversationId, 'messages', msg.messageId));
    }
    await deleteDoc(doc(db, 'conversations', conversationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Saved Outputs
export async function listSavedOutputs(uid: string): Promise<SavedOutputDoc[]> {
  const path = 'savedOutputs';
  try {
    const q = query(
      collection(db, 'savedOutputs'),
      where('userId', '==', uid),
      orderBy('updatedAt', 'desc'),
      limit(150),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedOutputDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createSavedOutput(params: {
  userId: string;
  agentId: AgentId;
  title: string;
  content: string;
  conversationId?: string;
}): Promise<SavedOutputDoc> {
  const outputId = generateSafeId('out');
  const path = `savedOutputs/${outputId}`;
  const payload: Record<string, unknown> = {
    outputId,
    userId: params.userId,
    agentId: params.agentId,
    title: clampStr(params.title, 160, 'Saved AI Output'),
    content: clampStr(params.content, 32000, ''),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (params.conversationId) {
    payload.conversationId = clampStr(params.conversationId, 128);
  }

  try {
    await setDoc(doc(db, 'savedOutputs', outputId), payload);
    const snap = await getDoc(doc(db, 'savedOutputs', outputId));
    return snap.data() as SavedOutputDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateSavedOutput(
  outputId: string,
  updates: { title?: string; content?: string },
): Promise<void> {
  const path = `savedOutputs/${outputId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.title !== undefined) payload.title = clampStr(updates.title, 160, 'Saved AI Output');
  if (updates.content !== undefined) payload.content = clampStr(updates.content, 32000, '');
  try {
    await updateDoc(doc(db, 'savedOutputs', outputId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteSavedOutput(outputId: string): Promise<void> {
  const path = `savedOutputs/${outputId}`;
  try {
    await deleteDoc(doc(db, 'savedOutputs', outputId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Usage Analytics
export async function listUserUsage(uid: string): Promise<UsageRecordDoc[]> {
  const path = 'usage';
  try {
    const q = query(collection(db, 'usage'), where('userId', '==', uid), limit(180));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UsageRecordDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function recordAgentUsage(
  uid: string,
  agentId: AgentId,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const { date, month } = getTodayKey();
  const usageId = `${uid}_${date}_${agentId}`;
  const path = `usage/${usageId}`;
  const ref = doc(db, 'usage', usageId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        usageId,
        userId: uid,
        agentId,
        date,
        month,
        requestCount: 1,
        inputTokens: Math.max(0, Math.floor(inputTokens)),
        outputTokens: Math.max(0, Math.floor(outputTokens)),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        requestCount: increment(1),
        inputTokens: increment(Math.max(0, Math.floor(inputTokens))),
        outputTokens: increment(Math.max(0, Math.floor(outputTokens))),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Prompt Templates & Favorites
export async function listPromptTemplates(uid: string): Promise<PromptTemplateDoc[]> {
  const path = 'promptTemplates';
  try {
    const [publicSnap, userSnap] = await Promise.all([
      getDocs(query(collection(db, 'promptTemplates'), where('isPublic', '==', true), limit(100))),
      getDocs(query(collection(db, 'promptTemplates'), where('userId', '==', uid), limit(100))),
    ]);
    const map = new Map<string, PromptTemplateDoc>();
    for (const d of publicSnap.docs) {
      const data = d.data() as PromptTemplateDoc;
      map.set(data.templateId, data);
    }
    for (const d of userSnap.docs) {
      const data = d.data() as PromptTemplateDoc;
      map.set(data.templateId, data);
    }
    return Array.from(map.values());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createCustomPromptTemplate(params: {
  userId: string;
  category: AgentId;
  title: string;
  description: string;
  promptContent: string;
}): Promise<PromptTemplateDoc> {
  const templateId = generateSafeId('tpl');
  const path = `promptTemplates/${templateId}`;
  const payload = {
    templateId,
    userId: params.userId,
    isPublic: false,
    category: params.category,
    title: clampStr(params.title, 140, 'Custom Prompt'),
    description: clampStr(params.description, 300, 'Custom workflow prompt'),
    promptContent: clampStr(params.promptContent, 4000, ''),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'promptTemplates', templateId), payload);
    const snap = await getDoc(doc(db, 'promptTemplates', templateId));
    return snap.data() as PromptTemplateDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deletePromptTemplate(templateId: string): Promise<void> {
  const path = `promptTemplates/${templateId}`;
  try {
    await deleteDoc(doc(db, 'promptTemplates', templateId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function listFavoritePromptIds(uid: string): Promise<string[]> {
  const path = 'favoritePrompts';
  try {
    const q = query(collection(db, 'favoritePrompts'), where('userId', '==', uid), limit(200));
    const snap = await getDocs(q);
    return snap.docs.map((d) => (d.data() as FavoritePromptDoc).templateId);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function setPromptFavorite(uid: string, templateId: string, favorite: boolean): Promise<void> {
  const favoriteId = `${uid}_${templateId}`.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  const path = `favoritePrompts/${favoriteId}`;
  try {
    if (favorite) {
      await setDoc(doc(db, 'favoritePrompts', favoriteId), {
        favoriteId,
        userId: uid,
        templateId,
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(doc(db, 'favoritePrompts', favoriteId));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Agent Configs (Admin overrides)
export async function listAgentConfigs(): Promise<Record<string, AgentConfigDoc>> {
  const path = 'agents';
  try {
    const q = query(
      collection(db, 'agents'),
      where('status', 'in', ['active', 'maintenance', 'disabled']),
      limit(20),
    );
    const snap = await getDocs(q);
    const map: Record<string, AgentConfigDoc> = {};
    for (const d of snap.docs) {
      const data = d.data() as AgentConfigDoc;
      map[data.agentId] = data;
    }
    return map;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function adminUpsertAgentConfig(config: Omit<AgentConfigDoc, 'updatedAt'>): Promise<void> {
  const path = `agents/${config.agentId}`;
  const payload = {
    agentId: config.agentId,
    name: clampStr(config.name, 80),
    role: clampStr(config.role, 120),
    description: clampStr(config.description, 500),
    systemInstructions: clampStr(config.systemInstructions, 4000),
    status: config.status,
    model: config.model,
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'agents', config.agentId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Feedback
export async function listUserFeedback(uid: string): Promise<FeedbackDoc[]> {
  const path = 'feedback';
  try {
    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FeedbackDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createFeedback(params: {
  userId: string;
  userEmail: string;
  feedbackType: 'bug' | 'feature' | 'agent_quality' | 'general';
  subject: string;
  message: string;
}): Promise<FeedbackDoc> {
  const feedbackId = generateSafeId('fb');
  const path = `feedback/${feedbackId}`;
  const payload = {
    feedbackId,
    userId: params.userId,
    userEmail: clampStr(params.userEmail, 254),
    feedbackType: params.feedbackType,
    subject: clampStr(params.subject, 160),
    message: clampStr(params.message, 3000),
    status: 'open' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'feedback', feedbackId), payload);
    const snap = await getDoc(doc(db, 'feedback', feedbackId));
    return snap.data() as FeedbackDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Admin queries & mutations
export async function adminListUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(200)));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function adminUpdateUserAccount(
  uid: string,
  updates: { role: 'user' | 'admin'; plan: PlanId; status: 'active' | 'suspended' },
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      role: updates.role,
      plan: updates.plan,
      status: updates.status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function adminListAllUsage(): Promise<UsageRecordDoc[]> {
  const path = 'usage';
  try {
    const snap = await getDocs(query(collection(db, 'usage'), limit(500)));
    return snap.docs.map((d) => d.data() as UsageRecordDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function adminListAllFeedback(): Promise<FeedbackDoc[]> {
  const path = 'feedback';
  try {
    const snap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(200)));
    return snap.docs.map((d) => d.data() as FeedbackDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function adminUpdateFeedbackStatus(
  feedbackId: string,
  status: 'open' | 'in_review' | 'resolved',
): Promise<void> {
  const path = `feedback/${feedbackId}`;
  try {
    await updateDoc(doc(db, 'feedback', feedbackId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// User-controlled data deletion
export async function deleteAllUserWorkspaceData(uid: string): Promise<void> {
  const convs = await listUserConversations(uid);
  for (const conv of convs) {
    await deleteConversationWithMessages(conv.conversationId, uid);
  }

  const outputs = await listSavedOutputs(uid);
  for (const out of outputs) {
    await deleteSavedOutput(out.outputId);
  }

  const usage = await listUserUsage(uid);
  for (const u of usage) {
    await deleteDoc(doc(db, 'usage', u.usageId));
  }

  const favSnap = await getDocs(query(collection(db, 'favoritePrompts'), where('userId', '==', uid)));
  for (const d of favSnap.docs) {
    await deleteDoc(d.ref);
  }

  const tplSnap = await getDocs(query(collection(db, 'promptTemplates'), where('userId', '==', uid)));
  for (const d of tplSnap.docs) {
    await deleteDoc(d.ref);
  }

  const fbSnap = await getDocs(query(collection(db, 'feedback'), where('userId', '==', uid)));
  for (const d of fbSnap.docs) {
    await deleteDoc(d.ref);
  }

  await deleteDoc(doc(db, 'users', uid));
}
