import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Clock,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRecommendationFromDB, Recommendation } from '@/lib/recommendationEngineV2';
import { useWalletCards } from '@/hooks/useWalletCards';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAllCardRewardRules } from '@/hooks/useCardRewardRules';
import { useAllMerchantExclusions } from '@/hooks/useMerchantExclusions';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from 'react-router-dom';

const Recommend = () => {
  const { selectedCardIds, loading: walletLoading } = useWalletCards();
  const { cards: dbCards, loading: cardsLoading } = useCreditCards();
  const { rules: allRules, loading: rulesLoading } = useAllCardRewardRules();
  const { exclusions: allExclusions, loading: exclusionsLoading } = useAllMerchantExclusions();
  
  const selectedCards = dbCards.filter(c => selectedCardIds.includes(c.id));
  
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
    await new Promise(r => setTimeout(r, 300));
    
    const result = getRecommendationFromDB(url, selectedCards, allRules, allExclusions);
    setRecommendation(result);
    
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

  const dataLoading = cardsLoading || walletLoading || rulesLoading || exclusionsLoading;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container max-w-4xl mx-auto px-4">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto mb-8" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Get a Recommendation</h1>
            <p className="text-muted-foreground">
              Right card. Right moment. Paste any URL to find your best option.
            </p>
          </div>

          {selectedCards.length === 0 && (
            <div className="mb-8 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-500">No cards in your wallet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add cards to get personalized recommendations.
                </p>
                <Link to="/vault">
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    Add Cards <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

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

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {[
                { label: 'Amazon', url: 'https://www.amazon.com' },
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

          {recommendation && (
            <div className="mt-8 animate-fade-in space-y-6">
              <div className="p-6 rounded-xl border border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex flex-col md:flex-row gap-6">
                  <CardImage 
                    issuer={recommendation.card.issuer_name}
                    cardName={recommendation.card.name}
                    network={recommendation.card.network}
                    size="lg"
                    className="shrink-0"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary/20 text-primary border-0">Recommended</Badge>
                        <VerificationBadge 
                          status={recommendation.card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                        />
                      </div>
                      <h2 className="text-2xl font-bold">{recommendation.card.name}</h2>
                      <p className="text-muted-foreground">{recommendation.card.issuer_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${recommendation.card.annual_fee_cents / 100}/year
                      </p>
                    </div>

                    <ConfidenceMeter confidence={
                      recommendation.confidence === 'high' ? 90 : 
                      recommendation.confidence === 'medium' ? 70 : 50
                    } />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Merchant</p>
                        <p className="font-medium">{recommendation.merchant?.name || extractDomain(url)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="font-medium">{recommendation.categoryLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Why this card?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
