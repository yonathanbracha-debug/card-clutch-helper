import { PageLayout } from '@/components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Mission() {
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

          <div className="mt-12 pt-8 border-t border-border">
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