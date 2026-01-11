/**
 * Opportunity Summary Card Component
 * Aggregated view of missed rewards with educational tone
 */

import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpportunitySummary } from '@/lib/opportunityCostEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OpportunitySummaryCardProps {
  summary: OpportunitySummary;
  className?: string;
}

export function OpportunitySummaryCard({ summary, className }: OpportunitySummaryCardProps) {
  const hasMissedValue = summary.total_missed_value_usd > 0;
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {summary.period === 'monthly' ? 'This Month' : 'Statement Period'}
          </CardTitle>
          <Badge variant="outline" className="text-xs capitalize">
            {summary.period}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Missed Value */}
        <div className={cn(
          'p-4 rounded-lg',
          hasMissedValue ? 'bg-primary/5' : 'bg-emerald-500/5'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Opportunity Found
              </p>
              <p className="text-2xl font-bold text-foreground">
                ${summary.total_missed_value_usd.toFixed(2)}
              </p>
            </div>
            {hasMissedValue ? (
              <TrendingUp className="h-8 w-8 text-primary/60" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
            )}
          </div>
          
          {!hasMissedValue && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
              Great job! You're using your cards optimally.
            </p>
          )}
        </div>
        
        {/* Top 3 Errors */}
        {summary.top_3_errors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Top Opportunities
            </p>
            <div className="space-y-2">
              {summary.top_3_errors.map((error, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{error.category}</p>
                      <p className="text-xs text-muted-foreground">{error.explanation}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    ${error.missed_value_usd.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Confidence Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
          <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {summary.confidence_note}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default OpportunitySummaryCard;
