import { PageLayout } from '@/components/PageLayout';
import { 
  BentoGridSection, 
  FeatureHoverSection 
} from '@/components/marketing';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Features() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Everything you need to{' '}
            <span className="text-primary">maximize rewards</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            CardClutch gives you the tools to make smarter credit decisions—without the complexity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analyze">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Try the Analyzer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/cards">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                Browse Cards
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <FeatureHoverSection />

      {/* Bento Grid */}
      <BentoGridSection />

      {/* Trust Section */}
      <section className="border-t border-border bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Shield className="w-12 h-12 text-primary mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Privacy First</h2>
              <p className="text-muted-foreground mb-6">
                We don't store your URLs, track your purchases, or sell your data. 
                Your wallet stays yours. Period.
              </p>
              <div className="space-y-3">
                {[
                  'No purchase tracking',
                  'No data selling',
                  'Encrypted storage',
                  'You control your data',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="font-semibold mb-4">Why CardClutch?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Maximize Every Swipe</p>
                    <p className="text-xs text-muted-foreground">Know the best card for every purchase</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Verified Data</p>
                    <p className="text-xs text-muted-foreground">Sourced from official issuer terms</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Built for You</p>
                    <p className="text-xs text-muted-foreground">By people who actually use credit cards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
