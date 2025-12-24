import { CreditCard } from '@/lib/cardData';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditCardTileProps {
  card: CreditCard;
  isSelected: boolean;
  onToggle: (cardId: string) => void;
}

export function CreditCardTile({ card, isSelected, onToggle }: CreditCardTileProps) {
  return (
    <button
      onClick={() => onToggle(card.id)}
      className={cn(
        "relative w-full aspect-[1.586/1] rounded-xl p-4 transition-all duration-300 group",
        "bg-gradient-to-br",
        card.color,
        isSelected 
          ? "ring-2 ring-primary shadow-lg scale-[1.02]" 
          : "opacity-60 hover:opacity-80 hover:scale-[1.01]"
      )}
    >
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
      <div className="h-full flex flex-col justify-between text-left">
        <div>
          <p className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
            {card.issuer}
          </p>
          <h3 className="text-lg font-bold text-foreground mt-1">
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
    </button>
  );
}
