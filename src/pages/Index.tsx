/**
 * Index - Homepage with Aura-style design
 * Deep dark aesthetic with glass panels, gradient blobs, and bordered grid
 */
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WaitlistForm } from '@/components/WaitlistForm';
import { 
  AmbientBackground, 
  HeroDashboardMock,
  CapabilitiesGrid,
  PhilosophySection,
  TrustGrid 
} from '@/components/marketing/AuraIndex';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background dark aura-mode">
      {/* Ambient background with gradient blobs and noise */}
      <AmbientBackground />
      
      <Header />
      
      <main className="pt-16 relative z-10">
        {/* HERO: Split layout with copy left, dashboard mock right */}
        <section className="relative overflow-hidden">
          <div className="container max-w-6xl mx-auto px-4 py-24 md:py-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div className="max-w-xl space-y-6 text-center lg:text-left">
                {/* Beta badge */}
                <Badge 
                  variant="outline" 
                  className="font-mono text-xs uppercase tracking-wider border-primary/30 text-primary"
                >
                  Beta
                </Badge>
                
                {/* Headline */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                  Credit decisions,{' '}
                  <span className="text-primary">explained and optimized.</span>
                </h1>
                
                {/* Subhead - single sentence */}
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Analyze purchases, choose the best card, and understand payment timing without guessing.
                </p>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/analyze')}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Try the Analyzer
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/ask')}
                    className="gap-2 border-border hover:bg-card"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ask Credit AI
                  </Button>
                </div>
                
                {/* Waitlist inline */}
                <div className="pt-4">
                  <WaitlistForm variant="inline" className="max-w-sm mx-auto lg:mx-0" />
                </div>
              </div>
              
              {/* Right: Dashboard Mock Visual */}
              <div className="hidden md:block">
                <HeroDashboardMock />
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES: 3-column bordered grid */}
        <CapabilitiesGrid />

        {/* PHILOSOPHY: Sticky left visual, scroll right narrative */}
        <PhilosophySection />

        {/* TRUST: 3-item grid replacing testimonials */}
        <TrustGrid />

        {/* FINAL CTA: Waitlist */}
        <section className="py-24 border-t border-border">
          <div className="container max-w-2xl mx-auto px-4 text-center">
            <div className="mb-8">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Get early access
              </h2>
              <p className="text-muted-foreground">
                Join the waitlist for exclusive updates and early feature access.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <WaitlistForm variant="default" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
