import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/CardImage';
import { cn } from '@/lib/utils';
import { 
  Target, 
  Shield, 
  Search, 
  Plus, 
  Check, 
  ArrowRight, 
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Calendar
} from 'lucide-react';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { useWalletCards } from '@/hooks/useWalletCards';
import { 
  useCreditProfile, 
  ExperienceLevel, 
  CreditIntent, 
  BnplUsage, 
  AgeBucket,
  CreditHistory,
  IncomeBucket,
  deriveCreditState
} from '@/hooks/useCreditProfile';

interface CreditOnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface ProfileFormData {
  experience_level: ExperienceLevel;
  intent: CreditIntent;
  carry_balance: boolean;
  bnpl_usage: BnplUsage | null;
  age_bucket: AgeBucket | null;
  income_bucket: IncomeBucket | null;
  credit_history: CreditHistory | null;
}

const AGE_OPTIONS: { value: AgeBucket; label: string }[] = [
  { value: '<18', label: 'Under 18' },
  { value: '18-20', label: '18-20' },
  { value: '21-24', label: '21-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' },
];

const CREDIT_HISTORY_OPTIONS: { value: CreditHistory; label: string; description: string }[] = [
  { value: 'none', label: 'No Credit History', description: 'Never had a credit card or loan in my name' },
  { value: 'thin', label: 'Thin File', description: 'Less than 2 years of credit history or few accounts' },
  { value: 'established', label: 'Established', description: '2+ years with multiple accounts in good standing' },
];

const INCOME_OPTIONS: { value: IncomeBucket; label: string }[] = [
  { value: '<25k', label: 'Under $25k' },
  { value: '25-50k', label: '$25k - $50k' },
  { value: '50-100k', label: '$50k - $100k' },
  { value: '100-200k', label: '$100k - $200k' },
  { value: '200k+', label: '$200k+' },
];

export function CreditOnboardingModal({ open, onComplete }: CreditOnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<ProfileFormData>({
    experience_level: 'beginner',
    intent: 'both',
    carry_balance: false,
    bnpl_usage: null,
    age_bucket: null,
    income_bucket: null,
    credit_history: null,
  });
  
  const { cards, loading: cardsLoading } = useCreditCards();
  const { selectedCardIds, addCard, removeCard } = useWalletCards();
  const { completeOnboarding } = useCreditProfile();

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards.slice(0, 10);
    return cards.filter(card => 
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.issuer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cards, searchQuery]);

  const groupedCards = useMemo(() => {
    const groups: Record<string, CreditCardDB[]> = {};
    filteredCards.forEach(card => {
      const issuer = card.issuer_name;
      if (!groups[issuer]) groups[issuer] = [];
      groups[issuer].push(card);
    });
    return groups;
  }, [filteredCards]);

  // Preview credit state based on current form data
  const previewState = useMemo(() => deriveCreditState(formData), [formData]);

  const handleIntentSelect = (intent: CreditIntent) => {
    setFormData(prev => ({ ...prev, intent }));
    setStep(2);
  };

  const handleExperienceSelect = (experience_level: ExperienceLevel) => {
    setFormData(prev => ({ ...prev, experience_level }));
    setStep(3);
  };

  const handleRiskSelect = (carry_balance: boolean, bnpl_usage: BnplUsage) => {
    setFormData(prev => ({ ...prev, carry_balance, bnpl_usage }));
    setStep(4);
  };

  const handleCardToggle = async (cardId: string) => {
    const isSelected = selectedCardIds.includes(cardId);
    if (isSelected) {
      await removeCard(cardId);
    } else {
      await addCard(cardId);
    }
  };

  const handleFinish = async () => {
    const success = await completeOnboarding({
      ...formData,
      confidence_level: 'medium',
    });
    
    if (success) {
      onComplete();
    }
  };

  const canProceedToStep5 = formData.credit_history !== null;
  const canProceedToStep6 = selectedCardIds.length >= 2;

  // Risk warning based on profile
  const showBalanceWarning = formData.carry_balance;
  const showBnplWarning = formData.bnpl_usage === 'often';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Progress Bar */}
        <div className="flex items-center gap-2 px-6 pt-6">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Choose Intent */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">What's your primary goal?</h2>
                <p className="text-muted-foreground">This determines how we tailor recommendations</p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => handleIntentSelect('score')}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    formData.intent === 'score' 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Build & Protect Credit</h3>
                      <p className="text-sm text-muted-foreground">
                        Focus on improving credit score, maintaining low utilization, and avoiding risky behaviors.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleIntentSelect('rewards')}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    formData.intent === 'rewards' 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Maximize Rewards</h3>
                      <p className="text-sm text-muted-foreground">
                        Optimize points, miles, and cash back. Only valid if you pay in full every month.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleIntentSelect('both')}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                    formData.intent === 'both' 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Balanced Approach</h3>
                      <p className="text-sm text-muted-foreground">
                        Earn rewards while protecting credit health. We'll warn you when rewards conflict with score.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Experience Level */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">How familiar are you with credit?</h2>
                <p className="text-muted-foreground">This affects how we explain concepts</p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => handleExperienceSelect('beginner')}
                  className="p-5 rounded-xl border-2 text-left transition-all hover:border-primary/50 border-border"
                >
                  <h3 className="font-semibold mb-1">Beginner</h3>
                  <p className="text-sm text-muted-foreground">
                    New to credit cards or still learning how they work
                  </p>
                </button>

                <button
                  onClick={() => handleExperienceSelect('intermediate')}
                  className="p-5 rounded-xl border-2 text-left transition-all hover:border-primary/50 border-border"
                >
                  <h3 className="font-semibold mb-1">Intermediate</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand basics like utilization, APR, and payment timing
                  </p>
                </button>

                <button
                  onClick={() => handleExperienceSelect('advanced')}
                  className="p-5 rounded-xl border-2 text-left transition-all hover:border-primary/50 border-border"
                >
                  <h3 className="font-semibold mb-1">Advanced</h3>
                  <p className="text-sm text-muted-foreground">
                    Familiar with bonus categories, transfer partners, and churning
                  </p>
                </button>
              </div>

              <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                Back
              </Button>
            </div>
          )}

          {/* Step 3: Risk Assessment */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Credit Health Check</h2>
                <p className="text-muted-foreground">Be honest — this protects you from bad advice</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Do you carry a balance month-to-month?</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, carry_balance: false }))}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                        !formData.carry_balance
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      No, I pay in full
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, carry_balance: true }))}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                        formData.carry_balance
                          ? "border-amber-500 bg-amber-500/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      Yes, sometimes
                    </button>
                  </div>
                  {formData.carry_balance && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Rewards optimization will be limited. Interest negates any rewards earned.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Do you use Buy Now, Pay Later (BNPL)?</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, bnpl_usage: 'never' }))}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                        formData.bnpl_usage === 'never'
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      Never
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, bnpl_usage: 'sometimes' }))}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                        formData.bnpl_usage === 'sometimes'
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      Sometimes
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, bnpl_usage: 'often' }))}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                        formData.bnpl_usage === 'often'
                          ? "border-amber-500 bg-amber-500/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      Often
                    </button>
                  </div>
                  {formData.bnpl_usage === 'often' && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          BNPL can fragment your spending and make credit optimization harder.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  disabled={formData.bnpl_usage === null}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Credit History */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Your Credit History</h2>
                <p className="text-muted-foreground">This helps us recommend cards you'll actually be approved for</p>
              </div>

              <div className="grid gap-4">
                {CREDIT_HISTORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, credit_history: option.value }))}
                    className={cn(
                      "p-5 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                      formData.credit_history === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <h3 className="font-semibold mb-1">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>

              {formData.credit_history === 'none' && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      No problem! We'll recommend secured cards and student cards that are designed for building credit from scratch.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(5)} 
                  disabled={!canProceedToStep5}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Add Cards */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Add Your Cards</h2>
                <p className="text-muted-foreground">Select at least 2 cards to get started</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards by name or issuer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Selected Count */}
              <div className="flex items-center justify-between">
                <Badge variant={canProceedToStep5 ? "default" : "secondary"}>
                  {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''} selected
                </Badge>
                {!canProceedToStep5 && (
                  <span className="text-xs text-muted-foreground">
                    Select at least 2 cards
                  </span>
                )}
              </div>

              {/* Cards List */}
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-2">
                {cardsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading cards...</div>
                ) : (
                  Object.entries(groupedCards).map(([issuer, issuerCards]) => (
                    <div key={issuer} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground px-1 py-1">
                        {issuer}
                      </div>
                      {issuerCards.map(card => {
                        const isSelected = selectedCardIds.includes(card.id);
                        return (
                          <button
                            key={card.id}
                            onClick={() => handleCardToggle(card.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-muted-foreground/50"
                            )}
                          >
                            <CardImage 
                              issuer={card.issuer_name} 
                              cardName={card.name} 
                              network={card.network as any}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{card.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {card.reward_summary}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                ${card.annual_fee_cents / 100}/yr
                              </span>
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                                isSelected 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(6)} 
                  disabled={!canProceedToStep6}
                  className="flex-1 gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Summary & Finish */}
          {step === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Your Credit Profile</h2>
                <p className="text-muted-foreground">
                  Here's how we'll tailor your experience
                </p>
              </div>

              {/* Profile Summary */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stage</span>
                  <Badge variant="outline" className="capitalize">{previewState.stage.replace('_', ' ')}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Education Level</span>
                  <Badge variant="outline" className="capitalize">{previewState.education_mode}</Badge>
                </div>
                {previewState.suppression_flags.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground block mb-2">Active Protections</span>
                    <div className="flex flex-wrap gap-1">
                      {previewState.suppression_flags.map(flag => (
                        <Badge key={flag} variant="secondary" className="text-xs">
                          {flag.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Warnings */}
              {(showBalanceWarning || showBnplWarning) && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                        Limited Optimization Mode
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {showBalanceWarning && "Rewards advice is disabled while you carry balances. "}
                        {showBnplWarning && "BNPL usage restricts premium card recommendations."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(5)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleFinish} className="flex-1 gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
