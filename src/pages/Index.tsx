/**
 * Index - Homepage
 * Ramp-inspired premium design
 * Clean, enterprise-grade, trust-building
 */
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RampHero } from '@/components/marketing/RampHero';
import { PartnerRow } from '@/components/marketing/PartnerRow';
import { FeatureSections } from '@/components/marketing/FeatureSections';
import { DemoModal } from '@/components/marketing/DemoModal';
import { WaitlistForm } from '@/components/WaitlistForm';
import { motion } from 'framer-motion';

const Index = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background theme-transition">
      <Header />
      
      <main className="pt-14 relative">
        {/* Hero Section */}
        <RampHero onOpenDemo={() => setDemoOpen(true)} />

        {/* Partner/Card Row */}
        <PartnerRow />

        {/* Feature Sections */}
        <FeatureSections />

        {/* CTA Section */}
        <section className="py-24 bg-secondary/30 border-t border-border">
          <div className="container-main text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-xl mx-auto space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                Ready to optimize your credit?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of cardholders making smarter credit decisions.
              </p>
              <WaitlistForm variant="default" />
            </motion.div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-12 border-t border-border">
          <div className="container-main text-center">
            <p className="text-sm text-muted-foreground">
              CardClutch provides informational guidance only. This is not financial advice. 
              Always verify current terms with your card issuer.
            </p>
          </div>
        </section>
      </main>

      <Footer />

      {/* Demo Modal */}
      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

export default Index;
