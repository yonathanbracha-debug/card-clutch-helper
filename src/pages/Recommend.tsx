import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Clock,
  Info,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { creditCards } from '@/lib/cardData';
import { getRecommendation, Recommendation } from '@/lib/recommendationEngine';
import { usePersistedCards } from '@/hooks/usePersistedCards';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from 'react-router-dom';

const Recommend = () => {
  const { selectedCards } = usePersistedCards();
  const [url, setUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{
    url: string;
    cardName: string;
    category: string;
    timestamp: Date;
  }>>(() => {
    const stored = localStorage.getItem('cardclutch-recent-searches');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }));
    }
    return [];
  });

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 300));
    
    const result = getRecommendation(url, selectedCards);
    setRecommendation(result);
    
    // Save to recent searches
    if (result) {
      const search = {
        url,
        cardName: result.card.name,
        category: result.categoryLabel,
        timestamp: new Date(),
      };
      const updated = [search, ...recentSearches.slice(0, 9)];
      setRecentSearches(updated);
      localStorage.setItem('cardclutch-recent-searches', JSON.stringify(updated));
    }
    
    setIsLoading(false);
  };

  const selectedCardDetails = selectedCards.map(id => creditCards.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Get a Recommendation</h1>
            <p className="text-muted-foreground">
              Paste any shopping URL to find the best card to use.
            </p>
          </div>

          {/* No cards warning */}
          {selectedCards.length === 0 && (
            <div className="mb-8 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-500">No cards in your wallet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need to add cards to your wallet first to get personalized recommendations.
                </p>
                <Link to="/vault">
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    Add Cards to Wallet
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Paste any shopping URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-12"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <Button 
                size="lg" 
                onClick={handleAnalyze}
                disabled={!url.trim() || selectedCards.length === 0 || isLoading}
                className="gap-2 h-12"
              >
                {isLoading ? 'Analyzing...' : 'Analyze'}
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Advanced options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                Advanced options
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Page title (optional)</label>
                  <Input
                    placeholder="e.g., Amazon.com Shopping Cart"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Providing the page title can help improve category detection.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {[
                { label: 'Amazon', url: 'https://www.amazon.com/cart' },
                { label: 'Uber Eats', url: 'https://www.ubereats.com' },
                { label: 'Target', url: 'https://www.target.com' },
              ].map(example => (
                <button
                  key={example.label}
                  onClick={() => setUrl(example.url)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation Result */}
          {recommendation && (
            <div className="mt-8 animate-fade-in space-y-6">
              {/* Main Result Card */}
              <div className="p-6 rounded-xl border border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex flex-col md:flex-row gap-6">
                  <CardImage 
                    issuer={recommendation.card.issuer}
                    cardName={recommendation.card.name}
                    network={recommendation.card.network}
                    size="lg"
                    className="shrink-0"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary/20 text-primary border-0">Recommended</Badge>
                        <VerificationBadge status="unverified" />
                      </div>
                      <h2 className="text-2xl font-bold">{recommendation.card.name}</h2>
                      <p className="text-muted-foreground">{recommendation.card.issuer}</p>
                    </div>

                    <ConfidenceMeter confidence={recommendation.confidence} />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Detected Merchant</p>
                        <p className="font-medium">{recommendation.merchant?.name || extractDomain(url)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="font-medium">{recommendation.categoryLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Why this card?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.reason}
                      </p>
                      {recommendation.hasCapWarning && (
                        <p className="text-sm text-amber-500 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Note: This card has a spending cap on this category.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exclusion warning */}
                {recommendation.exclusionTriggered && (
                  <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="font-medium text-amber-500">Exclusion Warning</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {recommendation.exclusionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Why not other cards */}
              {recommendation.comparisonCards && recommendation.comparisonCards.length > 0 && (
                <Accordion type="single" collapsible className="border border-border rounded-xl overflow-hidden">
                  <AccordionItem value="comparison" className="border-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Why not other cards?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-3">
                        {recommendation.comparisonCards.map(comp => (
                          <div key={comp.cardId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <CardImage 
                                issuer={comp.issuer}
                                cardName={comp.cardName}
                                network={comp.network}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium text-sm">{comp.cardName}</p>
                                <p className="text-xs text-muted-foreground">{comp.multiplier}x {recommendation.categoryLabel}</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-xs text-right">
                              {comp.whyNot}
                            </p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Sources */}
              <div className="p-4 rounded-xl border border-border bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sources</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Card data sourced from official issuer terms. Last updated: December 2024. 
                  <span className="text-amber-500 ml-1">Data may not be verified.</span>
                </p>
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && !recommendation && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Recent Searches
                </h3>
                <button 
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('cardclutch-recent-searches');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-2">
                {recentSearches.slice(0, 5).map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setUrl(search.url)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-muted-foreground/50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{extractDomain(search.url)}</p>
                      <p className="text-xs text-muted-foreground">{search.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{search.cardName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(search.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Recommend;