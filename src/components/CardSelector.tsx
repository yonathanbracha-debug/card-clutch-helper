import { useState, useMemo } from 'react';
import { creditCards, CreditCard } from '@/lib/cardData';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CardSelectorProps {
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
}

export function CardSelector({ selectedCards, onToggleCard }: CardSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCards = useMemo(() => {
    if (!search.trim()) return creditCards;
    const q = search.toLowerCase();
    return creditCards.filter(
      (card) =>
        card.name.toLowerCase().includes(q) ||
        card.issuer.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedCardObjects = useMemo(() => {
    return creditCards.filter((card) => selectedCards.includes(card.id));
  }, [selectedCards]);

  return (
    <div className="w-full">
      {/* Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-left",
              "bg-card hover:bg-card-hover border-border",
              open && "ring-2 ring-ring ring-offset-2 ring-offset-background"
            )}
          >
            <span className="text-sm text-muted-foreground">
              {selectedCards.length === 0
                ? 'Select your cards...'
                : `${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''} selected`}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )} />
          </button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          sideOffset={4}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {/* Card list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredCards.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No cards found
              </div>
            ) : (
              filteredCards.map((card) => {
                const isSelected = selectedCards.includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => onToggleCard(card.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      "hover:bg-muted",
                      isSelected && "bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                      isSelected 
                        ? "bg-primary border-primary" 
                        : "border-border"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {card.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {card.issuer}
                        {card.annualFee > 0 && ` • $${card.annualFee}/yr`}
                      </div>
                    </div>
                    <CardRewardBadge card={card} />
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected cards as chips */}
      {selectedCardObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedCardObjects.map((card) => (
            <div
              key={card.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md bg-muted text-sm"
            >
              <span className="font-medium">{card.issuer}</span>
              <span className="text-muted-foreground">{card.name}</span>
              <button
                onClick={() => onToggleCard(card.id)}
                className="ml-0.5 p-0.5 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CardRewardBadge({ card }: { card: CreditCard }) {
  const topReward = card.rewards
    .filter((r) => r.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier)[0];

  if (!topReward) {
    return (
      <span className="text-xs text-muted-foreground font-mono">
        {card.rewards[0]?.multiplier || 1}x
      </span>
    );
  }

  return (
    <span className="text-xs text-primary font-mono font-medium">
      {topReward.multiplier}x
    </span>
  );
}