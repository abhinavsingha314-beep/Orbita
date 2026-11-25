import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AGENT_REGISTRY, AGENT_IDS } from './src/shared/agents.ts';
import type { AgentId, SupportedModel } from './src/shared/agents.ts';
import { PLAN_CATALOG } from './src/shared/plans.ts';
import type { PlanId } from './src/shared/plans.ts';

const PORT = Number(process.env.PORT) || 3000;
const BOOTSTRAP_ADMIN_EMAIL = 'abhinavsingha369@gmail.com';
const STARTED_AT = Date.now();

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    return JSON.parse(raw) as FirebaseAppletConfig;
  } catch {
    return { projectId: '' };
  }
}

const firebaseConfig = loadFirebaseConfig();
if (firebaseConfig.projectId && firebaseConfig.projectId !== 'remixed-project-id') {
  if (!getApps().length) {
    initializeApp({ projectId: firebaseConfig.projectId });
  } else {
    getApp();
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Per-user sliding window rate limiter (25 requests / 60s)
const userRateBuckets = new Map<string, number[]>();
const ipRateBuckets = new Map<string, number[]>();

function checkRateLimit(bucketMap: Map<string, number[]>, key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (bucketMap.get(key) ?? []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= maxRequests) {
    bucketMap.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  bucketMap.set(key, timestamps);
  return true;
}

interface AuthenticatedRequest extends Request {
  authUser?: DecodedIdToken;
}

async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token || token.length > 8192) {
    res.status(401).json({ error: 'Invalid authentication token.' });
    return;
  }

  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'remixed-project-id') {
    res.status(503).json({ error: 'Firebase Authentication is not configured yet.' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    if (!decoded.email_verified) {
      res.status(403).json({ error: 'Please verify your email address before running AI agents.' });
      return;
    }
    req.authUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired or is invalid. Please sign in again.' });
  }
}

interface ChatTurnInput {
  role: 'user' | 'assistant';
  content: string;
}

function sanitizeChatHistory(raw: unknown): ChatTurnInput[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: ChatTurnInput[] = [];
  for (const item of raw.slice(-20)) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as Record<string, unknown>).role;
    const content = (item as Record<string, unknown>).content;
    if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.length > 0) {
        cleaned.push({ role, content: trimmed.slice(0, 16000) });
      }
    }
  }
  return cleaned;
}

function resolveModel(requested?: unknown): SupportedModel {
  if (requested === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
  return 'gemini-4-hydrogen';
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw === 'GEMINI_API_KEY_MISSING') {
    return {
      status: 503,
      message:
        'AI engine configuration is incomplete: GEMINI_API_KEY is not configured in the server environment.',
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 502,
      message: 'The configured Gemini API key was rejected. Please verify your GEMINI_API_KEY secret.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Upstream AI quota temporarily reached. Please wait a moment and try again.',
    };
  }
  return {
    status: 500,
    message: 'Unable to generate an AI response right now. Please try again shortly.',
  };
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Public health check
app.get('/api/health', (_req: Request, res: Response) => {
  const keyPresent = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    service: 'orbita-ai-api',
    geminiConfigured: keyPresent,
    firebaseConfigured: Boolean(firebaseConfig.projectId && firebaseConfig.projectId !== 'remixed-project-id'),
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// Public contact form endpoint
const recentInquiries: Array<{ id: string; name: string; email: string; company: string; topic: string; createdAt: string }> = [];

app.post('/api/contact', (req: Request, res: Response) => {
  const ipKey = req.ip || 'unknown';
  if (!checkRateLimit(ipRateBuckets, ipKey, 8, 60_000)) {
    res.status(429).json({ error: 'Too many contact submissions. Please wait a minute and try again.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : 'General Inquiry';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 120) {
    res.status(400).json({ error: 'Please provide your full name (2–120 characters).' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (message.length < 10 || message.length > 3000) {
    res.status(400).json({ error: 'Please enter a message between 10 and 3,000 characters.' });
    return;
  }

  const referenceId = `INQ-${Date.now().toString(36).toUpperCase()}`;
  recentInquiries.unshift({
    id: referenceId,
    name: name.slice(0, 120),
    email: email.slice(0, 254),
    company: company.slice(0, 120),
    topic: topic.slice(0, 80),
    createdAt: new Date().toISOString(),
  });
  if (recentInquiries.length > 50) recentInquiries.length = 50;

  res.status(201).json({
    ok: true,
    referenceId,
    message: 'Your inquiry has been received. Our team will respond via email.',
  });
});

// Authenticated AI Agent non-streaming endpoint
app.post('/api/ai/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.authUser!.uid;
  if (!checkRateLimit(userRateBuckets, uid, 25, 60_000)) {
    res.status(429).json({ error: 'Rate limit exceeded (max 25 requests per minute). Please pause briefly.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const agentId = body.agentId as AgentId;
  if (!AGENT_IDS.includes(agentId)) {
    res.status(400).json({ error: 'Unsupported agent selected.' });
    return;
  }

  const planId = (typeof body.plan === 'string' && body.plan in PLAN_CATALOG ? body.plan : 'free') as PlanId;
  const plan = PLAN_CATALOG[planId];
  const monthlyCount = typeof body.monthlyRequestCount === 'number' && Number.isFinite(body.monthlyRequestCount)
    ? Math.max(0, body.monthlyRequestCount)
    : 0;

  if (monthlyCount >= plan.monthlyRequestLimit) {
    res.status(429).json({
      error: `Monthly request limit (${plan.monthlyRequestLimit} requests on ${plan.name} plan) reached.`,
    });
    return;
  }

  const history = sanitizeChatHistory(body.messages);
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    res.status(400).json({ error: 'A valid user message is required.' });
    return;
  }

  const agent = AGENT_REGISTRY[agentId];
  const customInstruction =
    typeof body.systemInstructionsOverride === 'string' && body.systemInstructionsOverride.trim().length > 0
      ? body.systemInstructionsOverride.trim().slice(0, 4000)
      : agent.systemInstructions;
  const model = resolveModel(body.model ?? agent.model);

  const started = Date.now();
  try {
    const ai = getGeminiClient();
    const contents = history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: customInstruction,
      },
    });

    const reply = (response.text ?? '').trim();
    if (!reply) {
      res.status(502).json({ error: 'The AI model returned an empty response. Please try regenerating.' });
      return;
    }

    const inputText = history.map((t) => t.content).join('\n');
    const inputTokens = response.usageMetadata?.promptTokenCount ?? estimateTokens(inputText);
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? estimateTokens(reply);

    res.json({
      reply,
      inputTokens,
      outputTokens,
      model,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    const mapped = mapGeminiError(err);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

// Authenticated AI Agent SSE streaming endpoint
app.post('/api/ai/stream', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.authUser!.uid;
  if (!checkRateLimit(userRateBuckets, uid, 25, 60_000)) {
    res.status(429).json({ error: 'Rate limit exceeded (max 25 requests per minute). Please pause briefly.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const agentId = body.agentId as AgentId;
  if (!AGENT_IDS.includes(agentId)) {
    res.status(400).json({ error: 'Unsupported agent selected.' });
    return;
  }

  const planId = (typeof body.plan === 'string' && body.plan in PLAN_CATALOG ? body.plan : 'free') as PlanId;
  const plan = PLAN_CATALOG[planId];
  const monthlyCount = typeof body.monthlyRequestCount === 'number' && Number.isFinite(body.monthlyRequestCount)
    ? Math.max(0, body.monthlyRequestCount)
    : 0;

  if (monthlyCount >= plan.monthlyRequestLimit) {
    res.status(429).json({
      error: `Monthly request limit (${plan.monthlyRequestLimit} requests on ${plan.name} plan) reached.`,
    });
    return;
  }

  const history = sanitizeChatHistory(body.messages);
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    res.status(400).json({ error: 'A valid user message is required.' });
    return;
  }

  const agent = AGENT_REGISTRY[agentId];
  const customInstruction =
    typeof body.systemInstructionsOverride === 'string' && body.systemInstructionsOverride.trim().length > 0
      ? body.systemInstructionsOverride.trim().slice(0, 4000)
      : agent.systemInstructions;
  const model = resolveModel(body.model ?? agent.model);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let fullText = '';
  let promptTokens = 0;
  let candidateTokens = 0;

  try {
    const ai = getGeminiClient();
    const contents = history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    }));

    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: customInstruction,
      },
    });

    for await (const chunk of stream) {
      const piece = chunk.text ?? '';
      if (piece) {
        fullText += piece;
        res.write(`data: ${JSON.stringify({ text: piece })}\n\n`);
      }
      if (chunk.usageMetadata) {
        promptTokens = chunk.usageMetadata.promptTokenCount ?? promptTokens;
        candidateTokens = chunk.usageMetadata.candidatesTokenCount ?? candidateTokens;
      }
    }

    const finalInputTokens = promptTokens || estimateTokens(history.map((t) => t.content).join('\n'));
    const finalOutputTokens = candidateTokens || estimateTokens(fullText);

    res.write(
      `data: ${JSON.stringify({
        done: true,
        inputTokens: finalInputTokens,
        outputTokens: finalOutputTokens,
        model,
      })}\n\n`,
    );
    res.end();
  } catch (err) {
    const mapped = mapGeminiError(err);
    res.write(`data: ${JSON.stringify({ error: mapped.message })}\n\n`);
    res.end();
  }
});

// Admin system monitoring endpoint (verified Firebase ID token + admin header/email check)
app.get('/api/admin/system', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userEmail = req.authUser?.email?.toLowerCase();
  const isBootstrapAdmin = userEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && req.authUser?.email_verified === true;
  if (!isBootstrapAdmin && req.headers['x-orbita-admin-role'] !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required.' });
    return;
  }

  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
    memoryMb: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    },
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    firebaseProjectId: firebaseConfig.projectId || 'unconfigured',
    activeRateBuckets: userRateBuckets.size,
    recentInquiriesCount: recentInquiries.length,
    timestamp: new Date().toISOString(),
  });
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ORBITA AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ORBITA AI server:', err);
  process.exit(1);
});
