import { PageLayout } from '@/components/PageLayout';
import { Heart, Target, Shield, Scale, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Founders() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Built by someone who needed it
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CardClutch exists because the founder lived the problem—and couldn't find a solution that wasn't trying to sell something.
          </p>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-3xl mx-auto">
          <div className="glass-card rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-3xl font-bold text-primary">JD</span>
              </div>
              
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold mb-2">
                  Jayden Dao
                </h2>
                <p className="text-muted-foreground mb-6">
                  Founder & Builder
                </p>
                
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    I'm a first-generation college student. When I got my first credit card, no one explained how rewards worked, what categories meant, or why using the wrong card for groceries was costing me money.
                  </p>
                  <p>
                    I figured it out eventually—by reading fine print, making spreadsheets, and wasting hundreds of dollars in rewards I could have earned. Most people don't have the time or interest to do that.
                  </p>
                  <p>
                    The tools that exist are designed to sell you more credit products. They profit from your confusion. I wanted to build something that just helps—no accounts, no data harvesting, no affiliate links.
                  </p>
                  <p>
                    CardClutch is the tool I wished existed when I was starting out. It's small and focused on purpose. The goal isn't to be everything—it's to be right at the moment it matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-12 text-center">
            Values that guide every decision
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  Accuracy over ambition
                </h3>
                <p className="text-muted-foreground">
                  We'd rather say "we don't know" than guess. Every recommendation should be defensible.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  Privacy by design
                </h3>
                <p className="text-muted-foreground">
                  We don't need your data to help you. The product works entirely in your browser.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  Restraint as a feature
                </h3>
                <p className="text-muted-foreground">
                  We deliberately avoid features that would compromise trust or add complexity without clear benefit.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  User protection first
                </h3>
                <p className="text-muted-foreground">
                  If a feature could harm users or erode trust, we don't build it—even if it's profitable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            See the product in action
          </h2>
          <p className="text-muted-foreground mb-8">
            No signup required. Just paste a URL and get a recommendation.
          </p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Try the demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
