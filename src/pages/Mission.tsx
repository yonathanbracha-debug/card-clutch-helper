import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { WaitlistForm } from '@/components/WaitlistForm';
import { cn } from '@/lib/utils';

const phases = [
  {
    status: 'Current',
    title: 'V1: Decision Engine',
    items: [
      'Rule-based merchant classification',
      'Curated card reward database',
      'Known exclusion handling',
      'Confidence-level transparency',
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

export default function Mission() {
  useScrollToHash();
  
  return (
    <div className="min-h-screen bg-background">
      <AmbientBackground />
      <Header />
      
      <main className="pt-14 pb-16 relative z-10">
        <div className="max-w-2xl mx-auto px-6">
          {/* Hero */}
          <section className="py-20">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-6">
              Mission
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-foreground leading-tight mb-8">
              Credit damage happens at the moment of decision—not after.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Millions of people harm their financial futures not because they are irresponsible, 
              but because no one told them which decisions matter, or when.
            </p>
          </section>

          {/* What is broken */}
          <section className="py-16 border-t border-border">
            <h2 className="text-lg font-medium text-foreground mb-8">What is broken</h2>
            <div className="space-y-0">
              {[
                {
                  title: 'Credit scores report damage—they do not prevent it.',
                  description: 'A number after the fact does not help you at the moment of decision.'
                },
                {
                  title: 'Small mistakes compound.',
                  description: 'Using the wrong card once does not matter. Doing it for years costs thousands.'
                },
                {
                  title: 'The knowledge gap is real.',
                  description: 'First-generation students, young adults, and immigrants learn credit rules the hard way.'
                },
                {
                  title: 'Existing tools profit from confusion.',
                  description: 'Most "free" credit tools make money by selling you more credit products.'
                },
              ].map((item, index, arr) => (
                <div 
                  key={index}
                  className={cn(
                    "grid md:grid-cols-12 gap-4 py-6",
                    index !== arr.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="md:col-span-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="md:col-span-11">
                    <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What we believe */}
          <section className="py-16 border-t border-border">
            <h2 className="text-lg font-medium text-foreground mb-8">What we believe</h2>
            <div className="space-y-4">
              {[
                'Guidance should happen before the decision, not after.',
                'Simplicity is a feature. If someone needs a spreadsheet, you have failed.',
                'Privacy is non-negotiable. We do not need your data to help you.',
                'Conservative accuracy over aggressive promises.',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2.5 shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <section id="roadmap" className="py-16 border-t border-border scroll-mt-20">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Roadmap
            </p>
            <h2 className="text-2xl font-light text-foreground mb-3">
              Where we are going
            </h2>
            <p className="text-muted-foreground mb-10">
              Each phase builds on the last without compromising accuracy, privacy, or restraint.
            </p>

            <div className="space-y-4">
              {phases.map((phase) => (
                <div 
                  key={phase.title}
                  className="p-5 rounded border border-border bg-card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className={cn(
                      "font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded",
                      phase.status === 'Current' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground'
                    )}>
                      {phase.status}
                    </span>
                    <h3 className="font-medium text-foreground">{phase.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="font-mono text-xs text-muted-foreground mt-8">
              No timelines. No promises. Each phase launches when it meets our standards.
            </p>
          </section>

          {/* Waitlist */}
          <section className="py-16 border-t border-border">
            <h3 className="text-lg font-medium text-foreground mb-3">Join the waitlist</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to know when new features launch.
            </p>
            <div className="max-w-sm">
              <WaitlistForm variant="inline" />
            </div>
          </section>

          {/* CTA */}
          <section className="py-8 border-t border-border">
            <Link 
              to="/analyze"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Try the decision engine
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
