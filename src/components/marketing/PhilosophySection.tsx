/**
 * PhilosophySection - Clean narrative blocks without the big square
 * Typography-focused with subtle visual accents
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
      <div className="container max-w-4xl mx-auto px-4">
        {/* Section header - centered */}
        <div className="text-center mb-16">
          <span className="font-mono-accent text-xs uppercase tracking-wider text-primary mb-4 block">
            Philosophy
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            A different approach to credit
          </h2>
        </div>

        {/* Philosophy blocks - clean vertical stack */}
        <div className="space-y-6">
          {philosophyBlocks.map((block, index) => (
            <div 
              key={block.number}
              className={cn(
                "relative pl-8 md:pl-12 py-6",
                index !== philosophyBlocks.length - 1 && "border-b border-border/50"
              )}
            >
              {/* Number accent */}
              <span className="absolute left-0 top-6 font-mono-accent text-sm text-primary/40">
                {block.number}
              </span>
              
              {/* Vertical line accent */}
              <div className="absolute left-5 md:left-7 top-8 bottom-0 w-px bg-gradient-to-b from-primary/20 to-transparent" />
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {block.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {block.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
