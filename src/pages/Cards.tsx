import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { CardInfoDrawer } from '@/components/CardInfoDrawer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, Filter, X, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Cards = () => {
  const { cards, loading } = useCreditCards();
  const [searchQuery, setSearchQuery] = useState('');
  const [issuerFilter, setIssuerFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [feeFilter, setFeeFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<CreditCardDB | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const issuers = useMemo(() => [...new Set(cards.map(c => c.issuer_name))].sort(), [cards]);
  const networks = useMemo(() => [...new Set(cards.map(c => c.network))].sort(), [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.issuer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.reward_summary.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesIssuer = issuerFilter === 'all' || card.issuer_name === issuerFilter;
      const matchesNetwork = networkFilter === 'all' || card.network.toLowerCase() === networkFilter;
      
      const annualFee = card.annual_fee_cents / 100;
      let matchesFee = true;
      if (feeFilter === 'free') matchesFee = annualFee === 0;
      else if (feeFilter === 'under100') matchesFee = annualFee < 100;
      else if (feeFilter === 'over100') matchesFee = annualFee >= 100;
      
      return matchesSearch && matchesIssuer && matchesNetwork && matchesFee;
    });
  }, [cards, searchQuery, issuerFilter, networkFilter, feeFilter]);

  const hasActiveFilters = issuerFilter !== 'all' || networkFilter !== 'all' || feeFilter !== 'all';

  const clearFilters = () => {
    setIssuerFilter('all');
    setNetworkFilter('all');
    setFeeFilter('all');
    setSearchQuery('');
  };

  const handleOpenDrawer = (card: CreditCardDB, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCard(card);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="mb-8">
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-12 w-full mb-8" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
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

      <CardInfoDrawer 
        card={selectedCard}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Card Library</h1>
            <p className="text-muted-foreground">
              Browse {cards.length} credit cards with verified reward details. Earn more. Stress less.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards by name, issuer, or rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={issuerFilter} onValueChange={setIssuerFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Issuers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Issuers</SelectItem>
                    {issuers.map(issuer => (
                      <SelectItem key={issuer} value={issuer}>{issuer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Networks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    {networks.map(network => (
                      <SelectItem key={network} value={network.toLowerCase()}>
                        {network.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={feeFilter} onValueChange={setFeeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Fees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fees</SelectItem>
                    <SelectItem value="free">No Annual Fee</SelectItem>
                    <SelectItem value="under100">Under $100</SelectItem>
                    <SelectItem value="over100">$100+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Showing {filteredCards.length} of {cards.length} cards
                </span>
                <button
                  onClick={clearFilters}
                  className="ml-2 flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map(card => {
              const annualFee = card.annual_fee_cents / 100;
              return (
                <Link
                  key={card.id}
                  to={`/cards/${card.id}`}
                  className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <CardImage 
                      issuer={card.issuer_name}
                      cardName={card.name}
                      network={card.network as any}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{card.issuer_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {card.network.toUpperCase()}
                        </Badge>
                        <VerificationBadge 
                          status={card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                          className="scale-90" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={(e) => handleOpenDrawer(card, e)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Quick view"
                      >
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Annual Fee</span>
                      <span className="font-medium">
                        {annualFee === 0 ? 'Free' : `$${annualFee}/year`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {card.reward_summary}
                    </p>
                  </div>

                  {/* Source link */}
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={card.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View terms
                    </a>
                    <span className="text-xs text-muted-foreground">
                      · Verified {new Date(card.last_verified_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No cards match your search criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cards;
