/**
 * HeroDashboardMock - Pure UI dashboard visual for hero section
 * No external images, Aura-style glass panels with grid borders
 */
import { cn } from '@/lib/utils';
import { GlassPanel } from './GlassPanel';
import { AlertTriangle, CreditCard, TrendingUp } from 'lucide-react';

interface HeroDashboardMockProps {
  className?: string;
}

export function HeroDashboardMock({ className }: HeroDashboardMockProps) {
  return (
    <div 
      className={cn(
        "relative w-full max-w-md mx-auto",
        // Subtle scroll-based translate effect (CSS only, respects reduced motion)
        "motion-safe:animate-float",
        className
      )}
    >
      {/* Main container with border grid aesthetic */}
      <div className="relative p-1 rounded-2xl bg-gradient-to-br from-border/50 via-transparent to-border/30">
        <div className="glass-panel rounded-xl p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Dashboard Preview
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">
              Example
            </span>
          </div>

          {/* Card 1: Total Utilization */}
          <div className="glass-panel-inner rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Total Utilization
              </span>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-2xl font-semibold text-foreground">23%</span>
              <span className="text-xs text-muted-foreground pb-1">across all cards</span>
            </div>
            {/* Bar graph skeleton */}
            <div className="flex items-end gap-1 h-12">
              <div className="flex-1 bg-primary/20 rounded-t" style={{ height: '40%' }} />
              <div className="flex-1 bg-primary/30 rounded-t" style={{ height: '60%' }} />
              <div className="flex-1 bg-primary/40 rounded-t" style={{ height: '35%' }} />
              <div className="flex-1 bg-primary/50 rounded-t" style={{ height: '80%' }} />
              <div className="flex-1 bg-primary/60 rounded-t" style={{ height: '55%' }} />
              <div className="flex-1 bg-primary rounded-t" style={{ height: '45%' }} />
            </div>
          </div>

          {/* Card 2: Recommended Card */}
          <div className="glass-panel-inner rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Recommended Card
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Generic card visual */}
              <div className="w-12 h-8 rounded bg-gradient-to-br from-muted to-muted-foreground/20 border border-border/50 flex items-center justify-center">
                <div className="w-6 h-1 bg-foreground/20 rounded" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Premium Rewards</p>
                <p className="text-xs text-muted-foreground">3X points on dining</p>
              </div>
            </div>
          </div>

          {/* Card 3: Alert */}
          <div className="glass-panel-inner rounded-lg p-4 border-l-2 border-l-amber-500/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-amber-500/80">
                Alert
              </span>
            </div>
            <p className="text-sm text-foreground">Statement closing in 5 days</p>
            <p className="text-xs text-muted-foreground mt-1">Current balance: $1,234</p>
          </div>
        </div>
      </div>

      {/* Decorative glow behind the card */}
      <div 
        className="absolute inset-0 -z-10 blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, hsl(var(--primary)) 0%, transparent 60%)'
        }}
      />
    </div>
  );
}
