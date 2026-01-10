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
  ArrowRight,
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
import { motion } from 'framer-motion';

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
    }
    
    if (!user && result) {
      setTimeout(() => {
        setShowSavePrompt(true);
        trackEvent('signup_prompt_shown', {});
      }, 2000);
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
      
      <main className="pt-20 pb-24">
        <div className="container-main py-12">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <span className="mono-label text-muted-foreground mb-3 block">Analyzer</span>
            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
              Find your best card
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Enter a merchant URL. We'll tell you which card maximizes your rewards.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left Panel - Input */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Demo Banner */}
              {shouldShowBanner && (
                <div className="card-base p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{remaining}</span> free {remaining === 1 ? 'analysis' : 'analyses'} remaining
                      </p>
                      <Link to="/auth" className="text-sm text-primary hover:underline" onClick={() => trackEvent('signup_clicked', {})}>
                        Sign in to save your results
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Wallet Section */}
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Your cards</p>
                      {hasCards && (
                        <p className="text-xs text-muted-foreground">{selectedCardIds.length} selected</p>
                      )}
                    </div>
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
                  <div className="mt-5 p-4 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Using demo cards. <button onClick={() => setVaultSheetOpen(true)} className="text-primary hover:underline">Customize</button>
                    </span>
                  </div>
                )}
              </div>

              {/* URL Input */}
              <div className="card-base p-6 space-y-5">
                <label className="text-sm font-medium text-foreground">Merchant URL</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="amazon.com, target.com, etc."
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={cn(
                      "flex-1 h-12 rounded-xl bg-secondary/50 border-border",
                      urlError && "border-destructive focus-visible:ring-destructive/50"
                    )}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  />
                  <Button 
                    onClick={handleAnalyze}
                    disabled={!url.trim() || isLoading || dataLoading}
                    variant="primary"
                    size="lg"
                    className="gap-2"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                
                {urlError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{urlError}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Try:</span>
                  {[
                    { label: 'Amazon', url: 'amazon.com' },
                    { label: 'Uber Eats', url: 'ubereats.com' },
                    { label: 'Target', url: 'target.com' },
                  ].map(example => (
                    <button
                      key={example.label}
                      onClick={() => setUrl(example.url)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-300"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Panel - Result */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isLoading ? (
                <div className="card-base p-8 space-y-6">
                  <Skeleton className="h-5 w-24 rounded-lg bg-secondary" />
                  <div className="flex gap-5">
                    <Skeleton className="w-24 h-16 rounded-xl bg-secondary" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-48 rounded-lg bg-secondary" />
                      <Skeleton className="h-4 w-32 rounded-lg bg-secondary" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full rounded-xl bg-secondary" />
                </div>
              ) : recommendation ? (
                <div className="animate-fade-in space-y-6">
                  <div className="card-elevated p-8 border-primary/20">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-5">
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
                            <span className="pill-primary">
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
                    <div className="mt-8 pt-6 border-t border-border">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Why this card?</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {recommendation.reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Decision Trace */}
                    <Collapsible open={showDecisionTrace} onOpenChange={setShowDecisionTrace} className="mt-6">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", showDecisionTrace && "rotate-180")} />
                        View decision details
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-5">
                        <div className="p-5 rounded-xl bg-secondary/50 border border-border space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Merchant</span>
                            <span className="text-foreground font-mono text-xs">{recommendation.merchant?.name || getDisplayDomain(url)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category</span>
                            <span className="text-foreground font-mono text-xs">{recommendation.categoryLabel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rate</span>
                            <span className="text-foreground font-mono text-xs">{recommendation.multiplier}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="text-foreground font-mono text-xs capitalize">{recommendation.confidence}</span>
                          </div>
                          {recommendation.alternatives.length > 0 && (
                            <div className="pt-4 border-t border-border mt-3">
                              <p className="text-muted-foreground mb-3">Alternatives:</p>
                              {recommendation.alternatives.slice(0, 3).map((alt, i) => (
                                <div key={i} className="flex justify-between text-xs py-1.5">
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
                    <div className="card-base p-6 flex flex-col sm:flex-row items-center justify-between gap-5 animate-fade-in">
                      <div>
                        <p className="font-medium text-foreground">Save your results?</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create an account to save your wallet and history.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link to="/auth">
                          <Button size="sm" variant="primary">Create account</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setShowSavePrompt(false)}>
                          Later
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-base p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Enter a merchant URL</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We'll analyze the merchant and recommend the best card from your wallet.
                  </p>
                </div>
              )}
            </motion.div>
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