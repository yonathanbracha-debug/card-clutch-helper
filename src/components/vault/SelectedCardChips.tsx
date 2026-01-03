import { useState } from 'react';
import { X, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardImage } from '@/components/CardImage';
import { CreditCardDB } from '@/hooks/useCreditCards';
import { CardDetailsSheet } from '@/components/CardDetailsSheet';

interface SelectedCardChipsProps {
  selectedCards: CreditCardDB[];
  onRemoveCard: (cardId: string) => void;
  onShowMore: () => void;
  maxVisible?: number;
  className?: string;
}

export function SelectedCardChips({
  selectedCards,
  onRemoveCard,
  onShowMore,
  maxVisible = 6,
  className,
}: SelectedCardChipsProps) {
  const [detailCard, setDetailCard] = useState<CreditCardDB | null>(null);

  if (selectedCards.length === 0) return null;

  const visibleCards = selectedCards.slice(0, maxVisible);
  const hiddenCount = selectedCards.length - maxVisible;

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {visibleCards.map((card) => (
          <div
            key={card.id}
            className="inline-flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full bg-muted/80 border border-border/50 group hover:bg-muted transition-colors"
          >
            <CardImage 
              issuer={card.issuer_name}
              cardName={card.name}
              network={card.network}
              size="sm"
              className="w-6 h-4"
            />
            <span className="text-xs font-medium truncate max-w-24">
              {card.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDetailCard(card);
              }}
              className="p-0.5 rounded-full hover:bg-background text-muted-foreground hover:text-primary transition-colors"
              aria-label={`View details for ${card.name}`}
            >
              <Info className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCard(card.id);
              }}
              className="p-0.5 rounded-full hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Remove ${card.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <button
            onClick={onShowMore}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            +{hiddenCount} more
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Card Details Sheet */}
      <CardDetailsSheet
        card={detailCard}
        open={!!detailCard}
        onOpenChange={(open) => !open && setDetailCard(null)}
      />
    </>
  );
}
