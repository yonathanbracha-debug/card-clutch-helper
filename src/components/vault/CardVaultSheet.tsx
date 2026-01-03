import { useState, useMemo } from 'react';
import { Search, X, Check, CreditCard as CardIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardImage } from '@/components/CardImage';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { CreditCardDB } from '@/hooks/useCreditCards';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardDetailsSheet } from '@/components/CardDetailsSheet';

interface CardVaultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allCards: CreditCardDB[];
  selectedCardIds: string[];
  onToggleCard: (cardId: string) => void;
  onClearAll: () => void;
  onSave: () => void;
}

export function CardVaultSheet({
  open,
  onOpenChange,
  allCards,
  selectedCardIds,
  onToggleCard,
  onClearAll,
  onSave,
}: CardVaultSheetProps) {
  const [search, setSearch] = useState('');
  const [detailCard, setDetailCard] = useState<CreditCardDB | null>(null);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return allCards;
    const q = search.toLowerCase();
    return allCards.filter(
      (card) =>
        card.name.toLowerCase().includes(q) ||
        card.issuer_name.toLowerCase().includes(q) ||
        card.network.toLowerCase().includes(q)
    );
  }, [search, allCards]);

  // Group cards by issuer
  const groupedCards = useMemo(() => {
    const groups: Record<string, CreditCardDB[]> = {};
    filteredCards.forEach(card => {
      const issuer = card.issuer_name || 'Other';
      if (!groups[issuer]) {
        groups[issuer] = [];
      }
      groups[issuer].push(card);
    });
    // Sort issuers alphabetically
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [filteredCards]);

  const handleSave = () => {
    onSave();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-primary" />
            Card Vault
          </SheetTitle>
          <SheetDescription>
            Select the cards in your wallet. We'll recommend the best one for each purchase.
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cards, issuers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Card list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-2">
            {Object.keys(groupedCards).length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No cards found
              </div>
            ) : (
              Object.entries(groupedCards).map(([issuer, cards]) => (
                <div key={issuer} className="mb-2">
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    {issuer}
                  </div>
                  <div className="space-y-1">
                    {cards.map((card) => {
                      const isSelected = selectedCardIds.includes(card.id);
                      const annualFee = card.annual_fee_cents / 100;
                      
                      return (
                        <button
                          key={card.id}
                          onClick={() => onToggleCard(card.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                            "hover:bg-muted/50 active:scale-[0.99]",
                            isSelected && "bg-primary/5 ring-1 ring-primary/20"
                          )}
                        >
                          {/* Card image */}
                          <CardImage 
                            issuer={card.issuer_name}
                            cardName={card.name}
                            network={card.network}
                            size="sm"
                            className="shrink-0"
                          />
                          
                          {/* Card info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{card.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn(
                                "text-xs",
                                annualFee === 0 ? "text-primary" : "text-muted-foreground"
                              )}>
                                {annualFee === 0 ? 'No annual fee' : `$${annualFee}/yr`}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                                {card.network}
                              </span>
                            </div>
                          </div>
                          
                          {/* Info button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailCard(card);
                            }}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            aria-label={`View details for ${card.name}`}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          
                          {/* Checkbox */}
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            isSelected 
                              ? "bg-primary border-primary" 
                              : "border-border"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Sticky footer */}
        <div className="border-t border-border bg-background px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedCardIds.length}</span> selected
            </span>
            {selectedCardIds.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs">
                Clear all
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={selectedCardIds.length === 0}>
            Save selection
          </Button>
        </div>
      </SheetContent>

      {/* Card Details Sheet */}
      <CardDetailsSheet
        card={detailCard}
        open={!!detailCard}
        onOpenChange={(open) => !open && setDetailCard(null)}
      />
    </Sheet>
  );
}
