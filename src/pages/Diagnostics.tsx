import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  DollarSign, 
  TrendingDown, 
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ThumbsDown,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/hooks/useTodos';
import { TodoList } from '@/components/todos/TodoList';

interface DiagnosticsData {
  totalSpend: number;
  missedRewards: number;
  subscriptionSpend: number;
  lastUpdated: string | null;
}

export default function Diagnostics() {
  const { user } = useAuth();
  const { todos, loading: todosLoading, refetch: refetchTodos } = useTodos();
  const [data, setData] = useState<DiagnosticsData>({
    totalSpend: 0,
    missedRewards: 0,
    subscriptionSpend: 0,
    lastUpdated: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Calculate stats from todos
  useEffect(() => {
    if (todos.length > 0) {
      const subTodos = todos.filter(t => 
        t.type === 'review_subscription' || t.type === 'cancel_subscription'
      );
      const subscriptionSpend = subTodos.reduce((sum, t) => sum + (t.impact_usd || 0), 0);
      
      const benefitTodos = todos.filter(t => t.type === 'claim_benefit');
      const missedBenefits = benefitTodos.reduce((sum, t) => sum + (t.impact_usd || 0), 0);
      
      setData(prev => ({
        ...prev,
        subscriptionSpend,
        missedRewards: missedBenefits,
        lastUpdated: todos[0]?.created_at || null,
      }));
    }
  }, [todos]);

  const handleRefresh = async () => {
    if (!user) {
      toast.error('Please sign in to refresh');
      return;
    }

    setRefreshing(true);
    try {
      // Refetch todos from database
      await refetchTodos();
      toast.success('Data refreshed');
    } catch (err) {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFeedback = async (todoId: string, feedback: 'incorrect' | 'suppress') => {
    if (!user) return;

    try {
      // Get the todo to extract insight key
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const source = todo.source as Record<string, unknown>;
      let insightKey = '';
      let insightType = '';

      if (todo.type === 'review_subscription' || todo.type === 'cancel_subscription') {
        insightType = 'subscription';
        insightKey = `sub:${source.merchant_normalized}`;
      } else if (todo.type === 'claim_benefit') {
        insightType = 'benefit';
        insightKey = `ben:${source.benefit_id}:${source.month}`;
      }

      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('user_feedback')
        .upsert({
          user_id: user.id,
          insight_type: insightType,
          insight_key: insightKey,
          feedback,
        }, {
          onConflict: 'user_id,insight_type,insight_key'
        });

      if (feedbackError) throw feedbackError;

      // Mark todo as done
      const { error: updateError } = await supabase
        .from('to_dos')
        .update({ status: 'done' })
        .eq('id', todoId);

      if (updateError) throw updateError;

      await refetchTodos();
      
      const message = feedback === 'incorrect' 
        ? 'Marked as incorrect. We won\'t show this pattern again.'
        : 'Hidden. We won\'t show this again.';
      toast.success(message);
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error('Failed to save feedback');
    }
  };

  const hasData = todos.length > 0 || data.lastUpdated;
  const openTodos = todos.filter(t => t.status === 'open');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Statement Diagnostics</h1>
              <p className="text-muted-foreground">
                Review detected patterns and action items from your transaction data
              </p>
            </div>
            {hasData && (
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            )}
          </div>

          {!hasData ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No analysis data yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Upload a CSV statement or manually enter transactions to get personalized insights
                </p>
                <Link to="/transactions">
                  <Button className="gap-2">
                    <FileText className="w-4 h-4" />
                    Upload Transactions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{openTodos.length}</p>
                        <p className="text-xs text-muted-foreground">Action Items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <TrendingDown className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${data.missedRewards.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Benefits to Claim</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <RefreshCw className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${data.subscriptionSpend.toFixed(0)}/mo</p>
                        <p className="text-xs text-muted-foreground">Subscriptions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Items with Feedback */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Action Items</CardTitle>
                  <Link to="/transactions">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Add Data
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {todosLoading ? (
                    <div className="py-8 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : openTodos.length === 0 ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No action items. Upload more transactions to find opportunities.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {openTodos.map(todo => {
                        const source = todo.source as Record<string, unknown>;
                        const confidence = (source.confidence_level as string) || 'medium';
                        const explanation = (source.explanation as string) || '';
                        
                        return (
                          <div 
                            key={todo.id}
                            className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{todo.title}</p>
                                  <Badge 
                                    variant={confidence === 'high' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {confidence === 'high' ? 'Recommended' : 'Consider'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{todo.description}</p>
                                {explanation && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Why: {explanation}
                                  </p>
                                )}
                              </div>
                              {todo.impact_usd > 0 && (
                                <Badge variant="outline" className="flex-shrink-0">
                                  ${todo.impact_usd.toFixed(0)}/mo
                                </Badge>
                              )}
                            </div>
                            
                            {/* Feedback Actions */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(todo.id, 'incorrect')}
                                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                This is incorrect
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(todo.id, 'suppress')}
                                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                Don't show again
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Privacy Note */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Your data, your control</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All insights are based solely on data you provide. We do not connect to bank accounts, 
                      infer beyond your transactions, or share your information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
