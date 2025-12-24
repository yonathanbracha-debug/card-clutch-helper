import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { CardInfoDrawer } from '@/components/CardInfoDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useWalletCards } from '@/hooks/useWalletCards';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { 
  Search, 
  Plus, 
  Check, 
  X, 
  Wallet, 
  AlertCircle,
  ChevronDown,
  Info,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from 'react-router-dom';

// Data integrity check for Amex Gold
function checkDataIntegrity(cards: CreditCardDB[]): { stale: boolean; message: string } {
  const amexGold = cards.find(c => 
    c.name.toLowerCase().includes('gold') && 
    c.issuer_name.toLowerCase().includes('american express')
  );
  
  if (amexGold && amexGold.annual_fee_cents === 25000) {
    return { 
      stale: true, 
      message: 'Catalog stale: Amex Gold shows $250 but should be $325' 
    };
  }
  
  return { stale: false, message: '' };
}

const Vault = () => {
  const { user } = useAuth();
  const { preferences, loading: prefsLoading, refetch: refetchPrefs } = useUserPreferences();
  const { cards, loading: cardsLoading } = useCreditCards();
  const { 
    walletCards, 
    loading: walletLoading, 
    toggleCard, 
    updateCard,
    selectedCardIds 
  } = useWalletCards();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [issuerFilter, setIssuerFilter] = useState<string>('all');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedCardForDrawer, setSelectedCardForDrawer] = useState<CreditCardDB | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data integrity check
  const dataIntegrity = useMemo(() => checkDataIntegrity(cards), [cards]);

  // Show onboarding if not completed
  useEffect(() => {
    if (!prefsLoading && preferences && !preferences.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [preferences, prefsLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchPrefs();
  };

  const handleOpenDrawer = (card: CreditCardDB, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCardForDrawer(card);
    setDrawerOpen(true);
  };

  // Get unique issuers from DB cards
  const issuers = useMemo(() => {
    const unique = [...new Set(cards.map(c => c.issuer_name))];
    return unique.sort();
  }, [cards]);

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.issuer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.reward_summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIssuer = issuerFilter === 'all' || card.issuer_name === issuerFilter;
      return matchesSearch && matchesIssuer;
    });
  }, [cards, searchQuery, issuerFilter]);

  // Group by issuer
  const groupedCards = useMemo(() => {
    const groups: Record<string, typeof filteredCards> = {};
    filteredCards.forEach(card => {
      if (!groups[card.issuer_name]) groups[card.issuer_name] = [];
      groups[card.issuer_name].push(card);
    });
    return groups;
  }, [filteredCards]);

  // Get selected card details
  const selectedCardDetails = useMemo(() => {
    return selectedCardIds
      .map(id => cards.find(c => c.id === id))
      .filter(Boolean) as typeof cards;
  }, [selectedCardIds, cards]);

  const getWalletCard = (cardId: string) => {
    return walletCards.find(w => w.card_id === cardId);
  };

  const isLoading = cardsLoading || walletLoading || prefsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="mb-8">
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-12 w-full" />
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <OnboardingModal 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete}
      />

      <CardInfoDrawer 
        card={selectedCardForDrawer}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Data Integrity Warning (dev) */}
          {dataIntegrity.stale && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
              ⚠️ {dataIntegrity.message}
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
            <p className="text-muted-foreground">
              Right card. Right moment. Select your cards to get personalized recommendations.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Card Selector */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={issuerFilter} onValueChange={setIssuerFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Issuers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Issuers</SelectItem>
                    {issuers.map(issuer => (
                      <SelectItem key={issuer} value={issuer}>{issuer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cards List */}
              <div className="space-y-4">
                {Object.entries(groupedCards).map(([issuer, issuerCards]) => (
                  <Collapsible key={issuer} defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                      <span className="font-medium">{issuer}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {issuerCards.length} cards
                        </Badge>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="space-y-2">
                        {issuerCards.map(card => {
                          const isSelected = selectedCardIds.includes(card.id);
                          const annualFee = card.annual_fee_cents / 100;
                          return (
                            <div
                              key={card.id}
                              className={cn(
                                "flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer group",
                                isSelected 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-muted-foreground/50"
                              )}
                              onClick={() => toggleCard(card.id)}
                            >
                              <CardImage 
                                issuer={card.issuer_name} 
                                cardName={card.name} 
                                network={card.network as any}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{card.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {card.reward_summary}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {annualFee === 0 ? 'Free' : `$${annualFee}/yr`}
                                </span>
                                <button
                                  onClick={(e) => handleOpenDrawer(card, e)}
                                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                  title="View card details"
                                >
                                  <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </button>
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                )}>
                                  {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}

                {Object.keys(groupedCards).length === 0 && (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No cards found.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">My Wallet</h2>
                    <Badge variant="secondary" className="ml-auto">
                      {selectedCardIds.length}
                    </Badge>
                  </div>

                  {selectedCardDetails.length === 0 ? (
                    <div className="py-8 text-center">
                      <Wallet className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Your wallet is empty.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select cards to get personalized recommendations.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCardDetails.map(card => {
                        const walletCard = getWalletCard(card.id);
                        const annualFee = card.annual_fee_cents / 100;
                        return (
                          <div key={card.id} className="p-3 rounded-lg bg-muted/50 space-y-3">
                            <div className="flex items-center gap-3">
                              <CardImage 
                                issuer={card.issuer_name} 
                                cardName={card.name} 
                                network={card.network as any}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{card.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {annualFee === 0 ? 'No fee' : `$${annualFee}/yr`}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCard(card.id);
                                }}
                                className="p-1 rounded hover:bg-muted-foreground/20 transition-colors"
                              >
                                <X className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Utilization:</span>
                              <div className="flex gap-1">
                                {(['low', 'medium', 'high'] as const).map(level => (
                                  <button
                                    key={level}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateCard(card.id, { utilization_status: level });
                                    }}
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs capitalize transition-colors",
                                      walletCard?.utilization_status === level || (!walletCard && level === 'low')
                                        ? level === 'low' 
                                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                          : level === 'medium'
                                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                        : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                                    )}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedCardIds.length > 0 && (
                  <Link to="/recommend">
                    <Button className="w-full gap-2">
                      Get Recommendation
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vault;
