import { Recommendation } from '@/lib/recommendationEngine';
import { CreditCard, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationResultProps {
  recommendation: Recommendation;
}

export function RecommendationResult({ recommendation }: RecommendationResultProps) {
  const { card, categoryLabel, multiplier, reason, confidence, merchant } = recommendation;

  const confidenceConfig = {
    high: {
      icon: CheckCircle2,
      label: 'Confident recommendation',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    medium: {
      icon: AlertCircle,
      label: 'Good match',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    low: {
      icon: Shield,
      label: 'Safe choice',
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
  };

  const config = confidenceConfig[confidence];
  const ConfidenceIcon = config.icon;

  return (
    <div className="animate-slide-up glass-card rounded-2xl p-6 md:p-8 max-w-xl mx-auto text-left">
      {/* Detection info */}
      <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Merchant detected</p>
            <p className="font-semibold text-foreground">{merchant?.name || 'Unknown store'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Category detected</p>
            <p className="font-semibold text-foreground">{categoryLabel}</p>
          </div>
        </div>
      </div>

      {/* Confidence badge */}
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6", config.bg)}>
        <ConfidenceIcon className={cn("w-4 h-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}
        </span>
      </div>

      {/* Recommended card - Hero element */}
      <div className="relative">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Use this card
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
            
            <div className="bg-foreground/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-foreground/80">Earn</p>
              <p className="text-2xl font-bold text-foreground">{multiplier}x</p>
            </div>
          </div>

          {/* Chip */}
          <div className="mt-6 flex items-end justify-between">
            <div className="w-12 h-8 bg-foreground/20 rounded-md" />
            <CreditCard className="w-8 h-8 text-foreground/60" />
          </div>
        </div>
      </div>

      {/* Why this card */}
      <div className="mt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Why this card?</p>
        <p className="text-sm text-foreground leading-relaxed">
          {reason}
        </p>
      </div>
    </div>
  );
}
