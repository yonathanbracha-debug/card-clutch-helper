import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, FolderOpen, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    id: 'rewards',
    title: 'Max Rewards',
    subtitle: 'Never miss a bonus',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    bullets: [
      'Compare multipliers across all your cards instantly',
      'Factor in category caps and quarterly rotations',
      'Get the highest-earning card for every merchant',
    ],
  },
  {
    id: 'mistakes',
    title: 'Avoid Mistakes',
    subtitle: 'Know the exclusions',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    bullets: [
      'Detect merchant exclusions before you swipe',
      'Understand category traps (e.g., groceries at Walmart)',
      'Never lose points to fine-print gotchas',
    ],
  },
  {
    id: 'organized',
    title: 'Stay Organized',
    subtitle: 'Your wallet, verified',
    icon: FolderOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    bullets: [
      'Store all your cards in one secure vault',
      'View verified reward rules from issuer sources',
      'Track annual fees and benefits at a glance',
    ],
  },
];

export function FeatureHoverSection() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  return (
    <section className="border-t border-border bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Three Pillars of Smart Spending
          </h2>
          <p className="text-muted-foreground">
            CardClutch helps you maximize, protect, and organize
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveFeature(feature.id)}
                onMouseLeave={() => setActiveFeature(null)}
                className={cn(
                  "relative p-6 rounded-2xl border border-border bg-card transition-all duration-300 cursor-pointer",
                  isActive && "border-primary/30 shadow-lg shadow-primary/5"
                )}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    feature.bgColor
                  )}>
                    <Icon className={cn("w-6 h-6", feature.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.subtitle}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-border space-y-3">
                        {feature.bullets.map((bullet, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", feature.color)} />
                            <span>{bullet}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isActive && (
                  <p className="text-sm text-muted-foreground">
                    Hover to learn more
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
