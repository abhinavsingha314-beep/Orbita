import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  Lock,
  Smartphone,
  Zap,
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { AgentIconBox } from '../components/AgentIcon';
import { AGENT_IDS, AGENT_REGISTRY } from '../shared/agents';
import { PLAN_CATALOG } from '../shared/plans';
import { useAuth } from '../contexts/AuthContext';

const HERO_IMAGE = '/src/assets/images/hero_command_center_1795581846055.jpg';
const ARCHITECTURE_IMAGE = '/src/assets/images/orbit_system_layers_1795581845884.jpg';

const FAQS = [
  {
    q: 'How is ORBITA AI different from a generic single-chat AI tool?',
    a: 'Instead of re-explaining your business context inside disposable chat windows, ORBITA AI organizes six purpose-built agents—Sales, Marketing, Research, Finance, Support, and Operations—inside one unified command center with persistent conversation history, saved deliverables, and a reusable prompt library.',
  },
  {
    q: 'Are conversations and saved outputs isolated to my account?',
    a: 'Yes. Every conversation, message turn, saved output, and custom prompt template is scoped strictly to your authenticated user ID and enforced by database security rules and server-side token verification.',
  },
  {
    q: 'Can I use ORBITA AI comfortably on an Android smartphone?',
    a: 'Yes. The entire command center—from dashboard metrics to multi-turn agent workspaces, prompt selection, and saved output retrieval—is engineered mobile-first with thumb-friendly navigation and touch-sized controls.',
  },
  {
    q: 'How does ORBITA Research handle accuracy and sources?',
    a: 'ORBITA Research is instructed to explicitly separate verified facts provided by you, analytical assumptions, and AI-generated estimates. It never fabricates URLs or claims live web research when no external search integration was executed.',
  },
  {
    q: 'Are paid plans live for online checkout right now?',
    a: 'Account tiers (Free, Pro, Business, and Enterprise) and usage enforcement are built into the platform architecture. Live payment checkout is not enabled yet—you can start immediately on the Free plan and request higher-tier provisioning via our Contact page.',
  },
];

export function LandingPage() {
  const { firebaseUser } = useAuth();
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroImgError, setHeroImgError] = useState(false);
  const [archImgError, setArchImgError] = useState(false);

  return (
    <PublicLayout>
      {/* 1. HERO SECTION */}
      <section className="relative border-b border-[#252D40] bg-[#090B12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-[#9CA7BB]">
                <span>ORBITA AI Platform</span>
                <span aria-hidden="true">·</span>
                <span>Your AI Workforce. One Command Center.</span>
              </div>

              <h1
                className="font-display font-bold tracking-tight text-[#F7F8FC] leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)', textWrap: 'balance' }}
              >
                Meet Your New AI Workforce.
              </h1>

              <p className="text-base sm:text-lg text-[#9CA7BB] leading-relaxed max-w-xl">
                One intelligent workspace. Specialized AI agents. Unlimited possibilities. Delegate sales outreach, campaign strategy, market research, financial structuring, customer support, and daily operations from one command center.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to={firebaseUser ? '/dashboard' : '/register'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{firebaseUser ? 'Open Command Center' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/agents"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-lg border border-[#252D40] bg-[#101522] hover:bg-[#151C2B] text-[#F7F8FC] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore AI Agents</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[260px] sm:min-h-[340px] rounded-xl overflow-hidden border border-[#252D40] bg-[#101522]">
                {!heroImgError ? (
                  <img
                    src={HERO_IMAGE}
                    alt="ORBITA AI enterprise command studio workspace"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-[#101522] via-[#151C2B] to-[#090B12] flex flex-col items-center justify-center p-8 text-center">
                    <Layers className="w-10 h-10 text-[#527CFF] mb-3" />
                    <p className="font-display text-lg font-semibold text-[#F7F8FC]">ORBITA AI Command Studio</p>
                    <p className="text-sm text-[#9CA7BB] mt-1">Six specialized agents unified in one workspace</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grounded Platform Architecture Strip (Real platform capabilities, no fabricated vanity stats) */}
          <div className="mt-14 pt-8 border-t border-[#252D40] grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#F7F8FC]">06</p>
              <p className="text-sm text-[#9CA7BB] mt-1">Specialized functional AI agents</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#F7F8FC]">Multi-Turn</p>
              <p className="text-sm text-[#9CA7BB] mt-1">Persistent context & saved deliverables</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#F7F8FC]">Server-Side</p>
              <p className="text-sm text-[#9CA7BB] mt-1">Authenticated AI proxy & quota controls</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#F7F8FC]">Mobile-First</p>
              <p className="text-sm text-[#9CA7BB] mt-1">Built for Android & desktop browsers</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="py-16 md:py-24 bg-[#101522] border-b border-[#252D40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3 mb-12">
            <p className="text-xs font-medium text-[#527CFF]">The Problem</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
              Disconnected AI tabs slow teams down instead of scaling output.
            </h2>
            <p className="text-base text-[#9CA7BB] leading-relaxed">
              Founders, agencies, and operators waste hours copying prompts between generic chat windows, losing deliverables, and rewriting instructions from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Fragmented Context',
                body: 'Generic chat tools forget role boundaries. Sales outreach, financial math, and SOP writing end up mixed together with inconsistent quality.',
              },
              {
                num: '02',
                title: 'Lost Deliverables',
                body: 'High-value proposals, campaign calendars, and support playbooks disappear in unsearchable chat threads instead of an organized output library.',
              },
              {
                num: '03',
                title: 'Zero Governance',
                body: 'Without structured prompt libraries, usage visibility, and user-level isolation, businesses cannot adopt AI reliably across daily work.',
              },
            ].map((item) => (
              <div
                key={item.num}
                className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-3"
              >
                <span className="font-mono text-xs text-[#9CA7BB]">{item.num}</span>
                <h3 className="font-display text-lg font-semibold text-[#F7F8FC]">{item.title}</h3>
                <p className="text-sm text-[#9CA7BB] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OUR SOLUTION */}
      <section className="py-16 md:py-24 bg-[#090B12] border-b border-[#252D40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="aspect-video rounded-xl overflow-hidden border border-[#252D40] bg-[#101522]">
                {!archImgError ? (
                  <img
                    src={ARCHITECTURE_IMAGE}
                    alt="ORBITA AI modular multi-agent system architecture"
                    referrerPolicy="no-referrer"
                    onError={() => setArchImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#151C2B] flex items-center justify-center p-8 text-center">
                    <p className="text-sm text-[#9CA7BB]">Unified Multi-Agent Command Architecture</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-medium text-[#8666FF]">Our Solution</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
                One unified operating system for your entire AI workforce.
              </h2>
              <p className="text-base text-[#9CA7BB] leading-relaxed">
                ORBITA AI pairs dedicated system instructions per business function with persistent cloud storage, reusable prompt templates, and real-time streaming responses.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  'Each agent runs with domain-specific guardrails and formatting standards.',
                  'Conversations persist cleanly with rename, search, archive, and regenerate actions.',
                  'High-impact responses save directly into your personal Saved Outputs vault.',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-md bg-[#151C2B] border border-[#252D40] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#20B981]" />
                    </div>
                    <p className="text-sm text-[#E3E7F2] leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SIX CORE AI AGENTS */}
      <section className="py-16 md:py-24 bg-[#101522] border-b border-[#252D40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium text-[#527CFF]">The Workforce</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
                Six specialized AI agents ready to deploy.
              </h2>
              <p className="text-base text-[#9CA7BB]">
                Every agent has its own dedicated workspace, tailored prompt templates, and multi-turn memory.
              </p>
            </div>
            <Link
              to="/agents"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#527CFF] hover:text-[#7A9AFF] whitespace-nowrap shrink-0"
            >
              <span>View all capabilities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENT_IDS.map((id) => {
              const agent = AGENT_REGISTRY[id];
              return (
                <div
                  key={id}
                  className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 flex flex-col justify-between gap-6 hover:border-[#527CFF]/50 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <AgentIconBox agentId={id} size="md" />
                      <span className="text-xs text-[#9CA7BB]">{agent.category}</span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-display text-lg font-semibold text-[#F7F8FC]">{agent.name}</h3>
                      <p className="text-xs text-[#9CA7BB]">{agent.role}</p>
                    </div>

                    <p className="text-sm text-[#9CA7BB] leading-relaxed">{agent.description}</p>

                    <ul className="space-y-1.5 pt-2 border-t border-[#252D40]">
                      {agent.capabilities.slice(0, 3).map((cap) => (
                        <li key={cap} className="text-xs text-[#E3E7F2] flex items-center gap-2">
                          <span className="text-[#527CFF]">—</span>
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={firebaseUser ? `/workspace/${id}` : '/register'}
                    className="inline-flex items-center justify-center gap-2 w-full min-h-[42px] rounded-lg border border-[#252D40] bg-[#101522] hover:bg-[#527CFF] hover:border-[#527CFF] text-[#F7F8FC] text-sm font-medium transition-colors"
                  >
                    <span>{firebaseUser ? 'Open Workspace' : 'Try Agent'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-16 md:py-24 bg-[#090B12] border-b border-[#252D40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3 mb-12">
            <p className="text-xs font-medium text-[#527CFF]">How It Works</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
              From business brief to finished deliverable in three steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01. Select Your Specialist',
                desc: 'Open your dashboard and pick the right agent—Sales, Marketing, Research, Finance, Support, or Operations—or launch directly from the Prompt Library.',
              },
              {
                step: '02. Iterate in Multi-Turn Context',
                desc: 'Send prompts, refine tone or assumptions across follow-up turns, and regenerate responses whenever you want a sharper angle.',
              },
              {
                step: '03. Save & Reuse Across Workflows',
                desc: 'Copy finished outputs in one tap, archive key results into Saved Outputs, and track request usage across your team.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl bg-[#101522] border border-[#252D40] p-6 space-y-3"
              >
                <h3 className="font-display text-lg font-semibold text-[#F7F8FC]">{item.step}</h3>
                <p className="text-sm text-[#9CA7BB] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. KEY BENEFITS & FEATURES */}
      <section className="py-16 md:py-24 bg-[#101522] border-b border-[#252D40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3 mb-12">
            <p className="text-xs font-medium text-[#8666FF]">Platform Architecture</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
              Built for reliability, data isolation, and mobile speed.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Streaming AI Execution',
                body: 'Server-proxied AI generation streams responses token-by-token so you can review output immediately without waiting.',
              },
              {
                icon: Lock,
                title: 'Strict Tenant Isolation',
                body: 'Firebase Authentication and database security rules guarantee your chats and saved outputs remain accessible only to you.',
              },
              {
                icon: Smartphone,
                title: 'Android-Ready Ergonomics',
                body: 'Bottom tab navigation, touch-sized buttons, and responsive markdown tables keep workflows fast on smartphone screens.',
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#101522] border border-[#252D40] flex items-center justify-center text-[#527CFF]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#F7F8FC]">{feat.title}</h3>
                  <p className="text-sm text-[#9CA7BB] leading-relaxed">{feat.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. PRICING */}
      <section className="py-16 md:py-24 bg-[#090B12] border-b border-[#252D40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium text-[#527CFF]">Subscription Plans</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
                Transparent capacity tiers from solo startup to enterprise.
              </h2>
              <p className="text-sm text-[#9CA7BB]">
                Start free with all six agents. Paid billing checkout will be enabled in a future release; contact us for higher-tier provisioning.
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-lg bg-[#101522] border border-[#252D40] shrink-0 self-start">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  currency === 'INR' ? 'bg-[#527CFF] text-white' : 'text-[#9CA7BB] hover:text-[#F7F8FC]'
                }`}
              >
                INR (₹)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  currency === 'USD' ? 'bg-[#527CFF] text-white' : 'text-[#9CA7BB] hover:text-[#F7F8FC]'
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
                    plan.highlighted
                      ? 'bg-[#151C2B] border-[#527CFF]'
                      : 'bg-[#101522] border-[#252D40]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#9CA7BB]">
                        <span>{plan.audience}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-[#F7F8FC]">{plan.name}</h3>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="font-mono tabular-nums text-3xl font-bold text-[#F7F8FC]">
                        {price}
                      </span>
                      {price !== 'Custom' && (
                        <span className="text-xs text-[#9CA7BB]">/ month</span>
                      )}
                    </div>

                    <p className="text-sm text-[#9CA7BB] leading-relaxed">{plan.summary}</p>

                    <ul className="space-y-2.5 pt-4 border-t border-[#252D40]">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs text-[#E3E7F2]">
                          <Check className="w-4 h-4 text-[#20B981] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={pid === 'free' ? '/register' : '/contact'}
                    className={`w-full min-h-[44px] flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-[#527CFF] hover:bg-[#4168E8] text-white'
                        : 'bg-[#151C2B] hover:bg-[#1E273B] border border-[#252D40] text-[#F7F8FC]'
                    }`}
                  >
                    {pid === 'free' ? 'Start Free' : 'Request Tier Access'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-16 md:py-24 bg-[#101522] border-b border-[#252D40]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3 mb-10">
            <p className="text-xs font-medium text-[#527CFF]">Questions</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="divide-y divide-[#252D40] border-y border-[#252D40]">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="text-base font-medium text-[#F7F8FC]">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#9CA7BB] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#527CFF]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-5 text-sm text-[#9CA7BB] leading-relaxed pr-8">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-16 md:py-24 bg-[#090B12]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F7F8FC] tracking-tight">
            Your AI Workforce. One Command Center.
          </h2>
          <p className="text-base text-[#9CA7BB] max-w-xl mx-auto">
            Create your ORBITA AI workspace in seconds and run your first specialized agent workflow today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={firebaseUser ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-semibold transition-colors"
            >
              <span>{firebaseUser ? 'Go to Dashboard' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 min-h-[48px] rounded-lg border border-[#252D40] bg-[#101522] hover:bg-[#151C2B] text-[#F7F8FC] text-sm font-medium transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
