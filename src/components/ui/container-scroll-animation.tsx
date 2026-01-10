"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ContainerScroll({
  titleComponent,
  children,
  className,
}: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.3, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);

  return (
    <section
      ref={containerRef}
      className={cn("py-24 overflow-hidden", className)}
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-16">{titleComponent}</div>

        {/* Animated Preview */}
        <motion.div
          style={{ scale, opacity, y }}
          className="relative"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * CardClutch UI Preview Mock
 * A realistic in-app preview component
 */
export function CardClutchPreview() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="flex-1 text-center">
          <span className="font-mono text-xs text-muted-foreground">
            cardclutch.app/analyze
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Input section mock */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Merchant
            </div>
            <div className="h-12 rounded border border-border bg-background flex items-center px-4">
              <span className="text-foreground">amazon.com</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Amount
            </div>
            <div className="h-12 rounded border border-border bg-background flex items-center px-4">
              <span className="text-foreground">$127.50</span>
            </div>
          </div>
        </div>

        {/* Result mock */}
        <div className="rounded border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-10 rounded bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="font-mono text-xs text-primary">VISA</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground mb-1">
                Chase Freedom Unlimited
              </div>
              <div className="text-sm text-muted-foreground">
                5% back with rotating categories • $6.38 estimated reward
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-medium text-primary">5×</div>
              <div className="text-xs text-muted-foreground">multiplier</div>
            </div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">Confidence</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[92%] bg-primary rounded-full" />
          </div>
          <span className="font-mono text-xs text-primary">92%</span>
        </div>
      </div>
    </div>
  );
}
