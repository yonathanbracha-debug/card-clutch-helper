import { PageLayout } from '@/components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';

export default function Product() {
  return (
    <PageLayout>
      <section className="py-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            How the engine thinks
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            CardClutch uses deterministic rules—not black-box AI—to recommend which card to use.
          </p>

          <div className="space-y-8">
            <div>
              <h2 className="font-semibold mb-2">1. Merchant identification</h2>
              <p className="text-muted-foreground text-sm">
                When you paste a URL, CardClutch extracts the domain and checks it against a curated database of known merchants. We maintain mappings for major retailers, restaurants, grocery stores, and travel providers.
              </p>
            </div>

            <div>
              <h2 className="font-semibold mb-2">2. Category classification</h2>
              <p className="text-muted-foreground text-sm">
                Each merchant is mapped to a spending category: dining, groceries, travel, gas, streaming, and more. For unknown merchants, we default to "General Purchase" rather than guess.
              </p>
            </div>

            <div>
              <h2 className="font-semibold mb-2">3. Reward calculation</h2>
              <p className="text-muted-foreground text-sm">
                For each card in your wallet, we calculate the effective reward rate for that category. We apply known exclusions (like Amex Gold not earning 4x at Costco) and compare all options.
              </p>
            </div>

            <div>
              <h2 className="font-semibold mb-2">4. Confidence signaling</h2>
              <p className="text-muted-foreground text-sm">
                Every recommendation includes a confidence level. Known merchants get "high." Unknown merchants default to "low"—and we tell you. Transparency matters more than appearing certain.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="font-semibold mb-4">What CardClutch does not do</h2>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Track your spending</span>
                  <span className="text-muted-foreground"> — We do not know what you buy.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Connect to your bank</span>
                  <span className="text-muted-foreground"> — No Plaid. No data aggregation.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Recommend new cards</span>
                  <span className="text-muted-foreground"> — We help you use what you have.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Provide financial advice</span>
                  <span className="text-muted-foreground"> — We show reward rates, not debt strategies.</span>
                </div>
              </div>
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