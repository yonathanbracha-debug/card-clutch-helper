/**
 * AmbientBackground - Minimal, calm background
 * Deep neutral gray base, no distracting elements
 */
import { cn } from '@/lib/utils';

interface AmbientBackgroundProps {
  className?: string;
}

export function AmbientBackground({ className }: AmbientBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10", className)}>
      {/* Base background - uses theme background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Very subtle grain texture for depth */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
    </div>
  );
}
