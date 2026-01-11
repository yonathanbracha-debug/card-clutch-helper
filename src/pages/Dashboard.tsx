import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletCards } from '@/hooks/useWalletCards';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAllCardRewardRules } from '@/hooks/useCardRewardRules';
import { CreditPathwayCard } from '@/components/pathway/CreditPathwayCard';
import { TodoList } from '@/components/todos/TodoList';
import { 
  Wallet, 
  CreditCard, 
  ArrowRight, 
  Zap, 
  Settings,
  Plus,
  TrendingUp,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Category best card calculation
function getBestCardForCategory(
  categorySlug: string,
  walletCardIds: string[],
  allRules: any[]
) {
  const relevantRules = allRules.filter(
    r => r.category_slug === categorySlug && walletCardIds.includes(r.card_id)
  );
  
  if (relevantRules.length === 0) return null;
  
  return relevantRules.reduce((best, rule) => 
    rule.multiplier > (best?.multiplier || 0) ? rule : best
  , null);
}

const MAIN_CATEGORIES = [
  { slug: 'dining', label: 'Dining' },
  { slug: 'groceries', label: 'Groceries' },
  { slug: 'travel', label: 'Travel' },
  { slug: 'gas', label: 'Gas' },
  { slug: 'streaming', label: 'Streaming' },
  { slug: 'online_shopping', label: 'Online Shopping' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { walletCards, selectedCardIds, loading: walletLoading } = useWalletCards();
  const { cards, loading: cardsLoading } = useCreditCards();
  const { rules, loading: rulesLoading } = useAllCardRewardRules();

  const selectedCards = useMemo(() => {
    return selectedCardIds
      .map(id => cards.find(c => c.id === id))
      .filter(Boolean);
  }, [selectedCardIds, cards]);

  const categoryCheatSheet = useMemo(() => {
    return MAIN_CATEGORIES.map(cat => {
      const bestRule = getBestCardForCategory(cat.slug, selectedCardIds, rules);
      const card = bestRule ? cards.find(c => c.id === bestRule.card_id) : null;
      return {
        ...cat,
        bestCard: card,
        multiplier: bestRule?.multiplier || null,
      };
    });
  }, [selectedCardIds, rules, cards]);

  const isLoading = walletLoading || cardsLoading || rulesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container max-w-6xl mx-auto px-4">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
              </p>
            </div>
            <Link to="/wallet">
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Manage Wallet
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Wallet Summary */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  My Wallet
                </CardTitle>
                <Badge variant="secondary">{selectedCardIds.length} cards</Badge>
              </CardHeader>
              <CardContent>
                {selectedCards.length === 0 ? (
                  <div className="py-6 text-center">
                    <CreditCard className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Add cards to get personalized recommendations
                    </p>
                    <Link to="/wallet">
                      <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Cards
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCards.slice(0, 4).map(card => card && (
                      <div key={card.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <CardImage
                          issuer={card.issuer_name}
                          cardName={card.name}
                          network={card.network}
                          size="xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{card.name}</p>
                          <p className="text-xs text-muted-foreground">{card.issuer_name}</p>
                        </div>
                      </div>
                    ))}
                    {selectedCards.length > 4 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{selectedCards.length - 4} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/analyze" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Get a Recommendation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/wallet" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Edit My Wallet
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/cards" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Browse Card Library
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Category Cheat Sheet */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Best Cards by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCards.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Add cards to see your cheat sheet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoryCheatSheet.map(cat => (
                      <div 
                        key={cat.slug}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm font-medium">{cat.label}</span>
                        {cat.bestCard ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground truncate max-w-24">
                              {cat.bestCard.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {cat.multiplier}x
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Credit Pathway + To-dos Row */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <CreditPathwayCard />
            <TodoList compact maxItems={3} />
          </div>

          {/* Statement Diagnostics CTA */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Statement Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload transactions to find missed rewards and subscription waste
                </p>
                <Link to="/diagnostics">
                  <Button size="sm" variant="outline" className="gap-2">
                    View Statement Report
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
