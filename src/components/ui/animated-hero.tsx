"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const rotatingWords = ["explained", "optimized", "disciplined", "private", "deterministic"];

function HeroWord({ word }: { word: string }) {
  return (
    <motion.span
      key={word}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="inline-block text-primary"
    >
      {word}
    </motion.span>
  );
}

interface AnimatedHeroProps {
  className?: string;
}

export function AnimatedHero({ className }: AnimatedHeroProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentWord = useMemo(() => rotatingWords[currentIndex], [currentIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={cn("min-h-[85vh] flex items-center justify-center", className)}>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-8"
        >
          Credit Decision Engine
        </motion.p>

        {/* Headline with rotating word */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-tight mb-8"
        >
          Credit decisions,
          <br />
          <AnimatePresence mode="wait">
            <HeroWord word={currentWord} />
          </AnimatePresence>
          .
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-12"
        >
          Conservative, deterministic guidance for utilization, timing, and rewards.
          Built for students, immigrants, and anyone who refuses expensive mistakes.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
        >
          <Button
            size="lg"
            onClick={() => navigate("/analyze")}
            className="gap-2"
          >
            Start optimizing
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/ask")}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Ask a question
          </Button>
        </motion.div>

        {/* Trust statement */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-mono text-xs text-muted-foreground"
        >
          No bank connections required. Your data stays with you.
        </motion.p>
      </div>
    </section>
  );
}
