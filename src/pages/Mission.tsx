import { PageLayout } from '@/components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { WaitlistForm } from '@/components/WaitlistForm';

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

export default function Mission() {
  useScrollToHash();
  
  return (
    <PageLayout>
      <section className="py-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-balance">
            Credit damage happens at the moment of decision—not after.
          </h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              Millions of people harm their financial futures not because they are irresponsible, but because no one told them which decisions matter, or when.
            </p>

            <h2 className="text-xl font-semibold mt-10 mb-4">What is broken</h2>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Credit scores report damage—they do not prevent it.</strong> A number after the fact does not help you at the moment you are about to make a decision.
              </p>
              <p>
                <strong className="text-foreground">Small mistakes compound.</strong> Using the wrong card once does not matter. Doing it for years costs thousands in lost rewards and missed opportunities—money that never comes back.
              </p>
              <p>
                <strong className="text-foreground">The knowledge gap is real.</strong> First-generation students, young adults, and immigrants often learn credit rules the hard way. There is no system teaching them before damage is done.
              </p>
              <p>
                <strong className="text-foreground">Existing tools profit from confusion.</strong> Most "free" credit tools make money by selling you more credit products. Their incentive is not to help you—it is to convert you into a lead.
              </p>
            </div>

            <h2 className="text-xl font-semibold mt-10 mb-4">What we believe</h2>
            
            <div className="space-y-3 text-muted-foreground">
              <p>Guidance should happen before the decision, not after.</p>
              <p>Simplicity is a feature. If someone needs a spreadsheet to use your tool, you have failed.</p>
              <p>Privacy is non-negotiable. We do not need your data to help you.</p>
              <p>Conservative accuracy over aggressive promises. We would rather say "we do not know" than guess wrong.</p>
            </div>
          </div>

          {/* Roadmap Section */}
          <section id="roadmap" className="mt-16 pt-12 border-t border-border scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Where we are going
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Each phase builds on the last without compromising accuracy, privacy, or restraint.
            </p>

            <div className="space-y-6">
              {phases.map((phase) => (
                <div 
                  key={phase.title}
                  className="rounded-lg p-6 bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      phase.status === 'Current' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {phase.status}
                    </span>
                    <h3 className="font-semibold">{phase.title}</h3>
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
          </section>

          {/* Waitlist section */}
          <div className="mt-16 pt-12 border-t border-border">
            <h3 className="text-xl font-semibold mb-3">Join the waitlist</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to know when new features launch.
            </p>
            <div className="max-w-md">
              <WaitlistForm variant="inline" />
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link 
              to="/analyze"
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