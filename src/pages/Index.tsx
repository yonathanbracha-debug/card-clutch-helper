/**
 * Index - Homepage with premium, centered layout
 * Professional fintech aesthetic - minimal, crisp
 */
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WaitlistForm } from '@/components/WaitlistForm';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { InteractiveCapabilities } from '@/components/marketing/InteractiveCapabilities';
import { PhilosophySection } from '@/components/marketing/PhilosophySection';
import { TrustGrid } from '@/components/marketing/TrustGrid';
import { HeroOrbVisual } from '@/components/marketing/HeroOrbVisual';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background dark">
      {/* Ambient background with reduced gradient blobs */}
      <AmbientBackground />
      
      <Header />
      
      <main className="pt-16 relative z-10">
        {/* HERO: Centered layout */}
        <section className="relative overflow-hidden">
          <div className="container max-w-5xl mx-auto px-4 py-24 md:py-32 lg:py-40">
            {/* Subtle orb visual behind content */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 md:opacity-70">
              <HeroOrbVisual className="w-full max-w-2xl" />
            </div>
            
            {/* Centered content */}
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              {/* Beta badge */}
              <Badge 
                variant="outline" 
                className="font-mono-accent text-xs uppercase tracking-wider border-primary/30 text-primary mb-6"
              >
                Beta
              </Badge>
              
              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Credit decisions,{' '}
                <span className="text-primary">explained and optimized.</span>
              </h1>
              
              {/* Subhead */}
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                Analyze purchases, choose the best card, and understand payment timing without guessing.
              </p>
              
              {/* CTAs - centered row */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/analyze')}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Try the Analyzer
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  {/* Subtle animated border effect */}
                  <span className="absolute inset-0 border border-primary/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/ask')}
                  className="gap-2 border-border/60 hover:border-border hover:bg-card/50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ask Credit AI
                </Button>
              </div>
              
              {/* Waitlist - centered */}
              <div className="max-w-sm mx-auto">
                <WaitlistForm variant="inline" />
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES: Interactive accordion section */}
        <InteractiveCapabilities />

        {/* PHILOSOPHY: Clean narrative without big square */}
        <PhilosophySection />

        {/* TRUST: 3-item grid */}
        <TrustGrid />

        {/* FINAL CTA: Waitlist */}
        <section className="py-24 border-t border-border">
          <div className="container max-w-2xl mx-auto px-4 text-center">
            <div className="mb-8">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 opacity-80" />
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
