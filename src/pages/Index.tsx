/**
 * Homepage - CardClutch
 * Premium cover page design
 * Calm, infrastructure-grade, trust-building
 */
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { DemoModal } from '@/components/marketing/DemoModal';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Lock, Zap, ChevronRight } from 'lucide-react';

// Hero Section
function HeroSection({ onOpenDemo }: { onOpenDemo: () => void }) {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 gradient-mesh" />
      
      {/* Floating orbs - very subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <div className="container-main relative z-10 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="mb-8"
          >
            <span className="pill-secondary">
              <Shield className="w-3.5 h-3.5" />
              No bank connections required
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground leading-tight tracking-tight mb-6"
          >
            Credit decisions,
            <br />
            <span className="text-primary">explained & optimized</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Deterministic logic for utilization, timing, and rewards. 
            Built for students, immigrants, and anyone who refuses expensive mistakes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/analyze">
              <Button variant="primary" size="xl" className="gap-2 min-w-[200px]">
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="xl" onClick={onOpenDemo} className="min-w-[200px]">
              See it in action
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="mt-16 flex items-center justify-center gap-8 flex-wrap"
          >
            {[
              { icon: Lock, text: 'Privacy-first' },
              { icon: Shield, text: 'No data sold' },
              { icon: Zap, text: 'Instant results' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="w-4 h-4 text-primary/70" />
                {item.text}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Hero visual - Abstract card floating */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 hidden lg:block pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative"
        >
          <AbstractCardVisual />
        </motion.div>
      </div>
    </section>
  );
}

// Abstract card visual component
function AbstractCardVisual() {
  return (
    <div className="relative w-[500px] h-[320px]">
      {/* Card 3 */}
      <div 
        className="absolute top-12 left-12 w-80 h-48 rounded-3xl bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50 backdrop-blur-sm transform rotate-6 opacity-50"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      />
      {/* Card 2 */}
      <div 
        className="absolute top-6 left-6 w-80 h-48 rounded-3xl bg-gradient-to-br from-card to-secondary border border-border/60 backdrop-blur-sm transform rotate-3 opacity-70"
        style={{ boxShadow: 'var(--shadow-md)' }}
      />
      {/* Card 1 - Main */}
      <div 
        className="absolute top-0 left-0 w-80 h-48 rounded-3xl bg-gradient-to-br from-primary/90 to-primary border border-primary/20 overflow-hidden animate-float"
        style={{ boxShadow: '0 20px 60px hsl(var(--primary) / 0.25)' }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        {/* Chip */}
        <div className="absolute top-8 left-8 w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300/90 to-yellow-500/80" />
        {/* Dots */}
        <div className="absolute bottom-8 left-8 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-1">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="w-1.5 h-1.5 rounded-full bg-primary-foreground/40" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Partner row - slow continuous marquee
function PartnerRow() {
  const partners = ['Visa', 'Mastercard', 'American Express', 'Discover', 'Capital One', 'Chase'];
  
  return (
    <section className="py-16 border-y border-border bg-card/30 overflow-hidden">
      <div className="container-main">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8">
          Works with all major cards
        </p>
      </div>
      
      {/* Marquee container */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        
        {/* Scrolling track */}
        <div className="flex animate-marquee-slow">
          {/* Double the logos for seamless loop */}
          {[...partners, ...partners].map((partner, i) => (
            <span
              key={`${partner}-${i}`}
              className="text-muted-foreground/50 font-medium text-lg tracking-wide whitespace-nowrap px-12"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// Feature section - scannable with expand-on-interaction
function FeatureSection() {
  const [expanded, setExpanded] = useState<number | null>(null);
  
  const features = [
    {
      title: 'Optimal card selection',
      summary: 'Know exactly which card to use for every purchase.',
      details: 'We analyze merchant categories, reward multipliers, and known exclusions to recommend the single best card from your wallet.',
    },
    {
      title: 'Utilization control',
      summary: 'Prevent credit score damage before it happens.',
      details: 'Statement close dates matter. We tell you when to pay to keep utilization in the optimal band.',
    },
    {
      title: 'Privacy by design',
      summary: 'No bank connections. Your information stays yours.',
      details: 'All logic runs locally or on edge functions with minimal data retention. We never see your transactions.',
    },
  ];

  return (
    <section className="py-24 lg:py-32">
      <div className="container-main">
        <div className="max-w-2xl mb-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mono-label text-muted-foreground mb-4"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl lg:text-4xl font-semibold text-foreground"
          >
            Credit guidance that prevents damage
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.button
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setExpanded(expanded === index ? null : index)}
              className="group card-interactive p-8 text-left cursor-pointer"
            >
              <div className="text-xs font-medium text-primary/70 mb-4">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.summary}
              </p>
              
              {/* Expandable details */}
              <motion.div
                initial={false}
                animate={{ 
                  height: expanded === index ? 'auto' : 0,
                  opacity: expanded === index ? 1 : 0,
                  marginTop: expanded === index ? 16 : 0
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="text-sm text-muted-foreground/80 leading-relaxed border-t border-border pt-4">
                  {feature.details}
                </p>
              </motion.div>
              
              {/* Expand indicator */}
              <div className="mt-4 text-xs text-primary/60 group-hover:text-primary transition-colors duration-300">
                {expanded === index ? 'Less' : 'Learn more'}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-24 lg:py-32 border-t border-border">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
            Stop making credit mistakes
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join cardholders who use data, not guesswork, to make every credit decision.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/analyze">
              <Button variant="primary" size="xl" className="gap-2">
                Start optimizing
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/mission">
              <Button variant="ghost" size="xl">
                Learn more
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Disclaimer
function Disclaimer() {
  return (
    <section className="py-8 border-t border-border">
      <div className="container-main text-center">
        <p className="text-xs text-muted-foreground">
          CardClutch provides informational guidance only. This is not financial advice. 
          Always verify current terms with your card issuer.
        </p>
      </div>
    </section>
  );
}

// Main page component
const Index = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <HeroSection onOpenDemo={() => setDemoOpen(true)} />
        <PartnerRow />
        <FeatureSection />
        <CTASection />
        <Disclaimer />
      </main>

      <Footer />

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

export default Index;