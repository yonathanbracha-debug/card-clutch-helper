/**
 * Missed Opportunity Card Component
 * Displays individual missed rewards in an educational, non-judgmental format
 */

import { ChevronDown, ChevronUp, DollarSign, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MissedOpportunity } from '@/lib/opportunityCostEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MissedOpportunityCardProps {
  opportunity: MissedOpportunity;
  className?: string;
}

export function MissedOpportunityCard({ opportunity, className }: MissedOpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card className={cn('overflow-hidden transition-all', className)}>
      <CardContent className="p-4">
        {/* Summary - Always Visible */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {opportunity.summary}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-primary/5">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${opportunity.cost.missed_value_usd.toFixed(2)} missed
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {opportunity.cost.missed_points} pts
                </Badge>
              </div>
            </div>
            <div className="text-muted-foreground">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </div>
        </button>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {/* What Happened */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                What happened
              </p>
              <p className="text-sm text-foreground">{opportunity.what_happened}</p>
            </div>
            
            {/* What Should Have Happened */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Better option
              </p>
              <p className="text-sm text-foreground">{opportunity.what_should_have_happened}</p>
            </div>
            
            {/* Why It Matters */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Annual impact</p>
                  <p className="text-sm text-muted-foreground">{opportunity.why_it_matters}</p>
                </div>
              </div>
            </div>
            
            {/* Prevention Rule */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                Remember
              </p>
              <p className="text-sm text-foreground">{opportunity.prevention_rule}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MissedOpportunityCard;
