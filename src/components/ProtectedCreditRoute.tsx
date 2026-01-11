/**
 * ProtectedCreditRoute - Server-first gating for credit features
 * 
 * This component enforces credit onboarding completion before allowing
 * access to protected credit features (Ask, Analyze, Dashboard, etc.)
 * 
 * Client gating is UX only - server enforces via RLS + Edge function checks.
 */
import { useAuth } from '@/contexts/AuthContext';
import { useCreditProfile } from '@/hooks/useCreditProfile';
import { CreditOnboardingModal } from '@/components/CreditOnboardingModal';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProtectedCreditRouteProps {
  children: React.ReactNode;
  /** Allow demo mode for non-authenticated users */
  allowDemo?: boolean;
}

/**
 * ProtectedCreditRoute
 * - Authenticated users must complete credit onboarding
 * - Non-authenticated users can access in demo mode if allowDemo=true
 * - Shows onboarding modal when required
 */
export function ProtectedCreditRoute({ children, allowDemo = true }: ProtectedCreditRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { requiresOnboarding, loading: profileLoading, refetch } = useCreditProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Determine if we need to show onboarding
  useEffect(() => {
    if (!authLoading && !profileLoading && user && requiresOnboarding) {
      setShowOnboarding(true);
    }
  }, [authLoading, profileLoading, user, requiresOnboarding]);

  // Loading state
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Non-authenticated user with demo allowed - let through
  if (!user && allowDemo) {
    return <>{children}</>;
  }

  // Authenticated user needing onboarding - show modal over content
  if (user && requiresOnboarding) {
    return (
      <>
        <CreditOnboardingModal 
          open={showOnboarding} 
          onComplete={() => {
            setShowOnboarding(false);
            refetch();
          }} 
        />
        {/* Show blurred/disabled content behind modal */}
        <div className="pointer-events-none opacity-50 blur-sm">
          {children}
        </div>
      </>
    );
  }

  // Authenticated user with completed onboarding - full access
  return <>{children}</>;
}
