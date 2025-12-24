import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronRight, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { creditCards } from '@/lib/cardData';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Cards = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [issuerFilter, setIssuerFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [feeFilter, setFeeFilter] = useState<string>('all');

  const issuers = useMemo(() => [...new Set(creditCards.map(c => c.issuer))].sort(), []);
  const networks = useMemo(() => [...new Set(creditCards.map(c => c.network))].sort(), []);

  const filteredCards = useMemo(() => {
    return creditCards.filter(card => {
      const matchesSearch = 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.rewardSummary.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesIssuer = issuerFilter === 'all' || card.issuer === issuerFilter;
      const matchesNetwork = networkFilter === 'all' || card.network.toLowerCase() === networkFilter;
      
      let matchesFee = true;
      if (feeFilter === 'free') matchesFee = card.annualFee === 0;
      else if (feeFilter === 'under100') matchesFee = card.annualFee < 100;
      else if (feeFilter === 'over100') matchesFee = card.annualFee >= 100;
      
      return matchesSearch && matchesIssuer && matchesNetwork && matchesFee;
    });
  }, [searchQuery, issuerFilter, networkFilter, feeFilter]);

  const hasActiveFilters = issuerFilter !== 'all' || networkFilter !== 'all' || feeFilter !== 'all';

  const clearFilters = () => {
    setIssuerFilter('all');
    setNetworkFilter('all');
    setFeeFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Card Library</h1>
            <p className="text-muted-foreground">
              Browse {creditCards.length} credit cards with verified reward details.
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
                  Showing {filteredCards.length} of {creditCards.length} cards
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
            {filteredCards.map(card => (
              <Link
                key={card.id}
                to={`/cards/${card.id}`}
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <CardImage 
                    issuer={card.issuer}
                    cardName={card.name}
                    network={card.network}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {card.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{card.issuer}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {card.network.toUpperCase()}
                      </Badge>
                      <VerificationBadge status="unverified" className="scale-90" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Annual Fee</span>
                    <span className="font-medium">
                      {card.annualFee === 0 ? 'Free' : `$${card.annualFee}`}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {card.rewardSummary}
                  </p>
                </div>

                {/* Top categories */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {card.rewards.slice(0, 3).map((reward, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {reward.multiplier}x {reward.category}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
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