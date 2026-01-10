/**
 * AmbientBackground - Deep dark background with gradient blobs and noise overlay
 * Aura-style aesthetic for the homepage
 */
import { cn } from '@/lib/utils';

interface AmbientBackgroundProps {
  className?: string;
}

export function AmbientBackground({ className }: AmbientBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Base background */}
      <div className="absolute inset-0 bg-aura-base" />
      
      {/* Gradient blob - top left */}
      <div 
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-30 blur-[120px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)' 
        }}
      />
      
      {/* Gradient blob - bottom right */}
      <div 
        className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full opacity-20 blur-[150px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%)' 
        }}
      />
      
      {/* Subtle center glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 blur-[200px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.2) 0%, transparent 50%)' 
        }}
      />
      
      {/* Noise overlay using inline SVG */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />
    </div>
  );
}
