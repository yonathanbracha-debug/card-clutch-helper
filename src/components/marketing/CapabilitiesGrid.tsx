/**
 * CapabilitiesGrid - 3-column bordered grid for core features
 * Aura-style with grid borders
 */
import { cn } from '@/lib/utils';
import { CreditCard, Clock, MessageSquare } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

const capabilities = [
  {
    icon: CreditCard,
    title: 'Best card for this purchase',
    description: 'Paste a merchant URL, see which card from your wallet earns the most rewards. No guessing required.',
  },
  {
    icon: Clock,
    title: 'Payment timing and utilization',
    description: 'Understand when to pay, how utilization is calculated, and how timing affects your credit profile.',
  },
  {
    icon: MessageSquare,
    title: 'Ask Credit AI',
    description: 'Get conservative, explainable answers to credit questions. We tell you what we know—and what we don\'t.',
  },
];

interface CapabilitiesGridProps {
  className?: string;
}

export function CapabilitiesGrid({ className }: CapabilitiesGridProps) {
  return (
    <section className={cn("py-24 border-t border-border", className)}>
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="font-mono text-xs uppercase tracking-wider text-primary mb-4 block">
            Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What CardClutch does
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three focused tools to help you make better credit decisions.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <div 
                key={index}
                className="bg-card p-8 group hover:bg-card-hover transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {capability.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {capability.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
