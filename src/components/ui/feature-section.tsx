"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { CreditCard, Calculator, ShieldCheck } from "lucide-react";

interface FeatureStep {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const featureSteps: FeatureStep[] = [
  {
    step: "01",
    title: "Describe the purchase",
    description:
      "Enter the merchant, amount, and category. We identify the purchase context from a single URL or merchant name.",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    step: "02",
    title: "We compute best card",
    description:
      "Our rules engine calculates expected value across all your cards, factoring in category multipliers, caps, and exclusions.",
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    step: "03",
    title: "We prevent score damage",
    description:
      "Beyond rewards: we flag payment timing before statement close to keep utilization in the optimal band and protect your score.",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
];

interface FeatureSectionProps {
  className?: string;
}

export function FeatureSection({ className }: FeatureSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className={cn("border-t border-border", className)}>
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            Three steps to error-free decisions
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="space-y-0">
          {featureSteps.map((feature, index) => (
            <motion.div
              key={feature.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={cn(
                "grid md:grid-cols-12 gap-6 py-10",
                index !== featureSteps.length - 1 && "border-b border-border"
              )}
            >
              {/* Step number & icon */}
              <div className="md:col-span-2 flex items-start gap-3">
                <span className="font-mono text-sm text-muted-foreground">
                  {feature.step}
                </span>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="md:col-span-10">
                <h3 className="text-xl font-medium text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
