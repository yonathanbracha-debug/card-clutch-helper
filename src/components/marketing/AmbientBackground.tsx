/**
 * AmbientBackground - Deep dark background matching reference
 * Near-black with subtle gradient, minimal glow
 */
import { cn } from '@/lib/utils';
import { useParallax } from './useParallax';

interface AmbientBackgroundProps {
  className?: string;
  enableParallax?: boolean;
}

export function AmbientBackground({ className, enableParallax = true }: AmbientBackgroundProps) {
  const parallaxOffset = useParallax(0.06);
  
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Base background - deep dark matching reference */}
      <div className="absolute inset-0 bg-[hsl(220,18%,4%)]" />
      
      {/* Very subtle gradient blob - top (almost invisible) */}
      <div 
        className="absolute -top-1/3 -left-1/4 w-1/2 h-1/2 rounded-full opacity-[0.08] blur-[160px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
          transform: enableParallax ? `translateY(${parallaxOffset * 0.4}px)` : undefined
        }}
      />
      
      {/* Very subtle gradient blob - bottom right */}
      <div 
        className="absolute -bottom-1/3 -right-1/4 w-1/2 h-1/2 rounded-full opacity-[0.06] blur-[180px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(200 20% 25% / 0.3) 0%, transparent 70%)',
          transform: enableParallax ? `translateY(${-parallaxOffset * 0.3}px)` : undefined
        }}
      />
      
      {/* Very subtle noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}
