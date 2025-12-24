import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/CardImage';
import { cn } from '@/lib/utils';
import { 
  Target, 
  Shield, 
  Search, 
  Plus, 
  Check, 
  ArrowRight, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { useWalletCards } from '@/hooks/useWalletCards';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type OnboardingStep = 1 | 2 | 3;

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<'rewards' | 'conservative' | null>(null);
  
  const { cards, loading: cardsLoading } = useCreditCards();
  const { walletCards, addCard, removeCard, selectedCardIds } = useWalletCards();
  const { updatePreferences } = useUserPreferences();

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards.slice(0, 10);
    return cards.filter(card => 
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.issuer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cards, searchQuery]);

  const groupedCards = useMemo(() => {
    const groups: Record<string, CreditCardDB[]> = {};
    filteredCards.forEach(card => {
      const issuer = card.issuer_name;
      if (!groups[issuer]) groups[issuer] = [];
      groups[issuer].push(card);
    });
    return groups;
  }, [filteredCards]);

  const handleModeSelect = async (mode: 'rewards' | 'conservative') => {
    setSelectedMode(mode);
    await updatePreferences({ mode });
    setStep(2);
  };

  const handleCardToggle = async (cardId: string) => {
    const isSelected = selectedCardIds.includes(cardId);
    if (isSelected) {
      await removeCard(cardId);
    } else {
      await addCard(cardId);
    }
  };

  const handleFinish = async () => {
    await updatePreferences({ onboarding_completed: true });
    onComplete();
  };

  const canProceedToStep3 = selectedCardIds.length >= 2;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Progress Bar */}
        <div className="flex items-center gap-2 px-6 pt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Choose Mode */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Welcome to CardClutch</h2>
                <p className="text-muted-foreground">Choose your primary goal</p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => handleModeSelect('rewards')}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    selectedMode === 'rewards' 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Optimize Rewards</h3>
                      <p className="text-sm text-muted-foreground">
                        Maximize points, miles, and cash back on every purchase. Get recommendations based on highest earning potential.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect('conservative')}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    selectedMode === 'conservative' 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Protect Credit</h3>
                      <p className="text-sm text-muted-foreground">
                        Balance utilization across cards and avoid overspending. Get recommendations that help maintain healthy credit.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Cards */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Add Your Cards</h2>
                <p className="text-muted-foreground">Select at least 2 cards to get started</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards by name or issuer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Selected Count */}
              <div className="flex items-center justify-between">
                <Badge variant={canProceedToStep3 ? "default" : "secondary"}>
                  {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''} selected
                </Badge>
                {!canProceedToStep3 && (
                  <span className="text-xs text-muted-foreground">
                    Select at least 2 cards
                  </span>
                )}
              </div>

              {/* Cards List */}
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {cardsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading cards...</div>
                ) : (
                  Object.entries(groupedCards).map(([issuer, issuerCards]) => (
                    <div key={issuer} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground px-1 py-1">
                        {issuer}
                      </div>
                      {issuerCards.map(card => {
                        const isSelected = selectedCardIds.includes(card.id);
                        return (
                          <button
                            key={card.id}
                            onClick={() => handleCardToggle(card.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-muted-foreground/50"
                            )}
                          >
                            <CardImage 
                              issuer={card.issuer_name} 
                              cardName={card.name} 
                              network={card.network as any}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{card.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {card.reward_summary}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                ${card.annual_fee_cents / 100}/yr
                              </span>
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                                isSelected 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!canProceedToStep3}
                  className="flex-1 gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Try It */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
                <p className="text-muted-foreground">
                  Try getting a recommendation for your next purchase
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Example: Shopping on Amazon
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">amazon.com/cart</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  CardClutch will detect the merchant and recommend your best card based on category bonuses and exclusions.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleFinish} className="flex-1 gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
