/**
 * TrustGrid - 3-item trust section replacing testimonials
 * Includes disclaimer
 */
import { cn } from '@/lib/utils';
import { Shield, Lightbulb, Lock } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

const trustItems = [
  {
    icon: Shield,
    title: 'Conservative defaults',
    description: 'We err on the side of caution. If we\'re unsure about a merchant category or reward rule, we say so.',
  },
  {
    icon: Lightbulb,
    title: 'Explainable recommendations',
    description: 'Every suggestion comes with reasoning. You see exactly why we recommend a specific card.',
  },
  {
    icon: Lock,
    title: 'Privacy-first',
    description: 'No bank connections. No transaction scraping. Your financial data stays with you.',
  },
];

interface TrustGridProps {
  className?: string;
}

export function TrustGrid({ className }: TrustGridProps) {
  return (
    <section className={cn("py-24 border-t border-border", className)}>
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="font-mono text-xs uppercase tracking-wider text-primary mb-4 block">
            Trust
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for confidence
          </h2>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <GlassPanel key={index} hover>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </GlassPanel>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground/60 font-mono">
            Informational only. Not financial advice.
          </p>
        </div>
      </div>
    </section>
  );
}
