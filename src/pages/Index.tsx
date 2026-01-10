/**
 * Index - Homepage
 * Calm, centered, institutional design
 * Reduces anxiety, builds trust
 */
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from '@/components/WaitlistForm';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AmbientBackground />
      <Header />
      
      <main className="pt-14 relative z-10">
        {/* HERO - Centered, calm, clear */}
        <section className="min-h-[85vh] flex items-center">
          <div className="max-w-3xl mx-auto px-6 py-24 text-center">
            {/* Small label */}
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-8">
              Credit Decision Engine
            </p>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-tight mb-8">
              Credit decisions,
              <br />
              explained &amp; optimized.
            </h1>
            
            {/* Subhead */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-12">
              Know which card to use before you buy. Understand payment timing. 
              Avoid category traps. No guessing required.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
              <Button 
                size="lg" 
                onClick={() => navigate('/analyze')}
                className="gap-2"
              >
                Try the Analyzer
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/ask')}
              >
                Ask a Question
              </Button>
            </div>
            
            {/* Trust statement */}
            <p className="font-mono text-xs text-muted-foreground">
              No bank connections required. Your data stays with you.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS - Simple, numbered */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-24">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-12">
              How it works
            </h2>

            <div className="space-y-0">
              {[
                {
                  step: '01',
                  title: 'Add your cards',
                  description: 'Select the credit cards you carry. Takes 30 seconds.',
                },
                {
                  step: '02',
                  title: 'Paste any merchant',
                  description: 'Enter a URL or merchant name before you buy.',
                },
                {
                  step: '03',
                  title: 'Get your answer',
                  description: 'See which card earns the most, with confidence levels and reasoning.',
                },
              ].map((item, index) => (
                <div 
                  key={item.step}
                  className={cn(
                    "grid md:grid-cols-12 gap-4 py-8",
                    index !== 2 && "border-b border-border"
                  )}
                >
                  <div className="md:col-span-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {item.step}
                    </span>
                  </div>
                  <div className="md:col-span-10">
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRINCIPLES - Trust building */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-24">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-12">
              Our approach
            </h2>

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
