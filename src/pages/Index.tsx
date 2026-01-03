import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Target, ChevronRight, CreditCard, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/CardImage';
import { WaitlistForm } from '@/components/WaitlistForm';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { 
  ContainerScrollShowcase, 
  FeatureHoverSection, 
  BentoGridSection, 
  TestimonialSection 
} from '@/components/marketing';

const Index = () => {
  const { cards: allCards, loading } = useCreditCards();
  const { startWithDemo, demoCardIds } = useUnifiedWallet();
  
  // Get demo cards for preview
  const demoCards = allCards.filter(c => demoCardIds.includes(c.id)).slice(0, 3);
  const featuredCards = allCards.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="container max-w-6xl mx-auto px-4 py-24 md:py-32 relative">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="outline" className="mb-4">
                No sign-up required to try
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Right card.{' '}
                <span className="text-primary">Right moment.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                Know exactly which card maximizes your rewards before you pay. 
                Verified data. No guesswork.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/analyze">
                  <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25">
                    Try the Analyzer
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/cards">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    Browse Cards
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Earn more. Stress less. Stay in control.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Demo CTA */}
        <section className="border-t border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Try it instantly</h3>
                <p className="text-muted-foreground text-sm">
                  Use our demo wallet with popular cards and analyze any shopping URL right now.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {demoCards.length > 0 && (
                  <div className="hidden sm:flex -space-x-2">
                    {demoCards.map(card => (
                      <CardImage 
                        key={card.id}
                        issuer={card.issuer_name}
                        cardName={card.name}
                        network={card.network}
                        imageUrl={card.image_url}
                        size="sm"
                        className="ring-2 ring-background"
                      />
                    ))}
                  </div>
                )}
                <Link to="/analyze" onClick={() => startWithDemo()}>
                  <Button className="gap-2">
                    Start Demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase with Scroll Animation */}
        <ContainerScrollShowcase />

        {/* Feature Pillars with Hover Effects */}
        <FeatureHoverSection />

        {/* Bento Grid Features */}
        <BentoGridSection />

        {/* Testimonials */}
        <TestimonialSection />

        {/* Trust & Privacy */}
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

        {/* Final CTA + Waitlist */}
        <section className="border-t border-border bg-primary/5">
          <div className="container max-w-6xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Don't let the credit system use you.
                </h2>
                <p className="text-muted-foreground">
                  Try it now — no sign-up required. Save your wallet when you're ready.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link to="/analyze">
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      Try the Analyzer
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/wallet">
                    <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                      Build My Wallet
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                <h3 className="font-semibold mb-2">Get Early Access</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be first to know when new features drop.
                </p>
                <WaitlistForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
