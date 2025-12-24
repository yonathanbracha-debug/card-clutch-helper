import { PageLayout } from '@/components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Founders() {
  return (
    <PageLayout>
      <section className="py-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-6">
            Built by someone who needed it
          </h1>

          <div className="surface-primary rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="font-semibold text-muted-foreground">JD</span>
              </div>
              <div>
                <h2 className="font-semibold">Jayden Dao</h2>
                <p className="text-sm text-muted-foreground">Founder</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              I am a first-generation college student. When I got my first credit card, no one explained how rewards worked, what categories meant, or why using the wrong card for groceries was costing me money.
            </p>
            <p>
              I figured it out eventually—by reading fine print, making spreadsheets, and wasting hundreds of dollars in rewards I could have earned. Most people do not have the time or interest to do that.
            </p>
            <p>
              The tools that exist are designed to sell you more credit products. They profit from your confusion. I wanted to build something that just helps—no accounts, no data harvesting, no affiliate links.
            </p>
            <p>
              CardClutch is the tool I wished existed when I was starting out. It is small and focused on purpose. The goal is not to be everything—it is to be right at the moment it matters.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-border">
            <h2 className="font-semibold mb-4">Values guiding every decision</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Accuracy over ambition.</strong> We would rather say "we do not know" than guess.</p>
              <p><strong className="text-foreground">Privacy by design.</strong> We do not need your data to help you.</p>
              <p><strong className="text-foreground">Restraint as a feature.</strong> We avoid features that compromise trust or add complexity.</p>
              <p><strong className="text-foreground">User protection first.</strong> If a feature could harm users, we do not build it.</p>
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