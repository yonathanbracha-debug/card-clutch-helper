import { useState, useMemo } from 'react';
import { creditCards, CreditCard, networkLabels } from '@/lib/cardData';
import { Search, X, Check, ChevronDown, CreditCard as CardIcon } from 'lucide-react';
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
        card.issuer.toLowerCase().includes(q) ||
        card.network.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedCardObjects = useMemo(() => {
    return creditCards.filter((card) => selectedCards.includes(card.id));
  }, [selectedCards]);

  // Group cards by issuer for better organization
  const groupedCards = useMemo(() => {
    const groups: Record<string, CreditCard[]> = {};
    filteredCards.forEach(card => {
      if (!groups[card.issuer]) {
        groups[card.issuer] = [];
      }
      groups[card.issuer].push(card);
    });
    return groups;
  }, [filteredCards]);

  return (
    <div className="w-full">
      {/* Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left",
              "bg-card hover:bg-muted/50 border-border",
              open && "ring-2 ring-primary/20 border-primary/50"
            )}
          >
            <div className="flex items-center gap-2">
              <CardIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedCards.length === 0
                  ? 'Select your cards'
                  : `${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''} selected`}
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )} />
          </button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 max-w-md" 
          align="start"
          sideOffset={4}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by card, issuer, or network..."
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
          <div className="max-h-80 overflow-y-auto">
            {Object.keys(groupedCards).length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No cards found
              </div>
            ) : (
              Object.entries(groupedCards).map(([issuer, cards]) => (
                <div key={issuer}>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/50 sticky top-0">
                    {issuer}
                  </div>
                  {cards.map((card) => {
                    const isSelected = selectedCards.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => onToggleCard(card.id)}
                        className={cn(
                          "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/50 last:border-0",
                          "hover:bg-muted/50",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        {/* Checkbox */}
                        <div className={cn(
                          "w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected 
                            ? "bg-primary border-primary" 
                            : "border-border"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        
                        {/* Card info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{card.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
                              {networkLabels[card.network]}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {card.rewardSummary}
                          </div>
                        </div>
                        
                        {/* Annual fee */}
                        <div className="text-right flex-shrink-0">
                          <div className={cn(
                            "text-xs font-medium",
                            card.annualFee === 0 ? "text-primary" : "text-muted-foreground"
                          )}>
                            {card.annualFee === 0 ? 'No fee' : `$${card.annualFee}/yr`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected cards as compact chips */}
      {selectedCardObjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {selectedCardObjects.map((card) => (
            <div
              key={card.id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded bg-muted text-xs"
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
