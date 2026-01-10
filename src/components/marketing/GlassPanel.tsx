/**
 * GlassPanel - Frosted glass effect container for Aura aesthetic
 */
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassPanel({ children, className, hover = false }: GlassPanelProps) {
  return (
    <div 
      className={cn(
        "glass-panel rounded-xl p-6",
        hover && "transition-all duration-300 hover:-translate-y-1 hover:border-border/40 motion-reduce:hover:translate-y-0",
        className
      )}
    >
      {children}
    </div>
  );
}
