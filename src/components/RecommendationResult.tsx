import { Recommendation } from '@/lib/recommendationEngine';
import { CreditCard, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
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
      color: 'text-amber-400',
    },
    low: {
      icon: HelpCircle,
      label: 'Conservative estimate',
      color: 'text-muted-foreground',
    },
  };

  const config = confidenceConfig[confidence];
  const ConfidenceIcon = config.icon;

  return (
    <div className="animate-slide-up glass-card rounded-2xl p-6 md:p-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ConfidenceIcon className={cn("w-5 h-5", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}
        </span>
      </div>

      {/* Merchant info */}
      {merchant && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Shopping at</p>
          <p className="text-xl font-semibold">{merchant.name}</p>
        </div>
      )}

      {/* Category badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full mb-6">
        <span className="text-sm font-medium">{categoryLabel}</span>
      </div>

      {/* Recommended card */}
      <div className="relative">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Recommended Card
        </p>
        
        <div className={cn(
          "relative rounded-xl p-5 bg-gradient-to-br",
          card.color,
          "shadow-lg"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
                {card.issuer}
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {card.name}
              </h3>
            </div>
            
            <div className="bg-foreground/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs text-foreground/80">Earn</p>
              <p className="text-2xl font-bold text-foreground">{multiplier}X</p>
            </div>
          </div>

          {/* Chip */}
          <div className="mt-6 flex items-end justify-between">
            <div className="w-12 h-8 bg-foreground/20 rounded-md" />
            <CreditCard className="w-8 h-8 text-foreground/60" />
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {reason}
        </p>
      </div>
    </div>
  );
}
