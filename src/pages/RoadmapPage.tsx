import { PageLayout } from '@/components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const phases = [
  {
    status: 'Current',
    title: 'V1: Decision Engine',
    items: [
      'Rule-based merchant classification',
      'Curated card reward database',
      'Known exclusion handling',
      'Confidence-level transparency',
      'Privacy-first design',
    ],
  },
  {
    status: 'Next',
    title: 'V2: Browser Extension',
    items: [
      'Automatic merchant detection at checkout',
      'Non-intrusive recommendation popup',
      'Same privacy guarantees',
    ],
  },
  {
    status: 'Later',
    title: 'V3: Credit Guidance',
    items: [
      'Sign-up bonus tracking (opt-in)',
      'Annual fee value analysis',
      'Outcome-focused recommendations',
    ],
  },
];

export default function RoadmapPage() {
  return (
    <PageLayout>
      <section className="py-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            Where we are going
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            Each phase builds on the last without compromising accuracy, privacy, or restraint.
          </p>

          <div className="space-y-6">
            {phases.map((phase) => (
              <div 
                key={phase.title}
                className="surface-primary rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    phase.status === 'Current' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {phase.status}
                  </span>
                  <h2 className="font-semibold">{phase.title}</h2>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              No timelines. No promises. Each phase launches when it meets our standards for accuracy, privacy, and user trust.
            </p>
          </div>

          <div className="mt-8">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Try the decision engine
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}