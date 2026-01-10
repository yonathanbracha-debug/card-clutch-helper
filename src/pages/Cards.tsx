import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { CardImage } from '@/components/CardImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { CardInfoDrawer } from '@/components/CardInfoDrawer';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, X, ExternalLink } from 'lucide-react';
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
        <AmbientBackground />
        <Header />
        <main className="pt-14 pb-12 relative z-10">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="mb-8">
              <Skeleton className="h-8 w-48 mb-2 bg-secondary" />
              <Skeleton className="h-5 w-64 bg-secondary" />
            </div>
            <Skeleton className="h-11 w-full mb-8 bg-secondary" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full bg-secondary" />
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
      <AmbientBackground />
      <Header />

      <CardInfoDrawer 
        card={selectedCard}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      
      <main className="pt-14 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-10">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Card Catalog
            </p>
            <h1 className="text-3xl font-light text-foreground mb-3">
              {cards.length} credit cards
            </h1>
            <p className="text-muted-foreground">
              Verified reward details. Search and filter to find what you need.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, issuer, or rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={issuerFilter} onValueChange={setIssuerFilter}>
                  <SelectTrigger className="w-36 h-11">
                    <SelectValue placeholder="Issuer" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Issuers</SelectItem>
                    {issuers.map(issuer => (
                      <SelectItem key={issuer} value={issuer}>{issuer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger className="w-32 h-11">
                    <SelectValue placeholder="Network" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Networks</SelectItem>
                    {networks.map(network => (
                      <SelectItem key={network} value={network.toLowerCase()}>
                        {network.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={feeFilter} onValueChange={setFeeFilter}>
                  <SelectTrigger className="w-32 h-11">
                    <SelectValue placeholder="Fee" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Fees</SelectItem>
                    <SelectItem value="free">No Fee</SelectItem>
                    <SelectItem value="under100">Under $100</SelectItem>
                    <SelectItem value="over100">$100+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  {filteredCards.length} of {cards.length} cards
                </span>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredCards.map(card => {
              const annualFee = card.annual_fee_cents / 100;
              return (
                <Link
                  key={card.id}
                  to={`/cards/${card.id}`}
                  className="group block p-4 rounded border border-border bg-card hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <CardImage 
                      issuer={card.issuer_name}
                      cardName={card.name}
                      network={card.network as any}
                      imageUrl={card.image_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {card.name}
                        </h3>
                        <VerificationBadge 
                          status={card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{card.issuer_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-mono text-xs text-muted-foreground uppercase">
                          {card.network}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {annualFee === 0 ? 'No fee' : `$${annualFee}/yr`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={card.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="View terms"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No cards match your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-primary hover:underline"
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
