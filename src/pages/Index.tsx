import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ContainerScrollShowcase, 
  HowItWorksCompact,
  BentoGridSection,
  TestimonialSection 
} from '@/components/marketing';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Spotlight } from '@/components/ui/spotlight';
import { SplineScene } from '@/components/ui/splite';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section - Clean, Premium with Spotlight + 3D Card */}
        <section className="relative overflow-hidden">
          {/* Spotlight Effect */}
          <Spotlight 
            className="-top-40 left-0 md:left-60 md:-top-20" 
            fill="hsl(var(--primary) / 0.15)"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="container max-w-6xl mx-auto px-4 py-24 md:py-32 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div className="max-w-xl space-y-6 text-center lg:text-left">
                <Badge variant="outline" className="mb-4">
                  No sign-up required
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Don't let the credit system use you.{' '}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Use it.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  CardClutch tells you which card to use at checkout—based on real reward rules. Stop guessing. Max rewards. Avoid category traps.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Link to="/analyze">
                    <Button size="lg" className="w-full sm:w-auto gap-2 glow-primary animate-glow-pulse hover:scale-[1.02] transition-transform">
                      Try demo
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/mission#roadmap">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 hover:glow-primary-subtle transition-all">
                      Join Waitlist
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Right: 3D Spline Scene */}
              <div className="hidden md:flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md h-[460px] rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden glow-primary-subtle">
                  <SplineScene 
                    scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compact How It Works */}
        <HowItWorksCompact />

        {/* Bento Grid Features */}
        <BentoGridSection />

        {/* See It In Action - Interactive Demo */}
        <ContainerScrollShowcase />

        {/* Testimonials Section */}
        <TestimonialSection />

        {/* Single Trust Line */}
        <section className="border-t border-border">
          <div className="container max-w-4xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Privacy first</p>
                  <p className="text-sm text-muted-foreground">No tracking. No data selling.</p>
                </div>
              </div>
              <div className="hidden md:block w-px h-8 bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Verified data</p>
                  <p className="text-sm text-muted-foreground">From official issuer terms.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA / Waitlist */}
        <section className="border-t border-border bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
            <div className="mb-6">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Get early access
              </h2>
              <p className="text-muted-foreground">
                Join the waitlist for exclusive updates and early feature access.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <WaitlistForm variant="inline" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;