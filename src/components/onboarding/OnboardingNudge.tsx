import { useState, useEffect } from 'react';
import { X, CreditCard, Zap, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ONBOARDING_COMPLETED_KEY = 'cc_onboarding_completed_v1';
const MODE_KEY = 'cc_mode_v1';

export type UserMode = 'rewards' | 'credit';

interface OnboardingNudgeProps {
  hasCards: boolean;
  onOpenVault: () => void;
  onComplete: () => void;
}

export function OnboardingNudge({ hasCards, onOpenVault, onComplete }: OnboardingNudgeProps) {
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  });
  const [step, setStep] = useState<'intro' | 'mode' | 'done'>('intro');
  const [isVisible, setIsVisible] = useState(true);

  // Check if completed on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    setIsCompleted(completed);
  }, []);

  // Progress to mode selection when cards are selected
  useEffect(() => {
    if (hasCards && step === 'intro') {
      setStep('mode');
    }
  }, [hasCards, step]);

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsCompleted(true);
    setIsVisible(false);
    onComplete();
  };

  const handleChooseCards = () => {
    onOpenVault();
  };

  const handleSelectMode = (mode: UserMode) => {
    localStorage.setItem(MODE_KEY, mode);
    setStep('done');
    
    // Auto-complete after showing success
    setTimeout(() => {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setIsCompleted(true);
      setIsVisible(false);
      onComplete();
    }, 2000);
  };

  // Don't render if completed or dismissed
  if (isCompleted || !isVisible) return null;

  return (
    <div className="animate-fade-in mb-6">
      <div className="relative p-4 sm:p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'intro' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">
                Set up your Card Vault in 30 seconds
              </h3>
              <p className="text-sm text-muted-foreground">
                Add your cards once, get personalized recommendations every time.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleChooseCards} className="flex-1 sm:flex-none">
                Choose my cards
              </Button>
              <Button variant="ghost" onClick={handleSkip} className="flex-1 sm:flex-none">
                Skip
              </Button>
            </div>
          </div>
        )}

        {step === 'mode' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Cards added! One more step.</h3>
                <p className="text-sm text-muted-foreground">What's your priority?</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleSelectMode('rewards')}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-medium">Maximize Rewards</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Don't let rewards slip. Swipe smarter.
                </p>
              </button>
              
              <button
                onClick={() => handleSelectMode('credit')}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium">Protect Credit</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Protect utilization before it hurts you.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">You're all set!</h3>
              <p className="text-sm text-muted-foreground">
                Paste any store URL to get a recommendation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to check/manage onboarding state
export function useOnboardingState() {
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  });

  const [mode, setMode] = useState<UserMode | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(MODE_KEY) as UserMode | null;
  });

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsCompleted(true);
  };

  return { isCompleted, mode, completeOnboarding };
}
