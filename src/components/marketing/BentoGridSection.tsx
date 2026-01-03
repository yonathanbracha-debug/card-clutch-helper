import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Globe, 
  BadgeCheck, 
  Lightbulb, 
  HeartPulse, 
  ShieldCheck,
  ArrowRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const bentoItems = [
  {
    title: "Card Vault",
    description: "Store your cards and their reward rules in one secure place.",
    icon: Wallet,
    href: "/wallet",
    className: "md:col-span-2",
  },
  {
    title: "Merchant Detection",
    description: "Automatic domain parsing and category inference for any shopping URL.",
    icon: Globe,
    href: "/analyze",
    className: "md:col-span-1",
  },
  {
    title: "Verified Reward Rules",
    description: "Issuer-sourced policies with last-verified dates you can trust.",
    icon: BadgeCheck,
    href: "/cards",
    className: "md:col-span-1",
  },
  {
    title: "Explainable Recommendations",
    description: "See the category, multiplier, reasoning, and confidence behind every pick.",
    icon: Lightbulb,
    href: "/analyze",
    className: "md:col-span-2",
  },
  {
    title: "Credit Health Mode",
    description: "Utilization-aware suggestions that protect your credit score.",
    icon: HeartPulse,
    href: "/roadmap",
    className: "md:col-span-1",
    comingSoon: true,
  },
  {
    title: "Privacy First",
    description: "No data selling. Least-privilege storage. Your wallet stays yours.",
    icon: ShieldCheck,
    href: "/security",
    className: "md:col-span-1",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function BentoGridSection() {
  return (
    <section className="border-t border-border">
      <div className="container max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold mb-4"
          >
            Everything You Need
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Built for people who take their rewards seriously
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-4 gap-4"
        >
          {bentoItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className={cn("group relative", item.className)}
              >
                <Link
                  to={item.href}
                  className="block h-full p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      {item.comingSoon && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex-1">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Learn more</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
