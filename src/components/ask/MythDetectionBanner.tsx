/**
 * Myth Detection Banner - Non-dismissable warning for detected myths
 * CRITICAL for trust and user education
 */
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MythFlag {
  myth: string;
  correction: string;
}

interface MythDetectionBannerProps {
  myths: MythFlag[];
  className?: string;
}

export function MythDetectionBanner({ myths, className }: MythDetectionBannerProps) {
  if (!myths || myths.length === 0) return null;

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      "bg-amber-500/5 border-amber-500/30",
      className
    )}>
      {myths.map((myth, index) => (
        <div 
          key={index}
          className={cn(
            "p-4",
            index > 0 && "border-t border-amber-500/20"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Common Misconception
                </span>
              </div>
              <p className="text-sm font-medium text-foreground mb-2">
                {myth.myth}
              </p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50">
                <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Reality: </span>
                  {myth.correction}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
