/**
 * Risk Alert Card Component
 * Displays BNPL and high-risk purchase warnings with calm, factual tone
 */

import { AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskAlert } from '@/lib/opportunityCostEngine';
import { Card, CardContent } from '@/components/ui/card';

interface RiskAlertCardProps {
  alert: RiskAlert;
  className?: string;
}

export function RiskAlertCard({ alert, className }: RiskAlertCardProps) {
  return (
    <Card className={cn('overflow-hidden border-amber-500/20', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">{alert.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{alert.explanation}</p>
          </div>
        </div>
        
        {/* Long Term Cost */}
        <div className="p-3 rounded-lg bg-muted/50 mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Potential Cost
          </p>
          <p className="text-sm text-foreground">{alert.long_term_cost_estimate}</p>
        </div>
        
        {/* Safer Alternative */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                Safer Option
              </p>
              <p className="text-sm text-foreground">{alert.safer_alternative}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RiskAlertCard;
