/**
 * PhilosophySection - Sticky left visual with scroll-right narrative blocks
 * CSS-only abstract visual (gradient + grid + rings)
 */
import { cn } from '@/lib/utils';
import { GlassPanel } from './GlassPanel';

const philosophyBlocks = [
  {
    number: '01',
    title: 'Why credit feels confusing',
    description: 'Every card has different rules, categories, and exceptions. Statement dates differ from due dates. Points expire. It\'s designed to be complex—and that complexity costs you money.',
  },
  {
    number: '02',
    title: 'Discipline beats guessing',
    description: 'The best approach isn\'t chasing every bonus. It\'s knowing exactly which card to use at which merchant, every time. Consistency compounds.',
  },
  {
    number: '03',
    title: 'Clarity and control',
    description: 'We surface the rules clearly, explain the timing, and let you make informed decisions. No tricks. No urgency. Just information when you need it.',
  },
];

interface PhilosophySectionProps {
  className?: string;
}

export function PhilosophySection({ className }: PhilosophySectionProps) {
  return (
    <section className={cn("py-24 border-t border-border", className)}>
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Sticky abstract visual */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Grid background */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />
              
              {/* Concentric rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-full border border-border/30" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1/2 h-1/2 rounded-full border border-border/40" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1/4 h-1/4 rounded-full border border-border/50 bg-primary/5" />
              </div>
              
              {/* Center gradient glow */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.15) 0%, transparent 50%)'
                }}
              />
              
              {/* Corner accent lines */}
              <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-primary/50 to-transparent" />
              <div className="absolute top-0 left-0 w-px h-16 bg-gradient-to-b from-primary/50 to-transparent" />
              <div className="absolute bottom-0 right-0 w-16 h-px bg-gradient-to-l from-primary/50 to-transparent" />
              <div className="absolute bottom-0 right-0 w-px h-16 bg-gradient-to-t from-primary/50 to-transparent" />
            </div>
          </div>

          {/* Right: Philosophy blocks */}
          <div className="space-y-8">
            <div className="mb-12">
              <span className="font-mono text-xs uppercase tracking-wider text-primary mb-4 block">
                Philosophy
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                A different approach to credit
              </h2>
            </div>

            {philosophyBlocks.map((block) => (
              <GlassPanel key={block.number} hover className="group">
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-primary/60 shrink-0">
                    {block.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {block.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {block.description}
                    </p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
