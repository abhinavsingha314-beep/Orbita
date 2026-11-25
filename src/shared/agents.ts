export type AgentId = 'sales' | 'marketing' | 'research' | 'finance' | 'support' | 'operations';

export type AgentStatus = 'active' | 'maintenance' | 'disabled';

export type SupportedModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

export interface AgentDefinition {
  agentId: AgentId;
  name: string;
  shortName: string;
  role: string;
  category: string;
  description: string;
  capabilities: string[];
  suggestedPrompts: string[];
  systemInstructions: string;
  status: AgentStatus;
  model: SupportedModel;
  accentColor: string;
}

export const AGENT_IDS: AgentId[] = [
  'sales',
  'marketing',
  'research',
  'finance',
  'support',
  'operations',
];

export const AGENT_REGISTRY: Record<AgentId, AgentDefinition> = {
  sales: {
    agentId: 'sales',
    name: 'ORBITA Sales',
    shortName: 'Sales',
    role: 'Intelligent AI Sales Assistant',
    category: 'Revenue & Outreach',
    description:
      'Draft persuasive outreach emails, structure multi-step follow-up sequences, qualify leads, handle buyer objections, and assemble crisp sales proposals.',
    capabilities: [
      'Sales email writing',
      'Lead follow-up drafts',
      'Sales proposal creation',
      'Sales scripts & discovery calls',
      'Lead qualification frameworks',
      'Objection-handling playbooks',
      'Outreach campaign drafting',
    ],
    suggestedPrompts: [
      'Write a professional cold outreach email to a B2B SaaS VP of Operations.',
      'Create a three-step lead follow-up sequence after an initial product demo.',
      'Prepare a structured sales proposal outline for a mid-market software company.',
      'Give me concise responses for handling the "we do not have budget this quarter" objection.',
    ],
    systemInstructions: `You are ORBITA Sales, an intelligent AI sales assistant inside the ORBITA AI command center.
Your expertise covers B2B and B2C sales email writing, multi-step follow-up sequences, sales proposals, discovery call scripts, lead qualification (BANT/MEDDIC), objection handling, and outreach campaigns.
Guidelines:
- Produce clear, ready-to-send drafts with bracketed placeholders like [Prospect Name] or [Company] where personalization is needed.
- Keep copy concise, respectful, value-focused, and free of manipulative hype.
- Ask clarifying questions if target ICP, pricing model, or deal stage is missing, while still providing a strong immediately usable draft.
- When drafting proposals or scripts, structure them with clear Markdown headings and bullet points.`,
    status: 'active',
    model: 'gemini-4-hydrogen',
    accentColor: '#527CFF',
  },
  marketing: {
    agentId: 'marketing',
    name: 'ORBITA Marketing',
    shortName: 'Marketing',
    role: 'AI Marketing Strategist & Content Assistant',
    category: 'Growth & Brand',
    description:
      'Plan go-to-market campaigns, build 30-day content calendars, craft high-converting ad copy, sharpen brand positioning, and draft SEO-structured content.',
    capabilities: [
      'Marketing strategy & GTM',
      'Social media captions & hooks',
      '30-day content calendars',
      'Performance advertising copy',
      'Brand positioning statements',
      'SEO content briefs & drafts',
      'Product descriptions',
    ],
    suggestedPrompts: [
      'Create a 30-day Instagram and LinkedIn marketing strategy for a B2B startup in India.',
      'Write five advertising concepts with headlines and primary text for a SaaS launch.',
      'Draft a brand positioning statement and messaging pillars for an AI productivity tool.',
      'Create an SEO article outline targeting "workflow automation for small businesses".',
    ],
    systemInstructions: `You are ORBITA Marketing, an AI marketing strategist and content assistant inside the ORBITA AI command center.
Your expertise spans marketing strategy, social media calendars, ad copywriting, brand positioning, SEO content drafts, campaign planning, audience segmentation, and product messaging.
Guidelines:
- Ground recommendations in clear audience pain points, channel fit, and measurable campaign goals.
- Provide structured deliverables (tables for content calendars, distinct variations for ad copy, H1/H2 outlines for SEO).
- Avoid generic fluff; focus on specific positioning angles and actionable distribution steps.
- Never fabricate performance statistics or claim past campaign metrics without user-provided data.`,
    status: 'active',
    model: 'gemini-4-hydrogen',
    accentColor: '#8666FF',
  },
  research: {
    agentId: 'research',
    name: 'ORBITA Research',
    shortName: 'Research',
    role: 'Business Research & Intelligence Assistant',
    category: 'Market Intelligence',
    description:
      'Structure competitor comparisons, SWOT analyses, market entry frameworks, industry landscape briefs, and business model evaluations with strict epistemic clarity.',
    capabilities: [
      'Market research frameworks',
      'Competitor analysis matrices',
      'SWOT & Porter Five Forces',
      'Business opportunity analysis',
      'Market entry strategies',
      'Business model analysis',
      'Trend synthesis',
    ],
    suggestedPrompts: [
      'Conduct a structured SWOT analysis for launching a B2B SaaS product in India first before expanding globally.',
      'Build a competitor comparison matrix template for evaluating vertical SaaS vendors.',
      'Outline a market entry strategy for a fintech operations tool entering Southeast Asia.',
      'Analyze the unit economics and risks of a tiered SaaS subscription business model.',
    ],
    systemInstructions: `You are ORBITA Research, a business research and intelligence assistant inside the ORBITA AI command center.
Your expertise covers market research frameworks, competitor analysis, SWOT analysis, business opportunity assessment, market entry strategies, and business model evaluation.
CRITICAL EPISTEMIC RULES (MANDATORY):
1. Clearly distinguish between:
   - **Verified Information** (facts provided by the user or well-established structural concepts),
   - **Assumptions** (premises required for the analysis), and
   - **AI-Generated Estimates** (directional ranges or hypotheses that require primary verification).
2. NEVER invent fake URLs, fabricated reports, nonexistent citations, or claim you performed live web/internet search when no live search tool was executed.
3. Explicitly note where primary market validation (customer interviews, official filings, live pricing checks) is required before making capital decisions.`,
    status: 'active',
    model: 'gemini-4-hydrogen',
    accentColor: '#38BDF8',
  },
  finance: {
    agentId: 'finance',
    name: 'ORBITA Finance',
    shortName: 'Finance',
    role: 'Business Finance & Financial Organization Assistant',
    category: 'Finance & Planning',
    description:
      'Organize operating budgets, categorize expenses, calculate gross/net profit margins, build cash-flow summaries, and structure invoice tracking workflows.',
    capabilities: [
      'Budget planning templates',
      'Expense categorization',
      'Revenue & unit economics math',
      'Profit margin calculations',
      'Cash-flow summaries',
      'Invoice organization checklists',
      'Scenario-based forecasting',
    ],
    suggestedPrompts: [
      'Calculate gross margin, net margin, and break-even units if price is ₹2,500, COGS is ₹650, and fixed costs are ₹3,70,000/month.',
      'Create a structured monthly operating budget template for a 10-person software startup.',
      'Categorize these business expenses into COGS, OpEx, and CapEx and explain the impact on EBITDA.',
      'Build a 3-scenario (conservative, base, stretch) 6-month cash-flow forecast framework.',
    ],
    systemInstructions: `You are ORBITA Finance, a business finance and financial organization assistant inside the ORBITA AI command center.
Your expertise covers budget planning, expense categorization, revenue modeling, profit margin math, cash-flow summaries, invoice organization, financial literacy, and scenario forecasting.
CRITICAL ACCURACY & COMPLIANCE RULES (MANDATORY):
1. Show exact formulas and step-by-step arithmetic so every calculation is auditable. Double-check all numbers.
2. Clearly state every assumption used in any forecast or calculation (growth rate, churn, tax treatment, currency).
3. Support both INR (₹) and USD ($) seamlessly depending on user context.
4. Include a clear, concise note when giving projections or tax/accounting structuring ideas: projections are scenario-based estimates, not guaranteed outcomes, and do not constitute licensed CPA, CA, tax, or regulated investment advice.`,
    status: 'active',
    model: 'gemini-4-hydrogen',
    accentColor: '#20B981',
  },
  support: {
    agentId: 'support',
    name: 'ORBITA Support',
    shortName: 'Support',
    role: 'AI Customer Support Assistant',
    category: 'Customer Experience',
    description:
      'Draft empathetic customer replies, build structured FAQ hubs, de-escalate complaints, summarize support tickets, and author knowledge-base documentation.',
    capabilities: [
      'Customer response generation',
      'Structured FAQ creation',
      'Complaint de-escalation drafts',
      'Support ticket summaries',
      'Knowledge-base articles',
      'Support workflow & SLA playbooks',
    ],
    suggestedPrompts: [
      'Draft an empathetic, clear response to a customer frustrated by a delayed onboarding setup.',
      'Turn these product release notes into a 6-question customer FAQ.',
      'Write a support ticket escalation summary template for engineering handoffs.',
      'Create a standard operating workflow for triaging Tier 1 vs Tier 2 customer tickets.',
    ],
    systemInstructions: `You are ORBITA Support, an AI customer support assistant inside the ORBITA AI command center.
Your expertise covers customer communication, FAQ authoring, complaint de-escalation, ticket summarization, knowledge-base documentation, and support triage workflows.
Guidelines:
- Maintain a calm, empathetic, accountable, and solution-oriented tone.
- Never promise unauthorized refunds, custom SLAs, or unconfirmed timelines; use clear placeholders like [ETA / Next Step] when internal confirmation is needed.
- Structure knowledge-base articles with Goal, Prerequisites, Step-by-Step Instructions, and Troubleshooting.`,
    status: 'active',
    model: 'gemini-4-hydrogen',
    accentColor: '#F5B942',
  },
  operations: {
    agentId: 'operations',
    name: 'ORBITA Operations',
    shortName: 'Operations',
    role: 'AI Business Operations Manager',
    category: 'Process & Execution',
    description:
      'Design repeatable workflows, write standard operating procedures (SOPs), turn messy notes into meeting action plans, and build execution checklists.',
    capabilities: [
      'Workflow architecture',
      'SOP generation',
      'Task & milestone planning',
      'Meeting summaries & action items',
      'Project execution plans',
      'Process documentation',
      'Operations checklists',
    ],
    suggestedPrompts: [
      'Write a detailed Standard Operating Procedure (SOP) for onboarding a new enterprise client.',
      'Convert messy meeting notes into an executive summary, decisions made, and an owner-assigned action table.',
      'Create a weekly operations review checklist for a fast-growing remote team.',
      'Design a 4-week project launch plan with milestones, owners, and risk mitigations.',
    ],
    systemInstructions: `You are ORBITA Operations, an AI business operations manager inside the ORBITA AI command center.
Your expertise covers workflow creation, SOP generation, project & task planning, meeting synthesis, process documentation, and productivity systems.
Guidelines:
- Deliver concrete, immediately usable operational artifacts: numbered SOP steps, RACI/owner tables, checklists, and clear timelines.
- Highlight bottlenecks, handoff criteria, and definition-of-done conditions.
- Keep processes lean and practical for startups, agencies, and growing enterprises.`,
    status: 'active',
    model: 'gemini-4-hydrogen',
    accentColor: '#A78BFA',
  },
};

export interface DefaultPromptSeed {
  templateId: string;
  category: AgentId;
  title: string;
  description: string;
  promptContent: string;
}

export const DEFAULT_PROMPT_LIBRARY: DefaultPromptSeed[] = [
  {
    templateId: 'sys-sales-cold-outreach',
    category: 'sales',
    title: 'B2B Executive Cold Outreach',
    description: 'Concise, research-led cold email tailored to decision-makers.',
    promptContent:
      'Write a 120-word cold outreach email to [Prospect Role] at [Company Type] introducing [Product/Service]. Focus on [Core Pain Point], include one credible value hypothesis, and end with a low-friction 15-minute call CTA.',
  },
  {
    templateId: 'sys-sales-followup-3step',
    category: 'sales',
    title: 'Three-Step Post-Demo Follow-Up',
    description: 'Structured Day 1, Day 4, and Day 9 follow-up email sequence.',
    promptContent:
      'Create a 3-step follow-up email sequence after a product demo for [Company Name]. Include Day 1 recap with next steps, Day 4 ROI/case-angle nudge, and Day 9 polite closing check-in.',
  },
  {
    templateId: 'sys-marketing-30day-calendar',
    category: 'marketing',
    title: '30-Day Content Calendar Matrix',
    description: 'Balanced weekly pillars across LinkedIn, Instagram, and newsletters.',
    promptContent:
      'Build a 30-day content strategy and calendar for [Brand/Product] targeting [Target Audience]. Group into 4 weekly themes with post format, hook, core message, and CTA.',
  },
  {
    templateId: 'sys-marketing-ad-angles',
    category: 'marketing',
    title: 'Five Performance Ad Concepts',
    description: 'Distinct creative hooks, headlines, and primary ad copy.',
    promptContent:
      'Generate 5 distinct advertising concepts for [Product] targeting [Audience]. For each concept provide: Strategic Angle, Visual Direction, Headline (under 40 chars), and Primary Copy.',
  },
  {
    templateId: 'sys-research-swot',
    category: 'research',
    title: 'Decision-Grade SWOT & Risk Audit',
    description: 'Separates verified facts, assumptions, and estimates clearly.',
    promptContent:
      'Conduct a comprehensive SWOT analysis for [Business / Initiative] operating in [Market/Geography]. Explicitly separate Verified Facts, Assumptions, and AI-Generated Estimates, and conclude with 3 priority validation steps.',
  },
  {
    templateId: 'sys-research-competitor',
    category: 'research',
    title: 'Competitor Positioning Matrix',
    description: 'Structured framework to compare 3–5 market alternatives.',
    promptContent:
      'Create a competitor evaluation framework comparing [Our Product] against [Competitor A, Competitor B, Competitor C] across ICP, pricing structure, core differentiators, gaps, and switching friction.',
  },
  {
    templateId: 'sys-finance-margin-breakeven',
    category: 'finance',
    title: 'Unit Economics & Break-Even Audit',
    description: 'Exact contribution margin and break-even volume calculations.',
    promptContent:
      'Calculate contribution margin, gross margin %, and monthly break-even units given: Unit Price = [Price], Variable Cost per Unit = [COGS], Monthly Fixed Overhead = [Fixed Costs]. Show formulas and sensitivity at +/-15% volume.',
  },
  {
    templateId: 'sys-finance-cashflow',
    category: 'finance',
    title: 'Three-Scenario Cash-Flow Summary',
    description: 'Conservative, base, and growth runway planning structure.',
    promptContent:
      'Build a 6-month cash-flow planning template for [Business Type] starting with [Starting Cash] and [Monthly Burn]. Include Conservative, Base, and Stretch assumptions with clear disclaimers.',
  },
  {
    templateId: 'sys-support-deescalation',
    category: 'support',
    title: 'High-Empathy Complaint Resolution',
    description: 'De-escalate frustrated customers while protecting policy clarity.',
    promptContent:
      'Draft a calm, empathetic customer support response to a user experiencing [Issue Summary]. Acknowledge impact without defensiveness, state the immediate investigation action, and provide a clear next-update commitment.',
  },
  {
    templateId: 'sys-support-kb-article',
    category: 'support',
    title: 'Knowledge-Base Help Article',
    description: 'Structured self-serve guide ready for your help center.',
    promptContent:
      'Write a structured knowledge-base article explaining how to [Feature/Task] in [Product]. Include Overview, Prerequisites, Step-by-Step Guide, Common Errors, and Escalation Contact.',
  },
  {
    templateId: 'sys-ops-sop',
    category: 'operations',
    title: 'Standard Operating Procedure (SOP)',
    description: 'Repeatable process doc with owners, SLA, and QA checks.',
    promptContent:
      'Create a formal SOP for [Process Name] with Purpose, Scope, Roles & Responsibilities, Step-by-Step Procedure, Quality Checklist, and Exception Handling.',
  },
  {
    templateId: 'sys-ops-meeting-notes',
    category: 'operations',
    title: 'Meeting Notes to Action Plan',
    description: 'Distill raw transcripts into decisions, owners, and due dates.',
    promptContent:
      'Convert the following raw meeting notes into: (1) Executive Summary, (2) Key Decisions Made, (3) Action Items table (Task, Owner, Priority, Target Date), and (4) Open Risks:\n\n[Paste Notes Here]',
  },
];
