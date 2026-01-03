import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, CheckCircle, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ContainerScrollShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -40]);

  return (
    <section 
      ref={containerRef}
      className="border-t border-border bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden"
    >
      <div className="container max-w-6xl mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-muted-foreground">
            Paste a URL. Get your answer in seconds.
          </p>
        </motion.div>

        <motion.div
          style={{ opacity, scale, y }}
          className="max-w-3xl mx-auto"
        >
          {/* Mock UI Container */}
          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Browser-like header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-7 rounded-lg bg-background border border-border flex items-center px-3 text-xs text-muted-foreground">
                  cardclutch.app/analyze
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Step 1: URL Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Enter a shopping URL
                </label>
                <div className="relative">
                  <div className="h-12 rounded-lg bg-background border border-border flex items-center px-4 text-sm">
                    <span className="text-muted-foreground">https://</span>
                    <span className="text-foreground">amazon.com/dp/B09...</span>
                  </div>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <div className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">
                      Analyze
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Divider with arrow */}
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 text-primary" />
              </motion.div>

              {/* Step 2: Detection Result */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="p-4 rounded-xl bg-muted/50 border border-border space-y-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Merchant Detected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Amazon</p>
                    <p className="text-sm text-muted-foreground">Category: Online Retail</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                    High confidence
                  </span>
                </div>
              </motion.div>

              {/* Step 3: Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Recommendation</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Mock card */}
                  <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
                    <CreditCard className="w-6 h-6 text-white/80" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Chase Freedom Unlimited</p>
                    <p className="text-sm text-muted-foreground">
                      Earn <span className="text-primary font-medium">1.5x</span> points on this purchase
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3">
                  <span className="font-medium">Why this card?</span> No category exclusions. 
                  Flat 1.5x rate beats your other cards for online retail purchases.
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Mobile note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Works on any device. No app required.
        </motion.p>
      </div>
    </section>
  );
}
