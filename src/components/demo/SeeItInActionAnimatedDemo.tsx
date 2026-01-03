import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, CheckCircle, CreditCard, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

// Demo configuration - edit these to customize
const DEMO_CONFIG = {
  url: 'amazon.com',
  merchant: 'Amazon',
  category: 'Online Retail',
  recommendedCard: 'Chase Freedom Unlimited',
  multiplier: '1.5x',
  reason: 'No category exclusions. Flat 1.5x rate beats your other cards for online retail purchases.',
  loopDuration: 9000, // Total loop time in ms
  typingSpeed: 90, // ms per character
};

// Timeline (in seconds)
const TIMELINE = {
  idle: { start: 0, end: 0.8 },
  typing: { start: 0.8, end: 3.0 },
  click: { start: 3.0, end: 3.6 },
  loading: { start: 3.6, end: 4.6 },
  result: { start: 4.6, end: 7.2 },
  reset: { start: 7.2, end: 9.0 },
};

type Phase = 'idle' | 'typing' | 'click' | 'loading' | 'result' | 'reset';

function getPhase(elapsed: number): Phase {
  if (elapsed < TIMELINE.idle.end) return 'idle';
  if (elapsed < TIMELINE.typing.end) return 'typing';
  if (elapsed < TIMELINE.click.end) return 'click';
  if (elapsed < TIMELINE.loading.end) return 'loading';
  if (elapsed < TIMELINE.result.end) return 'result';
  return 'reset';
}

export function SeeItInActionAnimatedDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [typedText, setTypedText] = useState('');
  const startTimeRef = useRef(Date.now());
  
  const phase = getPhase(elapsed);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion) {
      // Show final state for reduced motion
      setTypedText(DEMO_CONFIG.url);
      setElapsed(TIMELINE.result.start + 0.1);
      return;
    }

    const animate = () => {
      const now = Date.now();
      const elapsedSeconds = ((now - startTimeRef.current) % DEMO_CONFIG.loopDuration) / 1000;
      setElapsed(elapsedSeconds);
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Typing effect
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const currentPhase = getPhase(elapsed);
    
    if (currentPhase === 'typing') {
      const typingProgress = (elapsed - TIMELINE.typing.start) / (TIMELINE.typing.end - TIMELINE.typing.start);
      const charCount = Math.floor(typingProgress * DEMO_CONFIG.url.length);
      setTypedText(DEMO_CONFIG.url.slice(0, charCount));
    } else if (currentPhase === 'click' || currentPhase === 'loading' || currentPhase === 'result') {
      setTypedText(DEMO_CONFIG.url);
    } else if (currentPhase === 'reset') {
      const resetProgress = (elapsed - TIMELINE.reset.start) / (TIMELINE.reset.end - TIMELINE.reset.start);
      const remaining = Math.max(0, DEMO_CONFIG.url.length - Math.floor(resetProgress * DEMO_CONFIG.url.length));
      setTypedText(DEMO_CONFIG.url.slice(0, remaining));
    } else {
      setTypedText('');
    }
  }, [elapsed, prefersReducedMotion]);

  const showCaret = phase === 'typing';
  const isButtonHovered = phase === 'click' && elapsed < 3.3;
  const isButtonPressed = phase === 'click' && elapsed >= 3.3;
  const isLoading = phase === 'loading';
  const showSkeleton = phase === 'loading';
  const showResult = phase === 'result' || (prefersReducedMotion);
  const showDetection = phase === 'click' || phase === 'loading' || phase === 'result' || prefersReducedMotion;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
      {/* Subtle breathing glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={phase === 'idle' ? {
          boxShadow: [
            '0 0 0 0 hsl(var(--primary) / 0)',
            '0 0 30px 2px hsl(var(--primary) / 0.08)',
            '0 0 0 0 hsl(var(--primary) / 0)',
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

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
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Search className="w-4 h-4" />
            Enter a shopping URL
          </label>
          <div className="relative">
            <motion.div 
              className="h-12 rounded-lg bg-background border flex items-center px-4 text-sm"
              animate={{
                borderColor: (phase === 'typing' || phase === 'click') 
                  ? 'hsl(var(--primary))' 
                  : 'hsl(var(--border))',
              }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-muted-foreground">https://</span>
              <span className="text-foreground">
                {typedText || (phase === 'idle' ? '' : '')}
              </span>
              {/* Blinking caret */}
              <AnimatePresence>
                {showCaret && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0, 1] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="w-0.5 h-5 bg-primary ml-0.5"
                  />
                )}
              </AnimatePresence>
              {/* Placeholder when empty */}
              {phase === 'idle' && (
                <span className="text-muted-foreground/50">amazon.com, target.com...</span>
              )}
            </motion.div>
            
            {/* Analyze button */}
            <motion.div 
              className="absolute right-2 top-1/2 -translate-y-1/2"
              animate={{
                scale: isButtonPressed ? 0.98 : isButtonHovered ? 1.02 : 1,
              }}
              transition={{ duration: 0.08 }}
            >
              <motion.div 
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 cursor-pointer"
                animate={{
                  backgroundColor: isButtonHovered 
                    ? 'hsl(var(--primary) / 0.9)' 
                    : 'hsl(var(--primary))',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Analyzing</span>
                  </>
                ) : (
                  'Analyze'
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Results area */}
        <AnimatePresence mode="wait">
          {showDetection && (
            <motion.div
              key="detection"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 overflow-hidden"
            >
              {/* Divider with arrow */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 text-primary" />
              </motion.div>

              {/* Detection Result */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Merchant Detected</span>
                </div>
                <div className="flex items-center justify-between">
                  {showSkeleton ? (
                    <>
                      <div className="space-y-2">
                        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold">{DEMO_CONFIG.merchant}</p>
                        <p className="text-sm text-muted-foreground">Category: {DEMO_CONFIG.category}</p>
                      </div>
                      <motion.span 
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.4 }}
                        className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600"
                      >
                        High confidence
                      </motion.span>
                    </>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden"
                  >
                    {/* Glow ring pulse */}
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={{ boxShadow: '0 0 0 0 hsl(var(--primary) / 0.3)' }}
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 hsl(var(--primary) / 0.3)',
                          '0 0 20px 4px hsl(var(--primary) / 0.15)',
                          '0 0 0 0 hsl(var(--primary) / 0)',
                        ]
                      }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />

                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-primary">Recommendation</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Mock card */}
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', bounce: 0.3 }}
                        className="w-16 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg"
                      >
                        <CreditCard className="w-6 h-6 text-white/80" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.p 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                          className="font-semibold"
                        >
                          {DEMO_CONFIG.recommendedCard}
                        </motion.p>
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-sm text-muted-foreground"
                        >
                          Earn <span className="text-primary font-medium">{DEMO_CONFIG.multiplier}</span> points on this purchase
                        </motion.p>
                      </div>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3"
                    >
                      <span className="font-medium">Why this card?</span> {DEMO_CONFIG.reason}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
