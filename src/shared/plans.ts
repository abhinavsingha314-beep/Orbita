export type PlanId = 'free' | 'pro' | 'business' | 'enterprise';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  audience: string;
  priceMonthlyInr: string;
  priceMonthlyUsd: string;
  monthlyRequestLimit: number;
  savedOutputLimit: number;
  historyRetentionLabel: string;
  summary: string;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    audience: 'For individuals & early testing',
    priceMonthlyInr: '₹0',
    priceMonthlyUsd: '$0',
    monthlyRequestLimit: 40,
    savedOutputLimit: 25,
    historyRetentionLabel: '30-day history',
    summary: 'Explore all six specialized AI agents with core command-center workflows.',
    features: [
      '40 AI agent requests per month',
      'Access to all 6 core AI agents',
      'Up to 25 saved outputs',
      '30-day conversation history',
      'Core prompt library templates',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    audience: 'For solo founders & consultants',
    priceMonthlyInr: '₹1,499',
    priceMonthlyUsd: '$19',
    monthlyRequestLimit: 500,
    savedOutputLimit: 250,
    historyRetentionLabel: 'Unlimited history',
    summary: 'Higher daily velocity, custom prompt workflows, and extended output storage.',
    features: [
      '500 AI agent requests per month',
      'All 6 specialized AI agents',
      'Up to 250 saved outputs',
      'Unlimited searchable chat history',
      'Custom user prompt templates & favorites',
    ],
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    audience: 'For agencies & operations teams',
    priceMonthlyInr: '₹4,999',
    priceMonthlyUsd: '$59',
    monthlyRequestLimit: 2500,
    savedOutputLimit: 2000,
    historyRetentionLabel: 'Unlimited + Analytics',
    summary: 'Built for high-throughput teams running daily sales, marketing, and ops execution.',
    features: [
      '2,500 AI agent requests per month',
      'Expanded multi-turn context windows',
      'Up to 2,000 saved outputs',
      'Detailed agent & token usage analytics',
      'Team-ready workspace architecture',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'For scaling organizations',
    priceMonthlyInr: 'Custom',
    priceMonthlyUsd: 'Custom',
    monthlyRequestLimit: 25000,
    savedOutputLimit: 50000,
    historyRetentionLabel: 'Custom governance',
    summary: 'Organization-grade allowances, agent configuration governance, and admin controls.',
    features: [
      '25,000+ monthly AI requests',
      'Custom agent instructions & governance',
      'Full admin oversight & user controls',
      'Priority onboarding & architecture support',
      'Subscription-ready SLA provisions',
    ],
  },
};

export function getPlanLimits(plan: PlanId | undefined): PlanDefinition {
  return PLAN_CATALOG[plan ?? 'free'] ?? PLAN_CATALOG.free;
}
