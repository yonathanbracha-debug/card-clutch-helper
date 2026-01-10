import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Compass, Rocket } from 'lucide-react';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { WaitlistForm } from '@/components/WaitlistForm';
import { cn } from '@/lib/utils';

const phases = [
  {
    status: 'Current',
    title: 'V1: Decision Engine',
    icon: Target,
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
    icon: Compass,
    items: [
      'Automatic merchant detection at checkout',
      'Non-intrusive recommendation popup',
      'Same privacy guarantees',
    ],
  },
  {
    status: 'Later',
    title: 'V3: Credit Guidance',
    icon: Rocket,
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
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container-main py-12">
          {/* Hero */}
          <section className="py-16 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium mb-6">
              <Target className="w-3 h-3" />
              Mission
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-8">
              Credit damage happens at the moment of decision—not after.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Millions of people harm their financial futures not because they are irresponsible, 
              but because no one told them which decisions matter, or when.
            </p>
          </section>

          {/* What is broken */}
          <section className="py-16 border-t border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-10">What is broken</h2>
            <div className="grid md:grid-cols-2 gap-6">
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
              ].map((item, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-2xl border border-border bg-card"
                >
                  <div className="text-xs text-muted-foreground font-medium mb-3">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What we believe */}
          <section className="py-16 border-t border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-10">What we believe</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Guidance should happen before the decision, not after.',
                'Simplicity is a feature. If someone needs a spreadsheet, you have failed.',
                'Privacy is non-negotiable. We do not need your data to help you.',
                'Conservative accuracy over aggressive promises.',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <section id="roadmap" className="py-16 border-t border-border scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium mb-4">
              Roadmap
            </div>
            <h2 className="text-3xl font-semibold text-foreground mb-3">
              Where we are going
            </h2>
            <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
              Each phase builds on the last without compromising accuracy, privacy, or restraint.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {phases.map((phase) => (
                <div 
                  key={phase.title}
                  className={cn(
                    "p-6 rounded-2xl border bg-card",
                    phase.status === 'Current' 
                      ? 'border-primary/30 ring-1 ring-primary/10' 
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      phase.status === 'Current' ? 'bg-primary/10' : 'bg-secondary'
                    )}>
                      <phase.icon className={cn(
                        "w-5 h-5",
                        phase.status === 'Current' ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <span className={cn(
                        "text-xs font-medium uppercase tracking-wider",
                        phase.status === 'Current' 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      )}>
                        {phase.status}
                      </span>
                      <h3 className="font-semibold text-foreground">{phase.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mt-10">
              No timelines. No promises. Each phase launches when it meets our standards.
            </p>
          </section>

          {/* Waitlist */}
          <section className="py-16 border-t border-border">
            <div className="max-w-md">
              <h3 className="text-2xl font-semibold text-foreground mb-3">Join the waitlist</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to know when new features launch.
              </p>
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