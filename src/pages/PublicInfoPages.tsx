import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Check,
  History,
  Library,
  Lock,
  Send,
  Shield,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import { PLAN_CATALOG } from '../shared/plans';
import { submitContactInquiry } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function FeaturesPage() {
  const features = [
    {
      icon: Sparkles,
      title: 'Role-Specialized AI Engine',
      desc: 'Six distinct agents operate with tailored system instructions, domain constraints, and curated starter prompts.',
    },
    {
      icon: History,
      title: 'Persistent Multi-Turn History',
      desc: 'Search, filter by agent, rename, archive, and resume conversations across sessions and devices.',
    },
    {
      icon: Bookmark,
      title: 'Saved Outputs Vault',
      desc: 'Promote any high-value AI response into an organized library of reusable emails, SOPs, and financial analyses.',
    },
    {
      icon: Library,
      title: 'Prompt Library & Custom Templates',
      desc: 'Use curated templates across all six departments or save and favorite your own repeatable prompt workflows.',
    },
    {
      icon: Lock,
      title: 'Server-Side Security & Quotas',
      desc: 'API credentials never touch the browser. Requests authenticate via verified tokens with monthly plan enforcement.',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Android Workspace',
      desc: 'Engineered for thumb-zone navigation, responsive markdown tables, and crisp readability on mobile screens.',
    },
  ];

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-medium text-[#527CFF]">Platform Features</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F8FC] tracking-tight">
            Everything needed to run a disciplined AI workforce.
          </h1>
          <p className="text-base text-[#9CA7BB] leading-relaxed">
            ORBITA AI unifies execution, memory, prompt standardization, and usage visibility inside one clean command center.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#101522] border border-[#252D40] flex items-center justify-center text-[#527CFF]">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg font-semibold text-[#F7F8FC]">{f.title}</h2>
                <p className="text-sm text-[#9CA7BB] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}

export function AgentsShowcasePage() {
  const { firebaseUser } = useAuth();

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-medium text-[#527CFF]">AI Workforce Directory</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F8FC] tracking-tight">
            Six core AI agents built for real business workflows.
          </h1>
          <p className="text-base text-[#9CA7BB] leading-relaxed">
            Explore each specialist&apos;s capabilities, operational guardrails, and example prompts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {AGENT_IDS.map((id) => {
            const agent = AGENT_REGISTRY[id];
            return (
              <div
                key={id}
                className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 sm:p-7 flex flex-col justify-between gap-6"
              >
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <AgentIconBox agentId={id} size="lg" />
                    <div>
                      <p className="text-xs text-[#9CA7BB]">{agent.category}</p>
                      <h2 className="font-display text-xl font-bold text-[#F7F8FC]">{agent.name}</h2>
                      <p className="text-sm text-[#527CFF]">{agent.role}</p>
                    </div>
                  </div>

                  <p className="text-sm text-[#9CA7BB] leading-relaxed">{agent.description}</p>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#F7F8FC]">Capabilities</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#E3E7F2]">
                      {agent.capabilities.map((c) => (
                        <div key={c} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#20B981] shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#252D40]">
                    <p className="text-xs font-semibold text-[#F7F8FC]">Example Prompts</p>
                    <ul className="space-y-1.5">
                      {agent.suggestedPrompts.slice(0, 2).map((p) => (
                        <li key={p} className="text-xs text-[#9CA7BB] bg-[#101522] border border-[#252D40] rounded-lg px-3 py-2">
                          &ldquo;{p}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  to={firebaseUser ? `/workspace/${id}` : '/register'}
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-medium transition-colors"
                >
                  <span>{firebaseUser ? `Open ${agent.name}` : `Launch ${agent.name}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}

export function PricingPage() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-medium text-[#527CFF]">Pricing & Allowances</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F8FC] tracking-tight">
              Predictable tiers designed for India and global teams.
            </h1>
            <p className="text-base text-[#9CA7BB]">
              Plans are enforced via server-side quota checks. Online payment checkout is not enabled yet—reach out via Contact to upgrade an organization account.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-lg bg-[#101522] border border-[#252D40] self-start">
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                currency === 'INR' ? 'bg-[#527CFF] text-white' : 'text-[#9CA7BB]'
              }`}
            >
              INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                currency === 'USD' ? 'bg-[#527CFF] text-white' : 'text-[#9CA7BB]'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['free', 'pro', 'business', 'enterprise'] as const).map((pid) => {
            const plan = PLAN_CATALOG[pid];
            const price = currency === 'INR' ? plan.priceMonthlyInr : plan.priceMonthlyUsd;
            return (
              <div
                key={pid}
                className={`rounded-xl p-6 flex flex-col justify-between gap-6 border ${
                  plan.highlighted ? 'bg-[#151C2B] border-[#527CFF]' : 'bg-[#101522] border-[#252D40]'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#9CA7BB]">{plan.audience}</p>
                    <h2 className="font-display text-xl font-bold text-[#F7F8FC] mt-1">{plan.name}</h2>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono tabular-nums text-3xl font-bold text-[#F7F8FC]">{price}</span>
                    {price !== 'Custom' && <span className="text-xs text-[#9CA7BB]">/ month</span>}
                  </div>
                  <p className="text-sm text-[#9CA7BB]">{plan.summary}</p>
                  <ul className="space-y-2 pt-4 border-t border-[#252D40]">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-[#E3E7F2]">
                        <Check className="w-4 h-4 text-[#20B981] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={pid === 'free' ? '/register' : '/contact'}
                  className={`w-full min-h-[44px] flex items-center justify-center rounded-lg text-sm font-medium ${
                    plan.highlighted
                      ? 'bg-[#527CFF] hover:bg-[#4168E8] text-white'
                      : 'bg-[#151C2B] hover:bg-[#1E273B] border border-[#252D40] text-[#F7F8FC]'
                  }`}
                >
                  {pid === 'free' ? 'Create Free Account' : 'Request Upgrade'}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}

export function AboutPage() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-medium text-[#527CFF]">About ORBITA AI</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F8FC] tracking-tight">
            Building a unified AI workforce operating system from India to the world.
          </h1>
          <p className="text-base text-[#9CA7BB] leading-relaxed">
            ORBITA AI was designed around a straightforward observation: individuals, founders, agencies, and operations teams should not have to stitch together six disconnected AI tools to run daily business work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-2">
            <h2 className="font-display text-lg font-semibold text-[#F7F8FC]">Our Vision</h2>
            <p className="text-sm text-[#9CA7BB] leading-relaxed">
              Become a global AI workforce operating system that enables businesses to delegate repetitive work, coordinate specialized agents, and manage workflows through one command center.
            </p>
          </div>
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-2">
            <h2 className="font-display text-lg font-semibold text-[#F7F8FC]">Our Mission</h2>
            <p className="text-sm text-[#9CA7BB] leading-relaxed">
              Make reliable, well-structured AI capabilities accessible to entrepreneurs, startups, consultants, agencies, and growing enterprises without technical overhead.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#101522] border border-[#252D40] p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#20B981]">
            <Shield className="w-5 h-5" />
            <h2 className="font-display text-lg font-semibold text-[#F7F8FC]">Engineering Principles</h2>
          </div>
          <p className="text-sm text-[#9CA7BB] leading-relaxed">
            Every agent workspace enforces user-level data isolation, server-side AI API protection, transparent epistemic boundaries for research and financial analysis, and mobile-first usability on Android smartphones.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState('Plan Upgrade & Team Access');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessRef(null);
    setSubmitting(true);
    try {
      const res = await submitContactInquiry({ name, email, company, topic, message });
      setSuccessRef(res.referenceId);
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-medium text-[#527CFF]">Contact</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F8FC] tracking-tight">
            Connect with ORBITA AI
          </h1>
          <p className="text-base text-[#9CA7BB]">
            Questions about Business or Enterprise tier provisioning, custom agent workflows, or feedback? Send us a message.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 sm:p-8 space-y-5"
        >
          {error && (
            <div className="rounded-lg bg-[#EF5350]/10 border border-[#EF5350]/40 px-4 py-3 text-sm text-[#EF5350]">
              {error}
            </div>
          )}
          {successRef && (
            <div className="rounded-lg bg-[#20B981]/10 border border-[#20B981]/40 px-4 py-3 text-sm text-[#20B981]">
              Inquiry received (Reference <span className="font-mono">{successRef}</span>). We will follow up via email.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="block text-xs font-medium text-[#9CA7BB]">
                Full Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Mehta"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="block text-xs font-medium text-[#9CA7BB]">
                Work Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@company.in"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-company" className="block text-xs font-medium text-[#9CA7BB]">
                Company (Optional)
              </label>
              <input
                id="contact-company"
                type="text"
                maxLength={120}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Ventures"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-topic" className="block text-xs font-medium text-[#9CA7BB]">
                Topic
              </label>
              <select
                id="contact-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
              >
                <option value="Plan Upgrade & Team Access">Plan Upgrade &amp; Team Access</option>
                <option value="Enterprise Onboarding">Enterprise Onboarding</option>
                <option value="Product Feedback">Product Feedback</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-message" className="block text-xs font-medium text-[#9CA7BB]">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              minLength={10}
              maxLength={3000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your team size and workflow goals..."
              className="w-full rounded-lg bg-[#090B12] border border-[#252D40] p-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[44px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Sending...' : 'Send Inquiry'}</span>
          </button>
        </form>
      </section>
    </PublicLayout>
  );
}

export function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <p className="text-xs font-medium text-[#527CFF]">Legal</p>
        <h1 className="font-display text-3xl font-bold text-[#F7F8FC]">Privacy Policy</h1>
        <div className="space-y-4 text-sm text-[#9CA7BB] leading-relaxed">
          <p>
            ORBITA AI collects only the account details required to authenticate your session (name, email address, and optional profile metadata) and the workspace records you create (conversations, saved outputs, custom prompts, and usage counts).
          </p>
          <p>
            Your private conversations and saved outputs are isolated per user ID in Firestore and are never shared across accounts. AI prompts are transmitted securely from our backend server to the configured Gemini API model without exposing credentials to browsers.
          </p>
          <p>
            You remain in control of your workspace data and can delete individual conversations, saved outputs, or your entire workspace record set at any time from Account Settings.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

export function TermsPage() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <p className="text-xs font-medium text-[#527CFF]">Legal</p>
        <h1 className="font-display text-3xl font-bold text-[#F7F8FC]">Terms of Service</h1>
        <div className="space-y-4 text-sm text-[#9CA7BB] leading-relaxed">
          <p>
            By accessing ORBITA AI, you agree to use the platform lawfully and within your assigned plan usage limits. Automated scraping, abuse of rate limits, or attempts to bypass user isolation are prohibited.
          </p>
          <p>
            AI-generated outputs—including research summaries, financial calculations, and operational drafts—are provided as decision-support drafts. Users are responsible for reviewing accuracy before commercial, legal, or financial execution. ORBITA Finance does not provide licensed accounting, tax, or regulated financial advice.
          </p>
          <p>
            We may suspend accounts that violate security policies or abuse platform infrastructure.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
