/**
 * Index - Homepage
 * Calm, centered, institutional design
 * Reduces anxiety, builds trust
 */
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WaitlistForm } from '@/components/WaitlistForm';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { AnimatedHero } from '@/components/ui/animated-hero';
import { FeatureSection } from '@/components/ui/feature-section';
import { ContainerScroll, CardClutchPreview } from '@/components/ui/container-scroll-animation';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AmbientBackground />
      <Header />
      
      <main className="pt-14 relative z-10">
        {/* HERO - Animated with rotating words */}
        <AnimatedHero />

        {/* HOW IT WORKS - Feature steps */}
        <FeatureSection />

        {/* PARALLAX PREVIEW - Container scroll animation */}
        <section className="border-t border-border">
          <ContainerScroll
            titleComponent={
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
                  See it in action
                </p>
                <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
                  The error-free credit decision.
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  We output the exact action: which card, why, and what to pay before statement close
                  to keep utilization in the optimal band.
                </p>
              </div>
            }
          >
            <CardClutchPreview />
          </ContainerScroll>
        </section>

        {/* PRINCIPLES - Trust building */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-24">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-12">
              Our approach
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Conservative defaults',
                  description: 'When uncertain, we say so. No aggressive promises about rewards you might not get.',
                },
                {
                  title: 'Explainable reasoning',
                  description: 'Every recommendation shows exactly why. You see the logic, not just the answer.',
                },
                {
                  title: 'Privacy-first',
                  description: 'No bank logins. No transaction scraping. Your financial data stays on your device.',
                },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-base font-medium text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="font-mono text-xs text-muted-foreground mt-12 text-center">
              Informational only. Not financial advice.
            </p>
          </div>
        </section>

        {/* WAITLIST */}
        <section className="border-t border-border">
          <div className="max-w-md mx-auto px-6 py-24 text-center">
            <h2 className="text-2xl font-light text-foreground mb-3">
              Get early access
            </h2>
            <p className="text-muted-foreground mb-8">
              Join the waitlist for new features and updates.
            </p>
            <WaitlistForm variant="default" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
