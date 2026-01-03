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
  Info,
  Sparkles,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRecommendationFromDB, Recommendation } from '@/lib/recommendationEngineV2';
import { validateUrl, getDisplayDomain } from '@/lib/urlSafety';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useAllCardRewardRules } from '@/hooks/useCardRewardRules';
import { useAllMerchantExclusions } from '@/hooks/useMerchantExclusions';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CardVaultSheet } from '@/components/vault/CardVaultSheet';
import { SelectedCardChips } from '@/components/vault/SelectedCardChips';
import { VaultEmptyState } from '@/components/vault/VaultEmptyState';
import { OnboardingNudge } from '@/components/onboarding/OnboardingNudge';
import { AccuracySection } from '@/components/trust/AccuracySection';

const Analyze = () => {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { 
    selectedCards, 
    selectedCardIds, 
    hasCards, 
    isUsingDemo, 
    startWithDemo,
    loading: walletLoading,
    allCards,
    toggleCard,
    clearGuestWallet,
  } = useUnifiedWallet();
  const { rules: allRules, loading: rulesLoading } = useAllCardRewardRules();
  const { exclusions: allExclusions, loading: exclusionsLoading } = useAllMerchantExclusions();
  
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDecisionTrace, setShowDecisionTrace] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [vaultSheetOpen, setVaultSheetOpen] = useState(false);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    // Clear error when user starts typing
    if (urlError) {
      setUrlError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    
    // Validate URL before processing
    const validation = validateUrl(url);
    if (!validation.ok) {
      setUrlError(validation.error || 'Invalid URL');
      return;
    }
    
    // Clear any previous error
    setUrlError(null);
    
    // Use demo if no cards selected
    if (!hasCards) {
      startWithDemo();
    }
    
    setIsLoading(true);
    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 400));
    
    const cardsToUse = hasCards ? selectedCards : allCards.slice(0, 3);
    const result = getRecommendationFromDB(url, cardsToUse, allRules, allExclusions);
    setRecommendation(result);
    
    // Track analytics
    const latency = Date.now() - startTime;
    trackEvent('recommendation_requested', {
      domain: getDisplayDomain(url),
      selectedCardCount: cardsToUse.length,
      categorySlug: result?.categoryLabel || 'unknown',
    }, url);
    
    if (result) {
      trackEvent('recommendation_returned', {
        domain: getDisplayDomain(url),
        recommendedCardId: result.card.id,
        confidence: result.confidence,
        categorySlug: result.categoryLabel,
        multiplier: result.multiplier,
        latencyMs: latency,
      });
    }
    
    // Show save prompt after result if not logged in
    if (!user && result) {
      setTimeout(() => setShowSavePrompt(true), 1500);
    }
    
    setIsLoading(false);
  };

  const handleVaultSave = () => {
    toast.success('Vault saved');
  };

  const handleClearVault = () => {
    clearGuestWallet();
    toast.success('Vault cleared');
  };

  const handleLoadDemo = () => {
    startWithDemo();
    toast.success('Demo vault loaded');
  };

  const dataLoading = walletLoading || rulesLoading || exclusionsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Card Analyzer</h1>
            <p className="text-muted-foreground">
              Paste any shopping URL to find the best card to use.
            </p>
          </div>

          {/* Onboarding Nudge for first-time users */}
          <OnboardingNudge 
            hasCards={hasCards}
            onOpenVault={() => setVaultSheetOpen(true)}
            onComplete={() => {}}
          />

          {/* Card Vault Section */}
          <div className="mb-6 p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Your Wallet</span>
                {hasCards && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setVaultSheetOpen(true)}
                className="gap-2"
              >
                {hasCards ? 'Edit' : 'Add cards'}
              </Button>
            </div>
            
            {hasCards ? (
              <SelectedCardChips
                selectedCards={selectedCards}
                onRemoveCard={toggleCard}
                onShowMore={() => setVaultSheetOpen(true)}
              />
            ) : (
              <VaultEmptyState 
                onOpenVault={() => setVaultSheetOpen(true)}
                onLoadDemo={handleLoadDemo}
              />
            )}

            {/* Using demo wallet indicator */}
            {isUsingDemo && hasCards && (
              <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-xs">Demo wallet active. <button onClick={() => setVaultSheetOpen(true)} className="text-primary hover:underline">Customize</button></span>
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Paste any shopping URL (e.g., amazon.com, target.com)..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn("pl-10 h-12", urlError && "border-destructive")}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <Button 
                size="lg" 
                onClick={handleAnalyze}
                disabled={!url.trim() || isLoading || dataLoading}
                className="gap-2 h-12"
              >
                {isLoading ? 'Analyzing...' : 'Analyze'}
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {/* URL validation error */}
            {urlError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{urlError}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {[
                { label: 'Amazon', url: 'amazon.com' },
                { label: 'Uber Eats', url: 'ubereats.com' },
                { label: 'Target', url: 'target.com' },
                { label: 'Costco', url: 'costco.com' },
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

          {/* Result */}
          {recommendation && (
            <div className="mt-8 animate-fade-in space-y-6">
              <div className="p-6 rounded-xl border border-primary/50 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                  <CardImage 
                    issuer={recommendation.card.issuer_name}
                    cardName={recommendation.card.name}
                    network={recommendation.card.network}
                    imageUrl={recommendation.card.image_url}
                    size="lg"
                    className="shrink-0"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className="bg-primary/20 text-primary border-0">Recommended</Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.multiplier}x {recommendation.categoryLabel}
                        </Badge>
                        <VerificationBadge 
                          status={recommendation.card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                        />
                      </div>
                      <h2 className="text-2xl font-bold">{recommendation.card.name}</h2>
                      <p className="text-muted-foreground">{recommendation.card.issuer_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.card.annual_fee_cents === 0 
                          ? 'No annual fee' 
                          : `$${recommendation.card.annual_fee_cents / 100}/year`}
                      </p>
                    </div>

                    <ConfidenceMeter confidence={
                      recommendation.confidence === 'high' ? 90 : 
                      recommendation.confidence === 'medium' ? 70 : 50
                    } />
                  </div>
                </div>

                {/* Reason */}
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

                {/* Decision Trace */}
                <Collapsible open={showDecisionTrace} onOpenChange={setShowDecisionTrace} className="mt-4">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showDecisionTrace && "rotate-180")} />
                    View decision details
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Merchant</span>
                        <span>{recommendation.merchant?.name || getDisplayDomain(url)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span>{recommendation.categoryLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Effective Rate</span>
                        <span>{recommendation.multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence</span>
                        <Badge variant="outline" className="capitalize">{recommendation.confidence}</Badge>
                      </div>
                      {recommendation.alternatives.length > 0 && (
                        <div className="pt-2 border-t border-border mt-2">
                          <p className="text-muted-foreground mb-2">Alternatives:</p>
                          {recommendation.alternatives.slice(0, 3).map((alt, i) => (
                            <div key={i} className="flex justify-between text-xs py-1">
                              <span>{alt.card.name}</span>
                              <span className={alt.excluded ? 'text-amber-500' : ''}>
                                {alt.effectiveMultiplier}x {alt.excluded && '(excluded)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Save prompt for guests */}
              {showSavePrompt && !user && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                  <div>
                    <p className="font-medium">Want to save your results?</p>
                    <p className="text-sm text-muted-foreground">
                      Create a free account to save your wallet and recommendation history.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/auth">
                      <Button size="sm">Sign in to save</Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setShowSavePrompt(false)}
                    >
                      Not now
                    </Button>
                  </div>
                </div>
              )}
              {/* Accuracy Section */}
              <AccuracySection />
            </div>
          )}

          {/* Loading state */}
          {dataLoading && (
            <div className="mt-8 space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Card Vault Sheet */}
      <CardVaultSheet
        open={vaultSheetOpen}
        onOpenChange={setVaultSheetOpen}
        allCards={allCards}
        selectedCardIds={selectedCardIds}
        onToggleCard={toggleCard}
        onClearAll={handleClearVault}
        onSave={handleVaultSave}
      />
    </div>
  );
};

export default Analyze;
