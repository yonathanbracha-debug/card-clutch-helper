/**
 * Mission Page - Brand Ideology & Roadmap
 * Bold, confident, human. Not a legal document.
 */
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Compass, Rocket, Shield, Quote } from 'lucide-react';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { WaitlistForm } from '@/components/WaitlistForm';
import { cn } from '@/lib/utils';

const phases = [
  {
    status: 'Current',
    title: 'V1: Decision Engine',
    icon: Target,
    items: [
      'Rule-based merchant classification',
      'Curated card reward database',
      'Known exclusion handling',
      'Confidence-level transparency',
    ],
  },
  {
    status: 'Next',
    title: 'V2: Browser Extension',
    icon: Compass,
    items: [
      'Automatic merchant detection at checkout',
      'Non-intrusive recommendation popup',
      'Same privacy guarantees',
    ],
  },
  {
    status: 'Later',
    title: 'V3: Credit Guidance',
    icon: Rocket,
    items: [
      'Sign-up bonus tracking (opt-in)',
      'Annual fee value analysis',
      'Outcome-focused recommendations',
    ],
  },
];

const beliefs = [
  {
    statement: 'Guidance before decisions.',
    detail: 'Not damage reports after.',
  },
  {
    statement: 'Simplicity is the product.',
    detail: 'If you need a spreadsheet, we failed.',
  },
  {
    statement: 'Privacy is architecture.',
    detail: 'We don\'t need your data to help you.',
  },
  {
    statement: 'Conservative by design.',
    detail: 'Accuracy over aggressive promises.',
  },
];

const problems = [
  {
    number: '01',
    headline: 'Scores report damage.',
    subline: 'They don\'t prevent it.',
    detail: 'A number after the fact doesn\'t help at the moment of decision.',
  },
  {
    number: '02',
    headline: 'Small mistakes compound.',
    subline: 'Over years. Silently.',
    detail: 'Using the wrong card once doesn\'t matter. Doing it for years costs thousands.',
  },
  {
    number: '03',
    headline: 'The knowledge gap is real.',
    subline: 'And it\'s not your fault.',
    detail: 'First-generation students, young adults, and immigrants learn credit rules the hard way.',
  },
  {
    number: '04',
    headline: 'Tools profit from confusion.',
    subline: 'Not clarity.',
    detail: 'Most "free" credit tools make money by selling you more credit products.',
  },
];

export default function Mission() {
  useScrollToHash();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        {/* Hero - Bold, immediate */}
        <section className="container-main py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <span className="pill-primary mb-8 inline-flex">
              <Shield className="w-3.5 h-3.5" />
              Our Mission
            </span>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground leading-[1.1] mb-8 tracking-tight">
              Credit damage happens at the{' '}
              <span className="text-primary">moment of decision</span>—
              <br className="hidden sm:block" />
              not after.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
              Millions harm their financial futures not because they're irresponsible—
              but because no one told them which decisions matter, or when.
            </p>
          </motion.div>
        </section>

        {/* Pull Quote - Visual break */}
        <section className="border-y border-border bg-secondary/30">
          <div className="container-main py-16 md:py-20">
            <motion.blockquote
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <Quote className="absolute -top-2 -left-2 w-10 h-10 text-primary/20" />
              <p className="text-2xl md:text-3xl font-medium text-foreground leading-snug max-w-3xl pl-8">
                We built CardClutch because we kept watching smart people make 
                preventable mistakes—not from carelessness, but from a system 
                designed to be confusing.
              </p>
              <footer className="mt-6 pl-8 text-muted-foreground">
                — The CardClutch team
              </footer>
            </motion.blockquote>
          </div>
        </section>

        {/* What's Broken - Grid with bold headlines */}
        <section className="container-main py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 md:mb-16"
          >
            <span className="mono-label text-primary mb-4 block">The Problem</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              What's broken
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {problems.map((item, index) => (
              <motion.div 
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="text-5xl md:text-6xl font-semibold text-primary/15 mb-4 font-mono">
                  {item.number}
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
                  {item.headline}
                </h3>
                <p className="text-lg text-primary font-medium mb-3">
                  {item.subline}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {item.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* What We Believe - Statement cards */}
        <section className="bg-card border-y border-border">
          <div className="container-main py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 md:mb-16"
            >
              <span className="mono-label text-primary mb-4 block">Our Principles</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                What we believe
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
              {beliefs.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="p-6 md:p-8 rounded-2xl bg-background border border-border"
                >
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                    {item.statement}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Conservative Stance - Highlighted */}
        <section className="container-main py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 md:p-12 rounded-3xl bg-primary/5 border border-primary/10"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
                  We're intentionally conservative.
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                  We won't recommend aggressive strategies. We won't help you game issuers. 
                  We won't encourage spending you don't need. Our job is to prevent mistakes, 
                  not maximize points.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="border-t border-border scroll-mt-24">
          <div className="container-main py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 md:mb-16"
            >
              <span className="mono-label text-primary mb-4 block">Roadmap</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
                Where we're going
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Each phase builds on the last. No compromises on accuracy, privacy, or restraint.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {phases.map((phase, index) => (
                <motion.div 
                  key={phase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn(
                    "p-6 md:p-8 rounded-2xl border bg-card",
                    phase.status === 'Current' 
                      ? 'border-primary/30 ring-1 ring-primary/10' 
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      phase.status === 'Current' ? 'bg-primary/10' : 'bg-secondary'
                    )}>
                      <phase.icon className={cn(
                        "w-5 h-5",
                        phase.status === 'Current' ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <span className={cn(
                        "mono-label block mb-0.5",
                        phase.status === 'Current' ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {phase.status}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">{phase.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground/70 mt-10 font-mono text-center">
              No timelines. No promises. Each phase ships when it meets our standards.
            </p>
          </div>
        </section>

        {/* Waitlist - Clean */}
        <section className="border-t border-border bg-card">
          <div className="container-main py-20 md:py-24">
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-lg mx-auto text-center"
            >
              <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Join the waitlist
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                Be the first to know when new features launch.
              </p>
              <WaitlistForm variant="inline" />
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="container-main py-12">
          <div className="flex justify-center">
            <Link 
              to="/analyze"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
            >
              Try the decision engine
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
