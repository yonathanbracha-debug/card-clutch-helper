import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Check, 
  X, 
  Wallet, 
  AlertCircle,
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { creditCards, CreditCard } from '@/lib/cardData';
import { usePersistedCards } from '@/hooks/usePersistedCards';
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

type UtilizationLevel = 'low' | 'medium' | 'high';

interface WalletCard {
  cardId: string;
  utilization: UtilizationLevel;
  doNotRecommend: boolean;
  nickname?: string;
}

const Vault = () => {
  const { selectedCards, toggleCard } = usePersistedCards();
  const [searchQuery, setSearchQuery] = useState('');
  const [issuerFilter, setIssuerFilter] = useState<string>('all');
  const [walletCards, setWalletCards] = useState<WalletCard[]>(() => {
    const stored = localStorage.getItem('cardclutch-wallet');
    return stored ? JSON.parse(stored) : [];
  });

  // Get unique issuers
  const issuers = useMemo(() => {
    const unique = [...new Set(creditCards.map(c => c.issuer))];
    return unique.sort();
  }, []);

  // Filter cards
  const filteredCards = useMemo(() => {
    return creditCards.filter(card => {
      const matchesSearch = 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.issuer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIssuer = issuerFilter === 'all' || card.issuer === issuerFilter;
      return matchesSearch && matchesIssuer;
    });
  }, [searchQuery, issuerFilter]);

  // Group by issuer
  const groupedCards = useMemo(() => {
    const groups: Record<string, CreditCard[]> = {};
    filteredCards.forEach(card => {
      if (!groups[card.issuer]) groups[card.issuer] = [];
      groups[card.issuer].push(card);
    });
    return groups;
  }, [filteredCards]);

  // Get selected card details
  const selectedCardDetails = useMemo(() => {
    return selectedCards.map(id => creditCards.find(c => c.id === id)).filter(Boolean) as CreditCard[];
  }, [selectedCards]);

  const updateWalletCard = (cardId: string, updates: Partial<WalletCard>) => {
    setWalletCards(prev => {
      const existing = prev.find(w => w.cardId === cardId);
      const updated = existing 
        ? prev.map(w => w.cardId === cardId ? { ...w, ...updates } : w)
        : [...prev, { cardId, utilization: 'low', doNotRecommend: false, ...updates }];
      localStorage.setItem('cardclutch-wallet', JSON.stringify(updated));
      return updated;
    });
  };

  const getWalletCard = (cardId: string): WalletCard | undefined => {
    return walletCards.find(w => w.cardId === cardId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
                {Object.entries(groupedCards).map(([issuer, cards]) => (
                  <Collapsible key={issuer} defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                      <span className="font-medium">{issuer}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {cards.length} cards
                        </Badge>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="space-y-2">
                        {cards.map(card => {
                          const isSelected = selectedCards.includes(card.id);
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
                                issuer={card.issuer} 
                                cardName={card.name} 
                                network={card.network}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{card.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {card.rewardSummary}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  ${card.annualFee}/yr
                                </span>
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
                      {selectedCards.length}
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
                                issuer={card.issuer} 
                                cardName={card.name} 
                                network={card.network}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{card.name}</p>
                                <p className="text-xs text-muted-foreground">{card.issuer}</p>
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
                                      updateWalletCard(card.id, { utilization: level });
                                    }}
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs capitalize transition-colors",
                                      walletCard?.utilization === level || (!walletCard && level === 'low')
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

                {selectedCards.length > 0 && (
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