import { cn } from '@/lib/utils';

interface ConfidenceMeterProps {
  confidence: number; // 0-1
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceMeter({ 
  confidence, 
  size = 'md', 
  showLabel = true,
  className 
}: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100);
  
  const getLevel = () => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  };
  
  const level = getLevel();
  
  const colors = {
    high: 'bg-emerald-500',
    medium: 'bg-amber-500',
    low: 'bg-red-500',
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className={cn(
            "font-medium",
            level === 'high' && 'text-emerald-500',
            level === 'medium' && 'text-amber-500',
            level === 'low' && 'text-red-500'
          )}>
            {labels[level]} ({percentage}%)
          </span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colors[level])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}