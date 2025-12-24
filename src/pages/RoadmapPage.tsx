import { PageLayout } from '@/components/PageLayout';
import { Sparkles, Chrome, Compass, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const phases = [
  {
    status: 'now',
    title: 'V1: Decision Engine',
    icon: Sparkles,
    description: 'A working recommendation engine for credit card usage at any merchant.',
    details: [
      'Rule-based merchant classification',
      'Curated card reward database',
      'Known exclusion handling',
      'Confidence-level transparency',
      'Privacy-first design (no data leaves your device)',
    ],
  },
  {
    status: 'next',
    title: 'V2: Browser Extension',
    icon: Chrome,
    description: 'The same logic, delivered automatically at checkout.',
    details: [
      'Automatic merchant detection on checkout pages',
      'Non-intrusive recommendation popup',
      'Same privacy guarantees (local processing only)',
      'Works with the cards you have already selected',
    ],
  },
  {
    status: 'later',
    title: 'V3: Credit Guidance',
    icon: Compass,
    description: 'Broader context for smarter credit decisions over time.',
    details: [
      'Sign-up bonus tracking (opt-in)',
      'Annual fee value analysis',
      'Category spending patterns',
      'Outcome-focused recommendations',
    ],
  },
];

export default function RoadmapPage() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Where we are going
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CardClutch is designed to evolve carefully. Each phase builds on the last without compromising the core principles of accuracy, privacy, and restraint.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-8">
            {phases.map((phase) => (
              <div 
                key={phase.title}
                className={`glass-card rounded-2xl p-6 md:p-8 ${
                  phase.status === 'now' ? 'border-primary/50' : ''
                }`}
              >
                <div className="flex items-start gap-4 md:gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    phase.status === 'now' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <phase.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-display text-xl md:text-2xl font-bold">
                        {phase.title}
                      </h2>
                      {phase.status === 'now' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          Current
                        </span>
                      )}
                      {phase.status === 'next' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                          Next
                        </span>
                      )}
                      {phase.status === 'later' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                          Future
                        </span>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-4">
                      {phase.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {phase.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            phase.status === 'now' ? 'bg-primary' : 'bg-muted-foreground'
                          }`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Note */}
      <section className="py-16 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-6">
            No timelines. No promises.
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We do not commit to deadlines because we prioritize getting it right over shipping fast. Each phase will launch when it meets our standards for accuracy, privacy, and user trust. If something takes longer, it takes longer.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Start with V1 today
          </h2>
          <p className="text-muted-foreground mb-8">
            The decision engine is live and ready to use.
          </p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Try CardClutch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
