import { Recommendation } from '@/lib/recommendationEngine';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationResultProps {
  recommendation: Recommendation;
}

export function RecommendationResult({ recommendation }: RecommendationResultProps) {
  const { card, categoryLabel, multiplier, reason, confidence, merchant } = recommendation;

  const confidenceConfig = {
    high: {
      icon: CheckCircle2,
      label: 'High confidence',
      color: 'text-primary',
    },
    medium: {
      icon: AlertCircle,
      label: 'Medium confidence',
      color: 'text-amber-500 dark:text-amber-400',
    },
    low: {
      icon: Info,
      label: 'Low confidence',
      color: 'text-muted-foreground',
    },
  };

  const config = confidenceConfig[confidence];
  const ConfidenceIcon = config.icon;

  return (
    <div className="animate-fade-in">
      {/* Detection summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Merchant</div>
          <div className="text-sm font-medium">{merchant?.name || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Category</div>
          <div className="text-sm font-medium">{categoryLabel}</div>
        </div>
      </div>

      {/* Recommendation */}
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
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-mono font-bold text-primary">
              {multiplier}x
            </div>
            <div className="text-xs text-muted-foreground">rewards</div>
          </div>
        </div>
        
        {/* Confidence */}
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-primary/10">
          <ConfidenceIcon className={cn("w-3.5 h-3.5", config.color)} />
          <span className={cn("text-xs", config.color)}>
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}