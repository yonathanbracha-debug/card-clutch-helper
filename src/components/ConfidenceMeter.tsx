import { cn } from '@/lib/utils';

interface ConfidenceMeterProps {
  confidence: number; // 0-100 or 0-1
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
  // Normalize to 0-100
  const percentage = confidence > 1 ? Math.round(confidence) : Math.round(confidence * 100);
  
  const getLevel = () => {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };
  
  const level = getLevel();

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">Confidence</span>
          <span className="font-mono text-xs text-foreground">
            {labels[level]} ({percentage}%)
          </span>
        </div>
      )}
      <div className={cn("w-full bg-secondary rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
