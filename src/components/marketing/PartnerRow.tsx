"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const supportedCards = [
  "Amex",
  "Chase", 
  "Capital One",
  "Citi",
  "Discover",
  "Bilt",
  "Bank of America",
  "Wells Fargo",
];

interface PartnerRowProps {
  className?: string;
}

export function PartnerRow({ className }: PartnerRowProps) {
  return (
    <section className={cn("py-12 border-y border-border bg-secondary/30", className)}>
      <div className="container-main">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Works with cards from major issuers
        </p>
        
        <div className="relative overflow-hidden">
          <motion.div 
            className="flex gap-8 items-center justify-center flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {supportedCards.map((card) => (
              <div
                key={card}
                className="px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground font-medium hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {card}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
