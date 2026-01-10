/**
 * InteractiveCapabilities - Premium accordion-style capabilities section
 * Two-column on desktop: list left, expanded content right
 * Standard accordion on mobile
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  Clock, 
  MessageSquare, 
  Library, 
  Shield, 
  Database,
  ChevronRight,
  Check
} from 'lucide-react';

const capabilities = [
  {
    id: 'analyzer',
    icon: CreditCard,
    title: 'Best card for a purchase',
    summary: 'Paste a merchant URL, see which card earns the most.',
    bullets: [
      'Automatic merchant detection from URL',
      'Matches against your saved card catalog',
      'Shows reward multipliers and bonus categories',
      'Explains why a card wins'
    ],
    example: 'Paste target.com → "Use Amex Blue Cash (6% groceries) instead of Chase Freedom (1%)"'
  },
  {
    id: 'utilization',
    icon: Clock,
    title: 'Utilization and payment timing',
    summary: 'Understand when to pay and how it affects your score.',
    bullets: [
      'Statement date vs due date explained',
      'Optimal payment timing strategies',
      'Multi-card utilization math',
      'Reporting date awareness'
    ],
    example: 'Pay before statement closes to report lower utilization, not on due date.'
  },
  {
    id: 'ask',
    icon: MessageSquare,
    title: 'Ask Credit AI',
    summary: 'Get grounded answers with sources when available.',
    bullets: [
      'Conservative, explainable responses',
      'Cites issuer documentation when known',
      'Admits uncertainty clearly',
      'No hallucinated advice'
    ],
    example: '"What\'s the Chase 5/24 rule?" → Explains with Chase terms reference.'
  },
  {
    id: 'catalog',
    icon: Library,
    title: 'Card catalog and filtering',
    summary: 'Browse and compare cards with transparent data.',
    bullets: [
      'Annual fees, reward structures, perks',
      'Filter by category, issuer, or network',
      'See bonus categories at a glance',
      'Data verified against issuer sources'
    ],
    example: 'Filter to "travel cards under $100 annual fee" with 3x+ on dining.'
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy and security posture',
    summary: 'No bank connections. Your data stays local.',
    bullets: [
      'No Plaid or transaction scraping',
      'Card info stored only if you choose',
      'No selling of user data',
      'Open about what we collect'
    ],
    example: 'Use the analyzer without logging in. We never see your transactions.'
  },
  {
    id: 'admin',
    icon: Database,
    title: 'Data trust and verification',
    summary: 'Admin tools ensure recommendation accuracy.',
    bullets: [
      'Merchant category verification',
      'Reward rule auditing',
      'Stale data detection',
      'User report handling'
    ],
    example: 'Internal: flag when a card\'s category data is 90+ days old.'
  }
];

interface InteractiveCapabilitiesProps {
  className?: string;
}

export function InteractiveCapabilities({ className }: InteractiveCapabilitiesProps) {
  const [activeId, setActiveId] = useState<string>('analyzer');
  const activeCapability = capabilities.find(c => c.id === activeId) || capabilities[0];

  return (
    <section className={cn("py-24 border-t border-border", className)}>
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="font-mono-accent text-xs uppercase tracking-wider text-primary mb-4 block">
            Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What CardClutch does
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Focused tools for better credit decisions. No fluff.
          </p>
        </div>

        {/* Desktop: Two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-8">
          {/* Left: List */}
          <div className="col-span-2 space-y-1">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              const isActive = activeId === capability.id;
              return (
                <button
                  key={capability.id}
                  onClick={() => setActiveId(capability.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    isActive 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-card border border-transparent"
                  )}
                  aria-expanded={isActive}
                >
                  <Icon className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {capability.title}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 shrink-0 transition-all",
                    isActive ? "text-primary rotate-0" : "text-muted-foreground/50 -rotate-90"
                  )} />
                </button>
              );
            })}
          </div>

          {/* Right: Expanded content panel */}
          <div className="col-span-3">
            <div className="glass-panel rounded-xl p-8 min-h-[320px]">
              <div className="flex items-center gap-3 mb-4">
                <activeCapability.icon className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">
                  {activeCapability.title}
                </h3>
              </div>
              
              <p className="text-muted-foreground mb-6">
                {activeCapability.summary}
              </p>
              
              <ul className="space-y-3 mb-6">
                {activeCapability.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/90">{bullet}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono-accent uppercase tracking-wider text-primary/70">Example: </span>
                  {activeCapability.example}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Stacked accordion */}
        <div className="lg:hidden space-y-2">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            const isActive = activeId === capability.id;
            return (
              <div 
                key={capability.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setActiveId(isActive ? '' : capability.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
                    isActive ? "bg-card" : "bg-transparent hover:bg-card/50"
                  )}
                  aria-expanded={isActive}
                  aria-controls={`panel-${capability.id}`}
                >
                  <Icon className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {capability.title}
                    </p>
                    {!isActive && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {capability.summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-200",
                    isActive ? "rotate-90 text-primary" : "text-muted-foreground/50"
                  )} />
                </button>
                
                <div
                  id={`panel-${capability.id}`}
                  className={cn(
                    "overflow-hidden transition-all duration-250 ease-out",
                    isActive ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-4 pb-4 pt-2 border-t border-border/50">
                    <ul className="space-y-2 mb-4">
                      {capability.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">
                      <span className="font-mono-accent uppercase tracking-wider text-primary/70">Example: </span>
                      {capability.example}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
