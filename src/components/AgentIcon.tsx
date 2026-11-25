import {
  Briefcase,
  Calculator,
  Compass,
  Headphones,
  Megaphone,
  Workflow,
} from 'lucide-react';
import type { AgentId } from '../shared/agents';

export function AgentIcon({
  agentId,
  className = 'w-5 h-5',
}: {
  agentId: AgentId;
  className?: string;
}) {
  switch (agentId) {
    case 'sales':
      return <Briefcase className={className} style={{ color: '#527CFF' }} />;
    case 'marketing':
      return <Megaphone className={className} style={{ color: '#8666FF' }} />;
    case 'research':
      return <Compass className={className} style={{ color: '#38BDF8' }} />;
    case 'finance':
      return <Calculator className={className} style={{ color: '#20B981' }} />;
    case 'support':
      return <Headphones className={className} style={{ color: '#F5B942' }} />;
    case 'operations':
      return <Workflow className={className} style={{ color: '#A78BFA' }} />;
  }
}

export function AgentIconBox({
  agentId,
  size = 'md',
}: {
  agentId: AgentId;
  size?: 'sm' | 'md' | 'lg';
}) {
  const boxSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-lg',
    lg: 'w-12 h-12 rounded-xl',
  };
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`${boxSizes[size]} bg-[#101522] border border-[#252D40] flex items-center justify-center shrink-0`}
    >
      <AgentIcon agentId={agentId} className={iconSizes[size]} />
    </div>
  );
}
