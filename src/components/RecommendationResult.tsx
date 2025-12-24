import { Recommendation, CardAnalysis } from '@/lib/recommendationEngine';
import { CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RecommendationResultProps {
  recommendation: Recommendation;
}

export function RecommendationResult({ recommendation }: RecommendationResultProps) {
  const { card, categoryLabel, multiplier, reason, confidence, merchant, alternatives } = recommendation;
  const [showAlternatives, setShowAlternatives] = useState(false);

  const confidenceConfig = {
    high: {
      icon: CheckCircle2,
      label: 'Known merchant',
      color: 'text-primary',
    },
    medium: {
      icon: AlertCircle,
      label: 'Inferred category',
      color: 'text-amber-500 dark:text-amber-400',
    },
    low: {
      icon: Info,
      label: 'Unknown merchant',
      color: 'text-muted-foreground',
    },
  };

  const config = confidenceConfig[confidence];
  const ConfidenceIcon = config.icon;

  // Format multiplier display
  const formatMultiplier = (mult: number) => {
    if (mult === Math.floor(mult)) {
      return `${mult}X`;
    }
    return `${mult}X`;
  };

  return (
    <div className="animate-fade-in">
      {/* Detection summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Detected merchant</div>
          <div className="text-sm font-medium">{merchant?.name || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Category</div>
          <div className="text-sm font-medium">{categoryLabel}</div>
        </div>
      </div>

      {/* Primary Recommendation */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">Use this card</div>
            <div className="font-semibold text-lg">
              {card.issuer} {card.name}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {reason}
            </div>
            {card.annualFee !== null && card.annualFee > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                ${card.annualFee}/yr annual fee
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-mono font-bold text-primary">
              {formatMultiplier(multiplier)}
            </div>
            <div className="text-xs text-muted-foreground">rewards</div>
          </div>
        </div>
        
        {/* Confidence indicator */}
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-primary/10">
          <ConfidenceIcon className={cn("w-3.5 h-3.5", config.color)} />
          <span className={cn("text-xs", config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Alternative cards / Why not others */}
      {alternatives.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAlternatives ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Why not other cards?
          </button>
          
          {showAlternatives && (
            <div className="mt-3 space-y-2">
              {alternatives.map((alt) => (
                <AlternativeCard key={alt.card.id} analysis={alt} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Reward structures change. Always verify current terms with your card issuer.
        </p>
      </div>
    </div>
  );
}

function AlternativeCard({ analysis }: { analysis: CardAnalysis }) {
  const { card, effectiveMultiplier, excluded, exclusionReason, reason } = analysis;

  return (
    <div className={cn(
      "p-3 rounded-lg border text-sm",
      excluded 
        ? "bg-destructive/5 border-destructive/20" 
        : "bg-muted/30 border-border"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">
            {card.issuer} {card.name}
          </div>
          <div className={cn(
            "text-xs mt-0.5",
            excluded ? "text-destructive" : "text-muted-foreground"
          )}>
            {excluded ? exclusionReason : reason}
          </div>
        </div>
        <div className={cn(
          "font-mono text-sm font-medium flex-shrink-0",
          excluded ? "text-muted-foreground line-through" : "text-muted-foreground"
        )}>
          {effectiveMultiplier}X
        </div>
      </div>
    </div>
  );
}