import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useWalletCards } from '@/hooks/useWalletCards';
import { useCreditCards } from '@/hooks/useCreditCards';
import { 
  Search, 
  Plus, 
  Check, 
  X, 
  Wallet, 
  AlertCircle,
  ChevronDown,
  ExternalLink,
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
        card.issuer_name.toLowerCase().includes(searchQuery.toLowerCase());
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
        <main className="pt-20 pb-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      
      <main className="pt-20 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
            <p className="text-muted-foreground">
              Select the credit cards you own to get personalized recommendations.
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
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  ${card.annual_fee_cents / 100}/yr
                                </span>
                                <a
                                  href={card.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded hover:bg-muted-foreground/20 transition-colors"
                                  title="View official terms"
                                >
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </a>
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
                  <div className="py-12 text-center text-muted-foreground">
                    No cards found matching your search.
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
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No cards selected yet.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select cards from the list to add them to your wallet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCardDetails.map(card => {
                        const walletCard = getWalletCard(card.id);
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
                                <p className="text-xs text-muted-foreground">{card.issuer_name}</p>
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
                                          ? 'bg-emerald-500/20 text-emerald-600'
                                          : level === 'medium'
                                            ? 'bg-amber-500/20 text-amber-600'
                                            : 'bg-red-500/20 text-red-600'
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
