/**
 * Index - Homepage with premium fintech aesthetic
 * Matches reference: dark theme, grid borders, editorial typography
 */
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from '@/components/WaitlistForm';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Feature list data matching reference "Selected Works" style
const features = [
  {
    id: 'analyzer',
    title: 'Purchase Analyzer',
    description: 'Paste any merchant URL. See which card earns the most rewards instantly.',
    href: '/analyze',
  },
  {
    id: 'ask',
    title: 'Ask Credit AI',
    description: 'Get grounded answers about credit rules with sources when available.',
    href: '/ask',
  },
  {
    id: 'catalog',
    title: 'Card Catalog',
    description: 'Browse and compare cards with transparent, verified data.',
    href: '/cards',
  },
];

// Stats matching reference bento style
const stats = [
  {
    value: '<100',
    unit: 'ms',
    label: 'Deterministic response time',
    subtext: 'Instant decisions when rules are clear'
  },
  {
    value: '100',
    unit: '%',
    label: 'Explainable recommendations',
    subtext: 'Every suggestion includes reasoning'
  },
  {
    value: 'Zero',
    unit: '',
    label: 'Bank connections required',
    subtext: 'Your financial data stays with you'
  },
];

// Philosophy blocks
const philosophyBlocks = [
  {
    number: '01',
    title: 'Why credit feels confusing',
    description: 'Every card has different rules, categories, and exceptions. Statement dates differ from due dates. It\'s designed to be complex.',
  },
  {
    number: '02',
    title: 'Discipline beats guessing',
    description: 'The best approach isn\'t chasing every bonus. It\'s knowing exactly which card to use at which merchant, every time.',
  },
  {
    number: '03',
    title: 'Clarity and control',
    description: 'We surface the rules clearly, explain the timing, and let you make informed decisions. No tricks. No urgency.',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background dark">
      <AmbientBackground />
      <Header />
      
      <main className="pt-16 relative z-10">
        {/* HERO - Left-aligned like reference */}
        <section className="min-h-[90vh] flex items-center border-b border-border">
          <div className="container max-w-6xl mx-auto px-4 py-24">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Copy */}
              <div>
                {/* Small label */}
                <div className="flex items-center gap-3 mb-8">
                  <span className="font-mono-accent text-xs uppercase tracking-widest text-muted-foreground">
                    Available Now
                  </span>
                  <span className="w-8 h-px bg-border" />
                  <span className="font-mono-accent text-xs uppercase tracking-widest text-primary">
                    Beta
                  </span>
                </div>

                {/* Headline - large, editorial */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground leading-[1.05] mb-8">
                  Credit decisions,
                  <br />
                  <span className="text-primary">explained</span>
                  <br />
                  <span className="text-muted-foreground">&amp; optimized.</span>
                </h1>
                
                {/* Subhead */}
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-10">
                  Analyze purchases, choose the best card, and understand payment timing without guessing.
                </p>
                
                {/* CTAs - matching reference button style */}
                <div className="flex flex-wrap gap-4 mb-10">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/analyze')}
                    className="group gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6"
                  >
                    Try the Analyzer
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/ask')}
                    className="gap-2 rounded-full px-6 border-border hover:bg-card"
                  >
                    Ask Credit AI
                  </Button>
                </div>
                
                {/* Waitlist inline */}
                <div className="max-w-sm">
                  <WaitlistForm variant="inline" />
                </div>
              </div>

              {/* Right: Visual element - minimal grid/abstract */}
              <div className="hidden lg:block relative">
                <div className="aspect-square relative">
                  {/* Grid lines - matching reference aesthetic */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-border/30" />
                    ))}
                  </div>
                  
                  {/* Central orb */}
                  <div className="absolute inset-16 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-border/50 relative overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.4) 0%, transparent 60%)'
                        }}
                      />
                      {/* Concentric rings */}
                      <div className="absolute inset-8 rounded-full border border-border/30" />
                      <div className="absolute inset-16 rounded-full border border-border/20" />
                      <div className="absolute inset-24 rounded-full border border-primary/10" />
                    </div>
                  </div>
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 font-mono-accent text-xs text-muted-foreground/40">
                    01
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES - "Selected Works" style list */}
        <section className="py-24 border-b border-border">
          <div className="container max-w-5xl mx-auto px-4">
            {/* Section header - left aligned like reference */}
            <div className="mb-12 pb-6 border-b border-border">
              <div className="flex items-end gap-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground">
                  <span className="text-primary">Selected</span> Features
                </h2>
                <div className="hidden md:flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <span className="w-12 h-px bg-border" />
                  <span className="font-mono-accent uppercase tracking-widest text-xs">
                    Explore
                  </span>
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div className="divide-y divide-border">
              {features.map((feature) => (
                <motion.div
                  key={feature.id}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  onClick={() => navigate(feature.href)}
                  className={cn(
                    "group py-6 cursor-pointer transition-colors duration-200",
                    hoveredFeature === feature.id ? "bg-card/30" : ""
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6 flex-1">
                      {/* Bullet point */}
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                        hoveredFeature === feature.id ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      
                      {/* Title */}
                      <h3 className={cn(
                        "text-xl md:text-2xl font-medium transition-colors duration-200",
                        hoveredFeature === feature.id ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {feature.title}
                      </h3>
                    </div>

                    {/* Arrow + Description on hover */}
                    <div className="flex items-center gap-4">
                      <AnimatePresence>
                        {hoveredFeature === feature.id && (
                          <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm text-muted-foreground max-w-xs hidden md:block"
                          >
                            {feature.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      
                      <motion.div
                        animate={{ 
                          x: hoveredFeature === feature.id ? 4 : 0,
                          rotate: hoveredFeature === feature.id ? 0 : -45
                        }}
                        transition={{ duration: 0.15 }}
                      >
                        <ArrowUpRight className={cn(
                          "w-5 h-5 transition-colors duration-200",
                          hoveredFeature === feature.id ? "text-primary" : "text-muted-foreground/40"
                        )} />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS - Bento grid style */}
        <section className="border-b border-border">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="py-16 md:px-8 first:pl-0 last:pr-0 group"
                >
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl md:text-6xl font-light text-foreground tracking-tight">
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span className="text-lg font-mono-accent text-primary">
                        {stat.unit}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xs text-muted-foreground/50 font-mono-accent">
                    {stat.subtext}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PHILOSOPHY - Editorial blocks */}
        <section className="py-24 border-b border-border">
          <div className="container max-w-4xl mx-auto px-4">
            {/* Section header */}
            <div className="mb-16">
              <span className="font-mono-accent text-xs uppercase tracking-widest text-primary mb-4 block">
                Philosophy
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-foreground">
                A different approach
              </h2>
            </div>

            {/* Blocks */}
            <div className="space-y-0">
              {philosophyBlocks.map((block, index) => (
                <div 
                  key={block.number}
                  className={cn(
                    "grid md:grid-cols-12 gap-6 py-10",
                    index !== philosophyBlocks.length - 1 && "border-b border-border"
                  )}
                >
                  {/* Number */}
                  <div className="md:col-span-2">
                    <span className="font-mono-accent text-sm text-muted-foreground/50">
                      {block.number}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="md:col-span-10">
                    <h3 className="text-xl font-medium text-foreground mb-3">
                      {block.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                      {block.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST - Minimal grid */}
        <section className="py-24 border-b border-border">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="font-mono-accent text-xs uppercase tracking-widest text-primary mb-4 block">
                Trust
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-foreground">
                Built for confidence
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Conservative defaults',
                  description: 'We err on the side of caution. If we\'re unsure about a merchant category or reward rule, we say so.'
                },
                {
                  title: 'Explainable recommendations',
                  description: 'Every suggestion comes with reasoning. You see exactly why we recommend a specific card.'
                },
                {
                  title: 'Privacy-first',
                  description: 'No bank connections. No transaction scraping. Your financial data stays with you.'
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="p-6 border border-border rounded-lg bg-card/20 hover:bg-card/40 hover:border-border/80 transition-all duration-200"
                >
                  <h3 className="text-lg font-medium text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-12 text-center">
              <p className="text-xs text-muted-foreground/50 font-mono-accent">
                Informational only. Not financial advice.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24">
          <div className="container max-w-2xl mx-auto px-4 text-center">
            <span className="font-mono-accent text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
              Get Started
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              Join the waitlist
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Get early access to new features and updates.
            </p>
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
