import { PageLayout } from '@/components/PageLayout';
import { AlertTriangle, TrendingDown, Users, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Mission() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Credit is broken.
            <br />
            <span className="text-muted-foreground">We're fixing when it matters.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Millions of people damage their financial futures not because they're irresponsible—but because no one told them which decisions matter, or when.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-12 text-center">
            What's actually broken
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Scores aren't guidance
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Credit scores tell you what happened. They don't tell you what to do next. A number without context is useless at the moment you're about to make a decision.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Small mistakes compound
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Using the wrong card once doesn't matter. Doing it for years costs thousands in lost rewards and missed opportunities—money that never comes back.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                The knowledge gap is real
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                First-generation students, young adults, and immigrants often learn credit rules the hard way. There's no system teaching them the basics before damage is done.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Existing tools profit from confusion
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Most "free" credit tools make money by selling you more credit products. Their incentive isn't to help you—it's to convert you into a lead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Belief */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            What we believe
          </h2>
          
          <div className="space-y-6 text-left">
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
              <p className="text-lg text-muted-foreground">
                <span className="text-foreground font-medium">Guidance should happen before the decision, not after.</span> A credit score after the fact doesn't prevent the mistake.
              </p>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
              <p className="text-lg text-muted-foreground">
                <span className="text-foreground font-medium">Simplicity is a feature.</span> If someone has to read a spreadsheet to use your tool, you've failed.
              </p>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
              <p className="text-lg text-muted-foreground">
                <span className="text-foreground font-medium">Privacy is non-negotiable.</span> We don't need your data to help you. We don't want it.
              </p>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
              <p className="text-lg text-muted-foreground">
                <span className="text-foreground font-medium">Conservative accuracy over aggressive promises.</span> We'd rather say "we don't know" than guess wrong.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            See how it works
          </h2>
          <p className="text-muted-foreground mb-8">
            Try the decision engine yourself. No signup, no data collection.
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
