/**
 * Cards Page - Card Catalog
 * Clean, professional card directory with decision clarity
 */
import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { CardInfoDrawer } from '@/components/CardInfoDrawer';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Search, ChevronRight, X, ExternalLink, CreditCard } from 'lucide-react';
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
          <div className="container-main py-12">
            <div className="mb-10">
              <Skeleton className="h-8 w-48 mb-3 rounded-xl bg-secondary" />
              <Skeleton className="h-5 w-64 rounded-xl bg-secondary" />
            </div>
            <Skeleton className="h-14 w-full mb-8 rounded-xl bg-secondary" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl bg-secondary" />
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
        <div className="container-main py-12">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="mb-10"
          >
            <span className="pill-secondary mb-4">
              <CreditCard className="w-3.5 h-3.5" />
              Card Catalog
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              {cards.length} verified cards
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Every reward detail verified against official sources. 
              Search and filter to find what you need.
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, issuer, or rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={issuerFilter} onValueChange={setIssuerFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Issuer" />
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
                    <SelectValue placeholder="Network" />
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
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Fee" />
                  </SelectTrigger>
                  <SelectContent>
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
                <span className="text-sm text-muted-foreground font-mono">
                  {filteredCards.length} of {cards.length} cards
                </span>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              </div>
            )}
          </motion.div>

          {/* Cards Grid */}
          <div className="grid gap-4">
            {filteredCards.map((card, index) => {
              const annualFee = card.annual_fee_cents / 100;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
                >
                  <Link
                    to={`/cards/${card.id}`}
                    className="group block p-6 rounded-2xl border border-border bg-card hover:bg-secondary/30 hover:border-border/80 transition-all duration-300 shadow-soft-sm hover:shadow-soft-md"
                  >
                    <div className="flex items-center gap-5">
                      <CardImage 
                        issuer={card.issuer_name}
                        cardName={card.name}
                        network={card.network as any}
                        imageUrl={card.image_url}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h3 className="font-semibold text-foreground truncate">
                            {card.name}
                          </h3>
                          <VerificationBadge 
                            status={card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{card.issuer_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground uppercase px-2.5 py-1 rounded-lg bg-secondary font-medium">
                            {card.network}
                          </span>
                          <span className="text-sm text-muted-foreground font-mono">
                            {annualFee === 0 ? 'No fee' : `$${annualFee}/yr`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={card.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-xl hover:bg-secondary"
                          title="View terms"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No cards match your criteria.</p>
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cards;
