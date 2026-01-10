import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  CheckCircle,
  ChevronDown,
  AlertCircle,
  CreditCard,
  Info,
  Sparkles,
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
    await new Promise(r => setTimeout(r, 300));
    
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
    }
    
    if (!user && result) {
      setTimeout(() => {
        setShowSavePrompt(true);
        trackEvent('signup_prompt_shown', {});
      }, 1500);
    }
    
    setIsLoading(false);
  };

  const handleLoadDemo = () => {
    startWithDemo();
    toast.success('Demo cards loaded');
  };

  const dataLoading = walletLoading || rulesLoading || exclusionsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container-main py-12">
          {/* Page Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium mb-4">
              <Search className="w-3 h-3" />
              Analyzer
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              Find your best card
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Enter a merchant URL. We'll tell you which card maximizes your rewards.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Input */}
            <div className="space-y-6">
              {/* Demo Banner */}
              {shouldShowBanner && (
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">{remaining}</span> free {remaining === 1 ? 'analysis' : 'analyses'} remaining.{' '}
                      <Link to="/auth" className="text-primary hover:underline" onClick={() => trackEvent('signup_clicked', {})}>
                        Sign in to save
                      </Link>
                    </span>
                  </div>
                </div>
              )}

              {/* Card Wallet Section */}
              <div className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">Your cards</span>
                      {hasCards && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {selectedCardIds.length} selected
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setVaultSheetOpen(true)}
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
                  <div className="mt-4 p-3 rounded-xl bg-secondary border border-border flex items-center gap-3">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Using demo cards. <button onClick={() => setVaultSheetOpen(true)} className="text-primary hover:underline">Customize</button>
                    </span>
                  </div>
                )}
              </div>

              {/* URL Input */}
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <label className="text-sm font-medium text-foreground">Merchant URL</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Enter merchant URL (e.g., amazon.com)"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={cn(
                      "flex-1 h-12 rounded-xl",
                      urlError && "border-destructive"
                    )}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  />
                  <Button 
                    onClick={handleAnalyze}
                    disabled={!url.trim() || isLoading || dataLoading}
                    variant="primary"
                    className="h-12 gap-2 rounded-xl"
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
                  <span className="text-xs text-muted-foreground">Try:</span>
                  {[
                    { label: 'Amazon', url: 'amazon.com' },
                    { label: 'Uber Eats', url: 'ubereats.com' },
                    { label: 'Target', url: 'target.com' },
                  ].map(example => (
                    <button
                      key={example.label}
                      onClick={() => setUrl(example.url)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Result */}
            <div>
              {isLoading ? (
                <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                  <Skeleton className="h-6 w-24 rounded-xl bg-secondary" />
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-14 rounded-xl bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48 rounded-xl bg-secondary" />
                      <Skeleton className="h-4 w-32 rounded-xl bg-secondary" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full rounded-xl bg-secondary" />
                </div>
              ) : recommendation ? (
                <div className="animate-fade-in space-y-6">
                  <div className="p-6 rounded-2xl border border-primary/30 bg-card">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-4">
                        <CardImage 
                          issuer={recommendation.card.issuer_name}
                          cardName={recommendation.card.name}
                          network={recommendation.card.network}
                          imageUrl={recommendation.card.image_url}
                          size="lg"
                          className="shrink-0"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Recommended
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {recommendation.multiplier}x {recommendation.categoryLabel}
                            </span>
                            <VerificationBadge 
                              status={recommendation.card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                            />
                          </div>
                          <h2 className="text-xl font-semibold text-foreground">{recommendation.card.name}</h2>
                          <p className="text-muted-foreground">{recommendation.card.issuer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {recommendation.card.annual_fee_cents === 0 
                              ? 'No annual fee' 
                              : `$${recommendation.card.annual_fee_cents / 100}/year`}
                          </p>
                        </div>
                      </div>

                      <ConfidenceMeter confidence={
                        recommendation.confidence === 'high' ? 90 : 
                        recommendation.confidence === 'medium' ? 70 : 50
                      } />
                    </div>

                    {/* Reason */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Why this card?</p>
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
                        View details
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="p-4 rounded-xl bg-secondary border border-border space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Merchant</span>
                            <span className="text-foreground font-mono">{recommendation.merchant?.name || getDisplayDomain(url)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category</span>
                            <span className="text-foreground font-mono">{recommendation.categoryLabel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rate</span>
                            <span className="text-foreground font-mono">{recommendation.multiplier}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="text-foreground font-mono capitalize">{recommendation.confidence}</span>
                          </div>
                          {recommendation.alternatives.length > 0 && (
                            <div className="pt-3 border-t border-border mt-3">
                              <p className="text-muted-foreground mb-2">Alternatives:</p>
                              {recommendation.alternatives.slice(0, 3).map((alt, i) => (
                                <div key={i} className="flex justify-between text-xs py-1">
                                  <span className="text-muted-foreground">{alt.card.name}</span>
                                  <span className="font-mono">
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

                  {/* Save prompt */}
                  {showSavePrompt && !user && (
                    <div className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                      <div>
                        <p className="font-medium text-foreground text-sm">Save your results?</p>
                        <p className="text-sm text-muted-foreground">
                          Create an account to save your wallet and history.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/auth">
                          <Button size="sm" variant="primary" className="rounded-xl">Create account</Button>
                        </Link>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowSavePrompt(false)}>
                          Later
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-foreground font-medium mb-2">Enter a merchant URL</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll analyze the merchant and recommend the best card from your wallet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <CardVaultSheet 
        open={vaultSheetOpen} 
        onOpenChange={setVaultSheetOpen}
        allCards={allCards}
        selectedCardIds={selectedCardIds}
        onToggleCard={toggleCard}
        onClearAll={clearGuestWallet}
        onSave={() => toast.success('Wallet saved')}
      />

      <DemoLimitModal
        open={showDemoLimitModal}
        onOpenChange={setShowDemoLimitModal}
        showBonusOption={false}
      />
    </div>
  );
};

export default Analyze;