"use client";

import { motion } from "framer-motion";
import { CreditCard, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
}

const features: Feature[] = [
  {
    title: "Optimal card selection. Every purchase.",
    description: "Enter a merchant or URL and we instantly calculate which card maximizes your rewards based on category multipliers, caps, and exclusions.",
    icon: <CreditCard className="w-6 h-6" />,
    visual: <CardSelectionVisual />,
  },
  {
    title: "Utilization control. Measured timing.",
    description: "Know exactly when to pay and how much to keep your utilization in the optimal band. Protect your score while maximizing rewards.",
    icon: <TrendingUp className="w-6 h-6" />,
    visual: <UtilizationVisual />,
  },
  {
    title: "Rewards without exposure.",
    description: "No bank logins. No transaction scraping. Your card details stay with you. We use public reward structures, not your private data.",
    icon: <Shield className="w-6 h-6" />,
    visual: <PrivacyVisual />,
  },
];

interface FeatureSectionsProps {
  className?: string;
}

export function FeatureSections({ className }: FeatureSectionsProps) {
  return (
    <section className={cn("py-24", className)}>
      <div className="container-main space-y-32">
        {features.map((feature, index) => (
          <FeatureBlock 
            key={feature.title} 
            feature={feature} 
            reversed={index % 2 === 1} 
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function FeatureBlock({ 
  feature, 
  reversed, 
  index 
}: { 
  feature: Feature; 
  reversed: boolean; 
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={cn(
        "grid lg:grid-cols-2 gap-12 lg:gap-16 items-center",
        reversed && "lg:grid-flow-dense"
      )}
    >
      {/* Text content */}
      <div className={cn("space-y-6", reversed && "lg:col-start-2")}>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          {feature.icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
          {feature.title}
        </h3>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Visual */}
      <div className={cn(
        "gradient-panel p-8",
        reversed && "lg:col-start-1"
      )}>
        {feature.visual}
      </div>
    </motion.div>
  );
}

function CardSelectionVisual() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-md space-y-4">
      {/* Input mock */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-muted-foreground uppercase">Merchant</div>
        <div className="h-10 rounded-xl border border-border bg-background flex items-center px-4">
          <span className="text-foreground text-sm">amazon.com</span>
        </div>
      </div>
      
      {/* Result */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground">Chase Freedom Flex</div>
            <div className="text-sm text-muted-foreground">5% back on select categories</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-primary">5×</div>
            <div className="text-xs text-muted-foreground">multiplier</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UtilizationVisual() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-md space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">Utilization</span>
        <span className="text-sm font-mono text-primary">8%</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div className="h-full w-[8%] bg-primary rounded-full" />
      </div>
      
      {/* Zones */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span className="text-primary font-medium">Optimal: 1-9%</span>
        <span>30%+</span>
      </div>
      
      {/* Recommendation */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Pay <span className="text-foreground font-medium">$127</span> before statement close</span>
        </div>
      </div>
    </div>
  );
}

function PrivacyVisual() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-md">
      <div className="space-y-4">
        {/* Privacy items */}
        {[
          { label: "Bank login required", value: "No", positive: true },
          { label: "Transaction access", value: "None", positive: true },
          { label: "Data stored", value: "Card names only", positive: true },
          { label: "Third-party sharing", value: "Never", positive: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className={cn(
              "text-sm font-medium",
              item.positive ? "text-primary" : "text-destructive"
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
