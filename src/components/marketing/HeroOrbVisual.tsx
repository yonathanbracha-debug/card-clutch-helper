/**
 * HeroOrbVisual - Subtle abstract gradient orb for hero section
 * Premium, minimal visual that doesn't distract from copy
 */
import { cn } from '@/lib/utils';

interface HeroOrbVisualProps {
  className?: string;
}

export function HeroOrbVisual({ className }: HeroOrbVisualProps) {
  return (
    <div className={cn("relative w-full max-w-lg mx-auto aspect-square", className)}>
      {/* Outer glow ring */}
      <div 
        className="absolute inset-8 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)'
        }}
      />
      
      {/* Main orb */}
      <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/20" />
      
      {/* Inner core */}
      <div 
        className="absolute inset-24 rounded-full motion-safe:animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 50%, transparent 70%)'
        }}
      />
      
      {/* Subtle ring accents */}
      <div className="absolute inset-20 rounded-full border border-border/10" />
      <div className="absolute inset-28 rounded-full border border-primary/5" />
      
      {/* Floating particles (static for performance) */}
      <div className="absolute top-1/4 left-1/3 w-1 h-1 rounded-full bg-primary/30" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary/20" />
      <div className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-primary/25" />
    </div>
  );
}
