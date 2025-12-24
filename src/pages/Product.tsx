import { PageLayout } from '@/components/PageLayout';
import { Search, Tag, Calculator, HelpCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Product() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            How the engine thinks
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CardClutch uses deterministic rules—not black-box AI—to recommend which card to use. Here's exactly how it works.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-12 text-center">
            The recommendation process
          </h2>
          
          <div className="space-y-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    1. Merchant identification
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you paste a URL, CardClutch extracts the domain and checks it against a curated database of known merchants. We maintain mappings for major retailers, restaurants, grocery stores, and travel providers.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    2. Category classification
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Each merchant is mapped to a spending category: dining, groceries, travel, gas, streaming, and more. This classification determines which card rewards apply. For unknown merchants, we attempt pattern-based inference, but default to "General Purchase" when uncertain.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    3. Reward calculation
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    For each card in your wallet, we calculate the effective reward rate for that category. We apply known exclusions (like Amex Gold's grocery bonus not applying at Costco or Walmart) and compare all options to find your highest-earning card.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    4. Confidence signaling
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every recommendation includes a confidence level. Known merchants get "high confidence." Pattern-matched merchants get "medium." Unknown merchants default to "low"—and we tell you. Transparency matters more than appearing certain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Known Exclusions */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
            We respect the fine print
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Credit card rewards have exceptions. We track them so you don't have to.
          </p>
          
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <h3 className="font-display text-lg font-semibold mb-4">Example exclusions we handle:</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground">
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span>Amex Gold 4x groceries <strong className="text-foreground">does not apply</strong> at Costco, Sam's Club, Walmart, or Target</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span>Warehouse clubs are classified separately from grocery stores</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Apple Card 3% applies only at Apple and select partners (Uber, Walgreens, T-Mobile)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What We Don't Do */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
            What CardClutch does not do
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Restraint is a feature. Here's what we deliberately avoid.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Track your spending</p>
                <p className="text-sm text-muted-foreground">We don't know what you buy. We don't want to.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Connect to your bank</p>
                <p className="text-sm text-muted-foreground">No account linking. No Plaid. No data aggregation.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Recommend new cards</p>
                <p className="text-sm text-muted-foreground">We help you use what you have. We're not an affiliate marketplace.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Provide financial advice</p>
                <p className="text-sm text-muted-foreground">We show reward rates. We don't tell you how to manage debt.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Use AI for decisions</p>
                <p className="text-sm text-muted-foreground">All logic is rule-based and auditable. No black boxes.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Sell your data</p>
                <p className="text-sm text-muted-foreground">We don't collect it. There's nothing to sell.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Try it yourself
          </h2>
          <p className="text-muted-foreground mb-8">
            Select your cards, paste a checkout URL, and see the logic in action.
          </p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Open the demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
