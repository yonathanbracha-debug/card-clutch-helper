import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
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
      <AmbientBackground />
      <Header />
      
      <main className="pt-14 pb-16 relative z-10">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Analyzer
            </p>
            <h1 className="text-3xl font-light text-foreground mb-3">
              Find your best card
            </h1>
            <p className="text-muted-foreground">
              Enter a merchant URL. We'll tell you which card to use.
            </p>
          </div>

          {/* Demo Banner */}
          {shouldShowBanner && (
            <div className="mb-8 p-4 rounded border border-border bg-card">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
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
          <div className="mb-8 p-5 rounded border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Your cards</span>
                {hasCards && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedCardIds.length} selected
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
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
              <div className="mt-4 p-3 rounded bg-secondary border border-border flex items-center gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Using demo cards. <button onClick={() => setVaultSheetOpen(true)} className="text-primary hover:underline">Customize</button>
                </span>
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="p-5 rounded border border-border bg-card space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter merchant URL (e.g., amazon.com)"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={cn(
                  "flex-1 h-11",
                  urlError && "border-destructive"
                )}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button 
                onClick={handleAnalyze}
                disabled={!url.trim() || isLoading || dataLoading}
                className="h-11 gap-2"
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

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="font-mono text-xs text-muted-foreground">Try:</span>
              {[
                { label: 'Amazon', url: 'amazon.com' },
                { label: 'Uber Eats', url: 'ubereats.com' },
                { label: 'Target', url: 'target.com' },
              ].map(example => (
                <button
                  key={example.label}
                  onClick={() => setUrl(example.url)}
                  className="text-xs px-2.5 py-1 rounded border border-border bg-secondary hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          {recommendation && (
            <div className="mt-8 animate-fade-in space-y-6">
              <div className="p-6 rounded border border-primary/30 bg-card">
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
                        <span className="font-mono text-xs uppercase tracking-wider text-primary">
                          Recommended
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {recommendation.multiplier}x {recommendation.categoryLabel}
                        </span>
                        <VerificationBadge 
                          status={recommendation.card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                        />
                      </div>
                      <h2 className="text-xl font-medium text-foreground">{recommendation.card.name}</h2>
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
                    <div className="p-4 rounded bg-secondary border border-border space-y-2 text-sm">
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
                <div className="p-5 rounded border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                  <div>
                    <p className="font-medium text-foreground text-sm">Save your results?</p>
                    <p className="text-sm text-muted-foreground">
                      Create an account to save your wallet and history.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/auth">
                      <Button size="sm">Create account</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setShowSavePrompt(false)}>
                      Later
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
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
