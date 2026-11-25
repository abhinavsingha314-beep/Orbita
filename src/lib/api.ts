import { auth } from './firebase';
import type { AgentId, SupportedModel } from '../shared/agents';
import type { PlanId } from '../shared/plans';

export interface StreamAgentParams {
  agentId: AgentId;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemInstructionsOverride?: string;
  model?: SupportedModel;
  plan: PlanId;
  monthlyRequestCount: number;
  onChunk: (partialText: string) => void;
}

export interface AgentReplyResult {
  reply: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to send AI requests.');
  }
  return user.getIdToken();
}

export async function streamAgentResponse(params: StreamAgentParams): Promise<AgentReplyResult> {
  const token = await getIdToken();
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      agentId: params.agentId,
      messages: params.messages,
      systemInstructionsOverride: params.systemInstructionsOverride,
      model: params.model,
      plan: params.plan,
      monthlyRequestCount: params.monthlyRequestCount,
    }),
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Request failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error('Streaming response body unavailable.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let model: string = params.model || 'gemini-4-hydrogen';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const block of lines) {
      const trimmed = block.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice('data:'.length).trim();
      if (!jsonStr) continue;

      const parsed = JSON.parse(jsonStr) as {
        text?: string;
        done?: boolean;
        error?: string;
        inputTokens?: number;
        outputTokens?: number;
        model?: string;
      };

      if (parsed.error) {
        throw new Error(parsed.error);
      }
      if (parsed.text) {
        accumulated += parsed.text;
        params.onChunk(accumulated);
      }
      if (parsed.done) {
        inputTokens = parsed.inputTokens ?? inputTokens;
        outputTokens = parsed.outputTokens ?? outputTokens;
        model = parsed.model ?? model;
      }
    }
  }

  if (!accumulated.trim()) {
    throw new Error('The AI agent did not return any text. Please try again.');
  }

  return {
    reply: accumulated.trim(),
    inputTokens,
    outputTokens,
    model,
  };
}

export async function fetchAdminSystemHealth(role: string): Promise<{
  status: string;
  nodeVersion: string;
  uptimeSeconds: number;
  memoryMb: { rss: number; heapUsed: number };
  geminiConfigured: boolean;
  firebaseProjectId: string;
  activeRateBuckets: number;
  recentInquiriesCount: number;
  timestamp: string;
}> {
  const token = await getIdToken();
  const res = await fetch('/api/admin/system', {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-orbita-admin-role': role,
    },
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data.error as string) || 'Failed to load system status.');
  }
  return data as ReturnType<typeof fetchAdminSystemHealth> extends Promise<infer T> ? T : never;
}

export async function submitContactInquiry(payload: {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
}): Promise<{ ok: boolean; referenceId: string; message: string }> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok?: boolean; referenceId?: string; message?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Could not submit inquiry.');
  }
  return {
    ok: Boolean(data.ok),
    referenceId: data.referenceId || 'INQ',
    message: data.message || 'Submitted successfully.',
  };
}
