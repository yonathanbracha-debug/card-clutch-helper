import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CardImage } from '@/components/CardImage';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, Lock, Sparkles, ChevronRight } from 'lucide-react';

// Friendly gated page for wallet when not logged in
const WalletGated = () => {
  const { user } = useAuth();
  const { demoCardIds, allCards, startWithDemo } = useUnifiedWallet();

  const demoCards = allCards.filter(c => demoCardIds.includes(c.id)).slice(0, 3);

  // If user is logged in, show the full vault
  if (user) {
    // Redirect to actual vault functionality (or render inline)
    return null; // Will be handled by parent
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">My Wallet</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Save your cards and preferences to get personalized recommendations every time.
            </p>
            
            <div className="p-6 rounded-2xl border border-border bg-card mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Lock className="w-4 h-4" />
                <span>Sign in to save your wallet permanently</span>
              </div>
              
              <div className="space-y-3">
                <Link to="/auth">
                  <Button className="w-full gap-2">
                    Sign in to Save
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Free account • No credit card required
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">
                  or continue as guest
                </span>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-2xl border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium">Try with Demo Wallet</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Use our preset wallet with 3 popular cards to test the analyzer.
              </p>
              {demoCards.length > 0 && (
                <div className="flex justify-center gap-2 mb-4">
                  {demoCards.map(card => (
                    <CardImage 
                      key={card.id}
                      issuer={card.issuer_name}
                      cardName={card.name}
                      network={card.network}
                      size="sm"
                    />
                  ))}
                </div>
              )}
              <Link to="/analyze" onClick={() => startWithDemo()}>
                <Button variant="outline" className="gap-2">
                  Continue with Demo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WalletGated;
