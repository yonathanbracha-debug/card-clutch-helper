import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
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
  CheckCircle,
  ChevronDown,
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
import { useDemoGate } from '@/hooks/useDemoGate';
import { DemoLimitModal } from '@/components/DemoLimitModal';
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
  const [showDemoLimitModal, setShowDemoLimitModal] = useState(false);

  const { 
    canAnalyze, 
    remaining, 
    hasHitLimit, 
    shouldShowBanner, 
    incrementSuccess,
    isLoggedIn 
  } = useDemoGate();

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (urlError) {
      setUrlError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    
    if (!canAnalyze) {
      trackEvent('demo_limit_reached', { remaining: 0 });
      setShowDemoLimitModal(true);
      return;
    }
    
    const validation = validateUrl(url);
    if (!validation.ok) {
      setUrlError(validation.error || 'Invalid URL');
      trackEvent('analyze_failed', { error: validation.error });
      return;
    }
    
    setUrlError(null);
    
    if (!isLoggedIn) {
      trackEvent('demo_analysis_started', { remaining });
    }
    trackEvent('analyze_started', { domain: getDisplayDomain(url) }, url);
    
    if (!hasCards) {
      startWithDemo();
    }
    
    setIsLoading(true);
    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 400));
    
    const cardsToUse = hasCards ? selectedCards : allCards.slice(0, 3);
    const result = getRecommendationFromDB(url, cardsToUse, allRules, allExclusions);
    setRecommendation(result);
    
    const latency = Date.now() - startTime;
    trackEvent('recommendation_requested', {
      domain: getDisplayDomain(url),
      selectedCardCount: cardsToUse.length,
      categorySlug: result?.categoryLabel || 'unknown',
    }, url);
    
    if (result) {
      incrementSuccess();
      
      if (!isLoggedIn) {
        trackEvent('demo_analysis_success', { remaining: remaining - 1 });
      }
      trackEvent('analyze_success', {
        domain: getDisplayDomain(url),
        recommendedCardId: result.card.id,
        confidence: result.confidence,
        categorySlug: result.categoryLabel,
        multiplier: result.multiplier,
        latencyMs: latency,
      });
      
      trackEvent('recommendation_returned', {
        domain: getDisplayDomain(url),
        recommendedCardId: result.card.id,
        confidence: result.confidence,
        categorySlug: result.categoryLabel,
        multiplier: result.multiplier,
        latencyMs: latency,
      });
    }
    
    if (!user && result) {
      setTimeout(() => {
        setShowSavePrompt(true);
        trackEvent('signup_prompt_shown', {});
      }, 1500);
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
    <div className="min-h-screen bg-background dark">
      <AmbientBackground />
      <Header />
      
      <main className="pt-20 pb-16 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <span className="font-mono-accent text-xs uppercase tracking-widest text-primary mb-4 block">
              Analyzer
            </span>
            <h1 className="text-3xl md:text-4xl font-light text-foreground mb-3">
              Find your best card
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Paste any shopping URL to see which card earns the most rewards.
            </p>
          </div>

          {/* Demo Banner */}
          {shouldShowBanner && (
            <div className="mb-6 p-4 rounded-lg border border-border bg-card/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{remaining}</strong> free {remaining === 1 ? 'analysis' : 'analyses'} left.{' '}
                  <Link to="/auth" className="text-primary hover:underline" onClick={() => trackEvent('signup_clicked', {})}>
                    Sign in to save
                  </Link>
                </span>
              </div>
            </div>
          )}

          {/* Onboarding Nudge */}
          <OnboardingNudge 
            hasCards={hasCards}
            onOpenVault={() => setVaultSheetOpen(true)}
            onComplete={() => {}}
          />

          {/* Card Vault Section */}
          <div className="mb-6 p-5 rounded-lg border border-border bg-card/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Your Wallet</span>
                {hasCards && (
                  <span className="text-xs text-muted-foreground font-mono-accent">
                    {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setVaultSheetOpen(true)}
                className="rounded-full px-4"
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

            {isUsingDemo && hasCards && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Demo wallet active. <button onClick={() => setVaultSheetOpen(true)} className="text-primary hover:underline">Customize</button>
                </span>
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="p-6 rounded-lg border border-border bg-card/30 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Paste any shopping URL (e.g., amazon.com, target.com)..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(
                    "pl-11 h-12 bg-background/50 border-border rounded-lg",
                    urlError && "border-destructive"
                  )}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <Button 
                size="lg" 
                onClick={handleAnalyze}
                disabled={!url.trim() || isLoading || dataLoading}
                className="gap-2 h-12 rounded-full px-6 bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? 'Analyzing...' : 'Analyze'}
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {urlError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{urlError}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-muted-foreground font-mono-accent">Try:</span>
              {[
                { label: 'Amazon', url: 'amazon.com' },
                { label: 'Uber Eats', url: 'ubereats.com' },
                { label: 'Target', url: 'target.com' },
                { label: 'Costco', url: 'costco.com' },
              ].map(example => (
                <button
                  key={example.label}
                  onClick={() => setUrl(example.url)}
                  className="text-xs px-3 py-1 rounded-full border border-border bg-card/50 hover:bg-card hover:border-border/80 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          {recommendation && (
            <div className="mt-8 animate-fade-in space-y-6">
              <div className="p-6 rounded-lg border border-primary/30 bg-card/30">
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono-accent uppercase tracking-widest text-primary">
                          Recommended
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {recommendation.multiplier}x {recommendation.categoryLabel}
                        </span>
                        <VerificationBadge 
                          status={recommendation.card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                        />
                      </div>
                      <h2 className="text-2xl font-medium text-foreground">{recommendation.card.name}</h2>
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
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Why this card?</p>
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
                    <div className="p-4 rounded-lg bg-card/50 border border-border space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Merchant</span>
                        <span className="text-foreground">{recommendation.merchant?.name || getDisplayDomain(url)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span className="text-foreground">{recommendation.categoryLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Effective Rate</span>
                        <span className="text-foreground">{recommendation.multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="text-foreground capitalize">{recommendation.confidence}</span>
                      </div>
                      {recommendation.alternatives.length > 0 && (
                        <div className="pt-3 border-t border-border mt-3">
                          <p className="text-muted-foreground mb-2">Alternatives:</p>
                          {recommendation.alternatives.slice(0, 3).map((alt, i) => (
                            <div key={i} className="flex justify-between text-xs py-1">
                              <span className="text-muted-foreground">{alt.card.name}</span>
                              <span className={alt.excluded ? 'text-amber-500' : 'text-foreground'}>
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
                <div className="p-5 rounded-lg border border-border bg-card/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                  <div>
                    <p className="font-medium text-foreground">Want to save your results?</p>
                    <p className="text-sm text-muted-foreground">
                      Create a free account to save your wallet and history.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/auth">
                      <Button size="sm" className="rounded-full">Sign in to save</Button>
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
            </div>
          )}

          {/* Accuracy Section */}
          {!recommendation && (
            <div className="mt-16">
              <AccuracySection />
            </div>
          )}
        </div>
      </main>

      <CardVaultSheet
        open={vaultSheetOpen}
        onOpenChange={setVaultSheetOpen}
        selectedCardIds={selectedCardIds}
        onToggleCard={toggleCard}
        onSave={handleVaultSave}
        allCards={allCards}
        onClearAll={handleClearVault}
      />

      <DemoLimitModal 
        open={showDemoLimitModal}
        onOpenChange={setShowDemoLimitModal}
      />

      <Footer />
    </div>
  );
};

export default Analyze;
