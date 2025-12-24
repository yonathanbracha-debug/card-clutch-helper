import { CreditCard } from '@/lib/cardData';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditCardTileProps {
  card: CreditCard;
  isSelected: boolean;
  onToggle: (cardId: string) => void;
}

export function CreditCardTile({ card, isSelected, onToggle }: CreditCardTileProps) {
  // Get top rewards for display
  const topRewards = card.rewards
    .filter(r => r.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 3);

  return (
    <button
      onClick={() => onToggle(card.id)}
      className={cn(
        "relative w-full rounded-xl transition-all duration-300 group text-left",
        "hover:scale-[1.02] active:scale-[0.98]",
        isSelected 
          ? "ring-2 ring-primary shadow-lg" 
          : "opacity-70 hover:opacity-90"
      )}
    >
      {/* Card visual */}
      <div className={cn(
        "aspect-[1.586/1] rounded-xl p-4 bg-gradient-to-br relative overflow-hidden",
        card.color
      )}>
        {/* Selection indicator */}
        <div className={cn(
          "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
          isSelected 
            ? "bg-primary text-primary-foreground" 
            : "bg-foreground/20 text-transparent"
        )}>
          <Check className="w-4 h-4" />
        </div>

        {/* Card content */}
        <div className="h-full flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
              {card.issuer}
            </p>
            <h3 className="text-lg font-bold text-foreground mt-1 leading-tight">
              {card.name}
            </h3>
          </div>

          {/* Chip placeholder */}
          <div className="flex items-end justify-between">
            <div className="w-10 h-7 bg-foreground/20 rounded-md" />
            <div className="text-right">
              <p className="text-[10px] text-foreground/60 uppercase">
                {card.annualFee > 0 ? `$${card.annualFee}/yr` : 'No annual fee'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reward highlights below card */}
      <div className="mt-3 px-1">
        {topRewards.length > 0 ? (
          <div className="space-y-1">
            {topRewards.map((reward, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">{reward.description}</span>
                <span className="font-semibold text-primary ml-2">{reward.multiplier}x</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {card.rewards[0]?.multiplier || 1}x on all purchases
          </p>
        )}
      </div>
    </button>
  );
}
