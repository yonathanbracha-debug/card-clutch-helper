/**
 * Admin Ask Analytics - Founder Control Panel
 * Shows most common questions, confusion points, and user patterns
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Target,
  ThumbsDown,
  Clock,
  BarChart3,
  Brain,
} from 'lucide-react';

interface QuestionPattern {
  question: string;
  count: number;
  avgConfidence: number;
  intent: string | null;
}

interface ConfusionPoint {
  intent: string;
  lowConfidenceCount: number;
  totalCount: number;
  confusionRate: number;
}

interface AnalyticsData {
  totalQuestions: number;
  avgConfidence: number;
  lowConfidenceRate: number;
  topQuestions: QuestionPattern[];
  confusionPoints: ConfusionPoint[];
  recentQuestions: Array<{
    question: string;
    confidence: number;
    created_at: string;
    intent: string | null;
  }>;
  mythDetections: number;
}

export function AdminAskAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch rag_queries data using the public view
      const { data: queries, error: queryError } = await supabase
        .from('rag_queries_public')
        .select('question, confidence, intent, created_at, answer')
        .order('created_at', { ascending: false })
        .limit(500);

      if (queryError) throw queryError;

      if (!queries || queries.length === 0) {
        setData({
          totalQuestions: 0,
          avgConfidence: 0,
          lowConfidenceRate: 0,
          topQuestions: [],
          confusionPoints: [],
          recentQuestions: [],
          mythDetections: 0,
        });
        setLoading(false);
        return;
      }

      // Calculate total and average confidence
      const totalQuestions = queries.length;
      const avgConfidence = queries.reduce((sum, q) => sum + (q.confidence || 0), 0) / totalQuestions;
      
      // Calculate low confidence rate (below 0.7)
      const lowConfidenceCount = queries.filter(q => (q.confidence || 0) < 0.7).length;
      const lowConfidenceRate = lowConfidenceCount / totalQuestions;

      // Count myth detections (answers containing "misconception" or "myth")
      const mythDetections = queries.filter(q => 
        q.answer?.toLowerCase().includes('misconception') || 
        q.answer?.toLowerCase().includes('myth')
      ).length;

      // Group questions by similarity (simple approach: exact match)
      const questionCounts = new Map<string, { count: number; confidences: number[]; intent: string | null }>();
      queries.forEach(q => {
        const key = q.question?.toLowerCase().trim() || '';
        if (!key) return;
        
        const existing = questionCounts.get(key);
        if (existing) {
          existing.count++;
          existing.confidences.push(q.confidence || 0);
        } else {
          questionCounts.set(key, {
            count: 1,
            confidences: [q.confidence || 0],
            intent: q.intent,
          });
        }
      });

      // Get top questions
      const topQuestions: QuestionPattern[] = Array.from(questionCounts.entries())
        .map(([question, data]) => ({
          question,
          count: data.count,
          avgConfidence: data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length,
          intent: data.intent,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate confusion points by intent
      const intentStats = new Map<string, { low: number; total: number }>();
      queries.forEach(q => {
        const intent = q.intent || 'unknown';
        const existing = intentStats.get(intent) || { low: 0, total: 0 };
        existing.total++;
        if ((q.confidence || 0) < 0.7) {
          existing.low++;
        }
        intentStats.set(intent, existing);
      });

      const confusionPoints: ConfusionPoint[] = Array.from(intentStats.entries())
        .map(([intent, stats]) => ({
          intent,
          lowConfidenceCount: stats.low,
          totalCount: stats.total,
          confusionRate: stats.low / stats.total,
        }))
        .filter(cp => cp.totalCount >= 3) // Only show intents with enough data
        .sort((a, b) => b.confusionRate - a.confusionRate)
        .slice(0, 5);

      // Recent questions
      const recentQuestions = queries.slice(0, 20).map(q => ({
        question: q.question || '',
        confidence: q.confidence || 0,
        created_at: q.created_at || '',
        intent: q.intent,
      }));

      setData({
        totalQuestions,
        avgConfidence,
        lowConfidenceRate,
        topQuestions,
        confusionPoints,
        recentQuestions,
        mythDetections,
      });
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Ask Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Question patterns, confusion points, and user behavior
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{data.totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Total questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {(data.avgConfidence * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {(data.lowConfidenceRate * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Low confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{data.mythDetections}</p>
                <p className="text-sm text-muted-foreground">Myths detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Most Common Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No questions yet</p>
            ) : (
              <div className="space-y-3">
                {data.topQuestions.map((q, i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm text-foreground line-clamp-2 flex-1">
                        {q.question}
                      </p>
                      <Badge variant="secondary" className="shrink-0">
                        {q.count}x
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn(
                          "h-1.5 rounded-full flex-1",
                          q.avgConfidence >= 0.8 ? "bg-emerald-500" :
                          q.avgConfidence >= 0.6 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${q.avgConfidence * 100}%`, maxWidth: '100%' }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {(q.avgConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confusion Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-amber-600" />
              Confusion Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.confusionPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confusion patterns detected yet</p>
            ) : (
              <div className="space-y-3">
                {data.confusionPoints.map((cp, i) => (
                  <div 
                    key={i}
                    className="p-3 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {cp.intent.replace(/_/g, ' ')}
                      </span>
                      <Badge 
                        variant="outline"
                        className={cn(
                          cp.confusionRate > 0.5 ? "border-rose-500/40 text-rose-600" :
                          cp.confusionRate > 0.3 ? "border-amber-500/40 text-amber-600" :
                          "border-muted text-muted-foreground"
                        )}
                      >
                        {(cp.confusionRate * 100).toFixed(0)}% low confidence
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cp.lowConfidenceCount} of {cp.totalCount} questions
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent questions</p>
          ) : (
            <div className="space-y-2">
              {data.recentQuestions.slice(0, 10).map((q, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      q.confidence >= 0.8 ? "bg-emerald-500" :
                      q.confidence >= 0.6 ? "bg-amber-500" : "bg-rose-500"
                    )}
                  />
                  <p className="text-sm text-foreground flex-1 truncate">
                    {q.question}
                  </p>
                  {q.intent && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {q.intent}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
