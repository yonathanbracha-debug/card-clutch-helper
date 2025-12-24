import { Recommendation, CardAnalysis } from '@/lib/recommendationEngine';
import { CheckCircle2, AlertCircle, HelpCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { networkLabels } from '@/lib/cardData';

interface RecommendationResultProps {
  recommendation: Recommendation;
}

export function RecommendationResult({ recommendation }: RecommendationResultProps) {
  const { card, categoryLabel, multiplier, reason, confidence, merchant, alternatives } = recommendation;
  const [showAlternatives, setShowAlternatives] = useState(false);

  const confidenceConfig = {
    high: {
      icon: CheckCircle2,
      label: 'Verified merchant',
      color: 'text-primary',
      bgColor: 'bg-primary/5',
    },
    medium: {
      icon: AlertCircle,
      label: 'Inferred category',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/5',
    },
    low: {
      icon: HelpCircle,
      label: 'Unknown merchant',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    },
  };

  const config = confidenceConfig[confidence];
  const ConfidenceIcon = config.icon;

  // Format multiplier consistently
  const formatMultiplier = (mult: number) => {
    if (mult === Math.floor(mult)) {
      return `${mult}X`;
    }
    return `${mult}%`;
  };

  // Count excluded cards
  const excludedCount = alternatives.filter(a => a.excluded).length;

  return (
    <div className="animate-fade-in">
      {/* Detection header */}
      <div className="grid grid-cols-3 gap-4 mb-5 pb-4 border-b border-border text-sm">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Merchant</div>
          <div className="font-medium truncate">{merchant?.name || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Category</div>
          <div className="font-medium">{categoryLabel}</div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <ConfidenceIcon className={cn("w-3.5 h-3.5", config.color)} />
            <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Primary recommendation */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/15">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Recommended</span>
            </div>
            <div className="font-semibold text-lg mb-0.5">
              {card.issuer} {card.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>{networkLabels[card.network]}</span>
              <span>·</span>
              <span>{card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/year`}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {reason}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-mono font-bold text-primary">
              {formatMultiplier(multiplier)}
            </div>
            <div className="text-xs text-muted-foreground">return</div>
          </div>
        </div>
      </div>

      {/* Exclusion warning if applicable */}
      {excludedCount > 0 && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="text-amber-700 dark:text-amber-300">
            {excludedCount} card{excludedCount > 1 ? 's' : ''} in your wallet {excludedCount > 1 ? 'have' : 'has'} exclusions for this merchant.
          </span>
        </div>
      )}

      {/* Why not other cards */}
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
            <div className="mt-3 space-y-1.5">
              {alternatives.map((alt) => (
                <AlternativeCard key={alt.card.id} analysis={alt} winningMultiplier={multiplier} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-5 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Reward structures change. Verify current terms with your issuer before large purchases.
        </p>
      </div>
    </div>
  );
}

function AlternativeCard({ analysis, winningMultiplier }: { analysis: CardAnalysis; winningMultiplier: number }) {
  const { card, effectiveMultiplier, excluded, exclusionReason } = analysis;

  // Generate clear explanation
  let explanation: string;
  if (excluded && exclusionReason) {
    explanation = exclusionReason;
  } else if (effectiveMultiplier < winningMultiplier) {
    explanation = `${effectiveMultiplier}X here — lower than recommended`;
  } else if (effectiveMultiplier === winningMultiplier) {
    explanation = `${effectiveMultiplier}X — tied, but higher annual fee`;
  } else {
    explanation = `${effectiveMultiplier}X return`;
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 py-2 px-3 rounded text-sm",
      excluded 
        ? "bg-destructive/5 border border-destructive/10" 
        : "bg-muted/30"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{card.issuer} {card.name}</span>
          {excluded && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase tracking-wide">
              Excluded
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {explanation}
        </div>
      </div>
      <span className={cn(
        "font-mono text-sm flex-shrink-0",
        excluded ? "text-muted-foreground line-through" : "text-muted-foreground"
      )}>
        {effectiveMultiplier}X
      </span>
    </div>
  );
}
