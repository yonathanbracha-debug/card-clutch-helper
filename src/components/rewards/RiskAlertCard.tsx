/**
 * Risk Alert Card Component
 * Displays BNPL and high-risk purchase warnings with calm, factual tone
 * Follows CardClutch philosophy: no shame, no pressure, calm authority
 */

import { AlertTriangle, Shield, Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskAlert, BNPLRiskResponse, RiskLevel } from '@/lib/opportunityCostEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface RiskAlertCardProps {
  alert: RiskAlert;
  className?: string;
}

interface BNPLAlertCardProps {
  response: BNPLRiskResponse;
  onClassify?: (classification: 'essential' | 'planned' | 'impulse' | 'unsure') => void;
  className?: string;
}

const getRiskLevelColor = (level: RiskLevel) => {
  switch (level) {
    case 'high': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'medium': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getRiskLevelLabel = (level: RiskLevel) => {
  switch (level) {
    case 'high': return 'Worth considering';
    case 'medium': return 'May apply';
    default: return 'For your awareness';
  }
};

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

export function BNPLAlertCard({ response, onClassify, className }: BNPLAlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showClassification, setShowClassification] = useState(false);

  if (!response.bnpl_detected || response.suppressed) {
    return null;
  }

  return (
    <Card className={cn(
      'overflow-hidden transition-colors',
      getRiskLevelColor(response.risk_level),
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground">BNPL Detected</p>
                {response.bnpl_provider && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {response.bnpl_provider}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {getRiskLevelLabel(response.risk_level)}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              response.risk_level === 'high' && "border-amber-500 text-amber-600",
              response.risk_level === 'medium' && "border-blue-500 text-blue-600"
            )}
          >
            Score: {response.risk_score}
          </Badge>
        </div>

        {/* Explanations */}
        <div className="space-y-2 mb-4">
          {response.explanation.slice(0, 2).map((exp, i) => (
            <p key={i} className="text-sm text-foreground">
              {i === 0 ? exp : `• ${exp}`}
            </p>
          ))}
        </div>

        {/* Alternatives (for medium/high risk) */}
        {response.alternatives.length > 0 && (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-3">
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180"
              )} />
              View alternatives
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                {response.alternatives.map((alt, i) => (
                  <p key={i} className="text-sm text-foreground flex items-start gap-2">
                    <Shield className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                    {alt}
                  </p>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Purchase Classification (only for high risk) */}
        {response.user_prompt_shown && onClassify && (
          <>
            {!showClassification ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClassification(true)}
                className="w-full text-xs"
              >
                Classify this purchase (optional)
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Before continuing, would you like to classify this purchase?
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['essential', 'planned', 'impulse', 'unsure'] as const).map(classification => (
                    <Button
                      key={classification}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClassify(classification);
                        setShowClassification(false);
                      }}
                      className="text-xs capitalize"
                    >
                      {classification === 'unsure' ? 'Not sure' : classification}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
          This insight is based solely on your data.
        </p>
      </CardContent>
    </Card>
  );
}

export default RiskAlertCard;
