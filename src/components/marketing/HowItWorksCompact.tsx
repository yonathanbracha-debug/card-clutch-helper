import { motion } from 'framer-motion';
import { Wallet, Link as LinkIcon, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Add your cards',
    description: 'Build your wallet in seconds',
  },
  {
    icon: LinkIcon,
    title: 'Paste a URL',
    description: 'Any shopping site works',
  },
  {
    icon: Sparkles,
    title: 'Get your answer',
    description: 'Know which card to use',
  },
];

export function HowItWorksCompact() {
  return (
    <section className="border-t border-border">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            How it works
          </h2>
          <p className="text-muted-foreground text-sm">
            Three steps. No sign-up required.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-card border border-border"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
