"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, ShieldCheck, Lock, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { animations } from "@/lib/theme";

const rotatingWords = ["explained", "optimized", "protected", "simplified", "mastered"];

function HeroWord({ word }: { word: string }) {
  return (
    <motion.span
      key={word}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ 
        duration: animations.wordRotateDuration / 1000, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      className="inline-block text-primary"
    >
      {word}
    </motion.span>
  );
}

interface RampHeroProps {
  onOpenDemo: () => void;
  className?: string;
}

export function RampHero({ onOpenDemo, className }: RampHeroProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const currentWord = useMemo(() => rotatingWords[currentIndex], [currentIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingWords.length);
    }, animations.wordRotateInterval);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const handleGetStarted = () => {
    if (email) {
      navigate("/auth", { state: { email } });
    } else {
      navigate("/analyze");
    }
  };

  const benefits = [
    { icon: ShieldCheck, text: "No bank connections" },
    { icon: Lock, text: "Privacy-first" },
    { icon: Calculator, text: "Deterministic math" },
  ];

  return (
    <section className={cn("min-h-[85vh] flex items-center", className)}>
      <div className="container-main w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="lg:col-span-6 space-y-8">
            {/* Social proof */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              Trusted by students and first-time cardholders
            </motion.p>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-5xl font-semibold text-foreground leading-tight"
            >
              Credit decisions,
              <br />
              <span className="inline-flex min-w-[200px]">
                {prefersReducedMotion ? (
                  <span className="text-primary">explained</span>
                ) : (
                  <AnimatePresence mode="wait">
                    <HeroWord word={currentWord} />
                  </AnimatePresence>
                )}
              </span>
              .
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg text-muted-foreground leading-relaxed max-w-lg"
            >
              Pick the best card, understand payment timing, and avoid utilization mistakes. 
              No bank connections required.
            </motion.p>

            {/* Email capture + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="email"
                  placeholder="What's your email?"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card px-4 text-base"
                />
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="h-12 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={onOpenDemo}
                className="text-muted-foreground hover:text-foreground"
              >
                See it in action →
              </Button>
            </motion.div>

            {/* Benefit bullets */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap gap-x-6 gap-y-2"
            >
              {benefits.map((benefit) => (
                <div key={benefit.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" />
                  {benefit.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="lg:col-span-6"
          >
            <div className="gradient-panel p-8 lg:p-12">
              <HeroCardStack />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroCardStack() {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* Card 3 - Back */}
      <div className="absolute top-8 left-8 right-8 bottom-8 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-soft-lg transform rotate-6 opacity-60" />
      
      {/* Card 2 - Middle */}
      <div className="absolute top-4 left-4 right-4 bottom-4 rounded-3xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-soft-lg transform rotate-3 opacity-80" />
      
      {/* Card 1 - Front */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 shadow-soft-xl overflow-hidden">
        {/* Card content */}
        <div className="absolute top-6 left-6 right-6">
          <div className="text-white/60 text-xs font-mono uppercase tracking-wider">Premium Card</div>
        </div>
        
        {/* Chip */}
        <div className="absolute top-1/3 left-6">
          <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md">
            <div className="w-full h-full rounded-lg border border-yellow-600/30" 
                 style={{ 
                   backgroundImage: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                 }} 
            />
          </div>
        </div>
        
        {/* Card number dots */}
        <div className="absolute bottom-16 left-6 right-6">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-1">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="w-2 h-2 rounded-full bg-white/40" />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Card holder */}
        <div className="absolute bottom-6 left-6">
          <div className="text-white/80 text-sm tracking-wider">CARDHOLDER NAME</div>
        </div>
        
        {/* Network logo */}
        <div className="absolute bottom-6 right-6">
          <div className="text-white/60 font-semibold text-lg">VISA</div>
        </div>
      </div>
    </div>
  );
}
