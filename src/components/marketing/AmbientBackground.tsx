/**
 * AmbientBackground - Deep dark background with reduced gradient blobs
 * More muted, professional aesthetic with optional parallax
 */
import { cn } from '@/lib/utils';
import { useParallax } from './useParallax';

interface AmbientBackgroundProps {
  className?: string;
  enableParallax?: boolean;
}

export function AmbientBackground({ className, enableParallax = true }: AmbientBackgroundProps) {
  const parallaxOffset = useParallax(0.08);
  
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Base background - near black */}
      <div className="absolute inset-0 bg-[hsl(220,15%,5%)]" />
      
      {/* Gradient blob - top left (muted) */}
      <div 
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-15 blur-[140px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
          transform: enableParallax ? `translateY(${parallaxOffset * 0.5}px)` : undefined
        }}
      />
      
      {/* Gradient blob - bottom right (very subtle) */}
      <div 
        className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full opacity-10 blur-[160px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(200 30% 30% / 0.25) 0%, transparent 70%)',
          transform: enableParallax ? `translateY(${-parallaxOffset * 0.3}px)` : undefined
        }}
      />
      
      {/* Very subtle center glow */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full h-1/2 opacity-5 blur-[200px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.15) 0%, transparent 60%)'
        }}
      />
      
      {/* Noise overlay - very subtle */}
      <div 
        className="absolute inset-0 opacity-[0.012] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />
    </div>
  );
}
