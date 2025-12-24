import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Target, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="container max-w-6xl mx-auto px-4 py-24 md:py-32 relative">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Don't let the credit system use you.{' '}
                <span className="text-primary">Use it.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                Know the right card before you pay. CardClutch helps you maximize rewards with verified, accurate card data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/recommend">
                  <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25">
                    Get a Recommendation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/vault">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    Build My Wallet
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Built for students, first-gen credit builders, and anyone who wants to spend smarter.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-border bg-card/50">
          <div className="container max-w-6xl mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Three steps to smarter spending</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Add Your Cards',
                  description: 'Select the credit cards you own. We support 50+ major cards with verified reward structures.',
                  icon: Target,
                },
                {
                  step: '02',
                  title: 'Paste Any URL',
                  description: 'Shopping somewhere? Paste the URL and we detect the merchant category automatically.',
                  icon: Zap,
                },
                {
                  step: '03',
                  title: 'Get Your Answer',
                  description: 'See exactly which card to use, why, and what exclusions might apply.',
                  icon: Shield,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group">
                    <span className="text-xs font-mono text-primary/60 mb-4 block">{item.step}</span>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Privacy Promise */}
        <section className="border-t border-border">
          <div className="container max-w-6xl mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Privacy First</h2>
              <p className="text-muted-foreground mb-8">
                CardClutch runs entirely in your browser. We don't store your URLs, track your purchases, or sell your data. Your wallet stays yours.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span className="px-4 py-2 rounded-full bg-muted">No tracking</span>
                <span className="px-4 py-2 rounded-full bg-muted">No selling data</span>
                <span className="px-4 py-2 rounded-full bg-muted">Client-side only</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-primary/5">
          <div className="container max-w-6xl mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Ready to maximize your rewards?</h2>
                <p className="text-muted-foreground">Start by adding your cards to your wallet.</p>
              </div>
              <Link to="/vault">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;