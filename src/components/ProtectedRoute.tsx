import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock, Sparkles, History, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, shows a friendly gate instead of redirect */
  softGate?: boolean;
}

/**
 * ProtectedRoute with soft gating option
 * - Default: redirects to auth (for truly protected routes like /account)
 * - softGate=true: shows friendly explainer with demo mode option
 */
export function ProtectedRoute({ children, softGate = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // For soft-gated routes, show friendly explainer instead of redirect
  if (!user && softGate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sign in to unlock this feature</CardTitle>
            <CardDescription className="text-base mt-2">
              Create a free account to save your cards, track history, and get personalized recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Save your wallet across devices</span>
              </div>
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-primary" />
                <span>Track your recommendation history</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Get smarter, personalized suggestions</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-4">
              <Button asChild className="w-full">
                <Link to="/auth" state={{ from: location }}>
                  Sign in to save
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/analyze">
                  Continue in Demo Mode
                </Link>
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              Demo mode uses local storage. Your data won't sync across devices.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For hard-gated routes, redirect to auth
  if (!user) {
    // Return soft gate instead of hard redirect for better UX
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription className="text-base mt-2">
              This feature requires an account. Sign in or create one to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link to="/auth" state={{ from: location }}>
                  Sign in
                </Link>
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
