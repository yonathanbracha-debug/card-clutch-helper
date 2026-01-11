/**
 * Mission Page - Brand Ideology & Roadmap
 * Skimmable manifesto format with expandable sections
 */
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Compass, Rocket, Shield, ChevronDown, Quote } from 'lucide-react';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { WaitlistForm } from '@/components/WaitlistForm';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const phases = [
  {
    status: 'Current',
    title: 'V1: Decision Engine',
    icon: Target,
    summary: 'Rule-based card recommendations at checkout',
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
    summary: 'Automatic detection at any checkout',
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
    summary: 'Outcome-focused financial guidance',
    items: [
      'Sign-up bonus tracking (opt-in)',
      'Annual fee value analysis',
      'Outcome-focused recommendations',
    ],
  },
];

const principles = [
  {
    headline: 'Guidance before decisions.',
    subline: 'Not damage reports after.',
    detail: 'Credit scores tell you what happened. We tell you what to do.',
  },
  {
    headline: 'Simplicity is the product.',
    subline: 'If you need a spreadsheet, we failed.',
    detail: 'One answer. One card. One action. That\'s it.',
  },
  {
    headline: 'Privacy is architecture.',
    subline: 'We don\'t need your data to help you.',
    detail: 'No bank connections. No transaction history. No selling your data.',
  },
  {
    headline: 'Conservative by design.',
    subline: 'Accuracy over aggressive promises.',
    detail: 'We won\'t recommend risky strategies. We won\'t help you game issuers.',
  },
];

const problems = [
  {
    number: '01',
    headline: 'Scores report damage.',
    detail: 'A number after the fact doesn\'t help at the moment of decision.',
  },
  {
    number: '02',
    headline: 'Small mistakes compound.',
    detail: 'Using the wrong card once doesn\'t matter. Doing it for years costs thousands.',
  },
  {
    number: '03',
    headline: 'The knowledge gap is real.',
    detail: 'First-generation students, immigrants, and young adults learn credit the hard way.',
  },
  {
    number: '04',
    headline: 'Tools profit from confusion.',
    detail: 'Most "free" credit tools make money by selling you more products.',
  },
];

export default function Mission() {
  useScrollToHash();
  const [expandedProblem, setExpandedProblem] = useState<number | null>(null);
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(null);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        {/* Hero - Immediate, Bold */}
        <section className="container-main py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className="pill-primary mb-6 inline-flex">
              <Shield className="w-3.5 h-3.5" />
              Mission
            </span>
            
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground leading-[1.1] mb-6 tracking-tight">
              Credit damage happens at the{' '}
              <span className="text-primary">moment of decision</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Not after. We built CardClutch to give guidance before mistakes happen.
            </p>
          </motion.div>
        </section>

        {/* What's Broken - Compact Cards */}
        <section className="border-y border-border bg-card/30">
          <div className="container-main py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <span className="mono-label text-primary mb-3 block">The Problem</span>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                What's broken
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {problems.map((item, index) => (
                <motion.div
                  key={item.number}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Collapsible
                    open={expandedProblem === index}
                    onOpenChange={(open) => setExpandedProblem(open ? index : null)}
                  >
                    <CollapsibleTrigger className="w-full text-left p-5 rounded-xl border border-border bg-background hover:bg-secondary/30 transition-colors group">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-semibold text-primary/30 font-mono shrink-0">
                          {item.number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {item.headline}
                          </h3>
                          <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            expandedProblem === index && "rotate-180"
                          )} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-5 pt-2">
                        <p className="text-sm text-muted-foreground leading-relaxed pl-12">
                          {item.detail}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Principles - Statement Cards */}
        <section className="container-main py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <span className="mono-label text-primary mb-3 block">Principles</span>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              What we believe
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {principles.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Collapsible
                  open={expandedPrinciple === index}
                  onOpenChange={(open) => setExpandedPrinciple(open ? index : null)}
                >
                  <CollapsibleTrigger className="w-full text-left p-5 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.headline}
                        </h3>
                        <p className="text-sm text-primary font-medium mt-1">
                          {item.subline}
                        </p>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground shrink-0 transition-transform mt-1",
                        expandedPrinciple === index && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-5 pt-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Conservative Stance - Highlighted */}
        <section className="container-main pb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-8 rounded-2xl bg-primary/5 border border-primary/10"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  We're intentionally conservative.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  We won't recommend aggressive strategies. We won't help you game issuers. 
                  Our job is to prevent mistakes, not maximize points.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Roadmap - Compact */}
        <section id="roadmap" className="border-t border-border scroll-mt-24 bg-card/30">
          <div className="container-main py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <span className="mono-label text-primary mb-3 block">Roadmap</span>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Where we're going
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {phases.map((phase, index) => (
                <motion.div 
                  key={phase.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-5 rounded-xl border bg-background",
                    phase.status === 'Current' 
                      ? 'border-primary/30 ring-1 ring-primary/10' 
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      phase.status === 'Current' ? 'bg-primary/10' : 'bg-secondary'
                    )}>
                      <phase.icon className={cn(
                        "w-4 h-4",
                        phase.status === 'Current' ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <span className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        phase.status === 'Current' ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {phase.status}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{phase.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{phase.summary}</p>
                  <ul className="space-y-1.5">
                    {phase.items.slice(0, 2).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground/70 mt-8 font-mono text-center">
              No timelines. Each phase ships when it meets our standards.
            </p>
          </div>
        </section>

        {/* Waitlist */}
        <section className="border-t border-border">
          <div className="container-main py-16 md:py-20">
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-md mx-auto text-center"
            >
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Join the waitlist
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Be the first to know when new features launch.
              </p>
              <WaitlistForm variant="inline" />
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="container-main py-8">
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
