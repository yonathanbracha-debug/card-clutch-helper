import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Zap, 
  AlertCircle, 
  TrendingUp,
  Globe,
  Tag,
  CheckCircle2,
  XCircle,
  Eye,
  UserPlus,
  BarChart3,
  AlertTriangle,
  ExternalLink,
  Brain,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AskAIMetrics {
  totalQuestions: number;
  deterministicCount: number;
  ragCount: number;
  hybridCount: number;
  errorCount: number;
  deterministicPercent: number;
  avgLatencyMs: number;
  totalEstimatedCostUsd: number;
  costPerQuestion: number;
}

interface DashboardMetrics {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  uniqueVisitors7d: number;
  totalRecommendations: number;
  recommendations24h: number;
  recommendations7d: number;
  demoAnalyses7d: number;
  openReports: number;
  resolvedReports: number;
  topDomains: { domain: string; count: number }[];
  topCategories: { category: string; count: number }[];
  dataHealthScore: number;
  cardsWithMissingData: number;
  errorRate: number;
  funnel: {
    pageViews: number;
    demoAnalyses: number;
    signupPrompts: number;
    signupClicks: number;
    signupCompleted: number;
  };
  dataTrust: {
    missingImageUrl: number;
    missingTermsUrl: number;
    missingSourceUrl: number;
    staleCards: number;
    cardsNeedingAttention: Array<{
      id: string;
      name: string;
      issues: string[];
    }>;
  };
  askAI: AskAIMetrics;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Fetch all metrics in parallel
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [
          usersResult,
          allEventsResult,
          openReportsResult,
          resolvedReportsResult,
          cardsResult,
          ragQueriesResult,
        ] = await Promise.all([
          // Total users
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          
          // All events in last 7 days for funnel and metrics
          supabase
            .from('analytics_events')
            .select('user_id, event_name, context, domain, created_at')
            .gte('created_at', sevenDaysAgo),
          
          // Open reports
          supabase
            .from('data_issue_reports')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open'),
          
          // Resolved reports
          supabase
            .from('data_issue_reports')
            .select('id', { count: 'exact', head: true })
            .neq('status', 'open'),
          
          // Cards health check
          supabase
            .from('credit_cards')
            .select('id, name, annual_fee_cents, last_verified_at, image_url, terms_url, source_url')
            .eq('is_active', true),
          
          // RAG queries for Ask AI metrics (last 7 days)
          supabase
            .from('rag_queries')
            .select('model, latency_ms, confidence, retrieved_chunks')
            .gte('created_at', sevenDaysAgo),
        ]);

        const events = allEventsResult.data || [];

        // Calculate unique visitors (user_id + anon_id from context)
        const visitorSet = new Set<string>();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartIso = todayStart.toISOString();

        events.forEach(e => {
          if (e.user_id) {
            visitorSet.add(`user:${e.user_id}`);
          } else if (e.context && (e.context as any).anon_id) {
            visitorSet.add(`anon:${(e.context as any).anon_id}`);
          }
        });

        // DAU calculation
        const todayEvents = events.filter(e => e.created_at >= todayStartIso);
        const todayVisitors = new Set<string>();
        todayEvents.forEach(e => {
          if (e.user_id) todayVisitors.add(`user:${e.user_id}`);
          else if (e.context && (e.context as any).anon_id) todayVisitors.add(`anon:${(e.context as any).anon_id}`);
        });

        // Count events by type
        const eventCounts: Record<string, number> = {};
        events.forEach(e => {
          eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
        });

        // Top domains
        const domainCounts: Record<string, number> = {};
        events.filter(e => e.domain && (e.event_name === 'recommendation_requested' || e.event_name === 'analyze_started')).forEach(e => {
          if (e.domain) {
            domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
          }
        });
        const topDomains = Object.entries(domainCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([domain, count]) => ({ domain, count }));

        // Top categories from context
        const categoryCounts: Record<string, number> = {};
        events.filter(e => e.event_name === 'recommendation_returned' || e.event_name === 'analyze_success').forEach(e => {
          const cat = (e.context as any)?.categorySlug;
          if (cat) {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          }
        });
        const topCategories = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }));

        // Error rate
        const analyzeStarted = eventCounts['analyze_started'] || 0;
        const analyzeFailed = eventCounts['analyze_failed'] || 0;
        const errorRate = analyzeStarted > 0 ? (analyzeFailed / analyzeStarted) * 100 : 0;

        // Funnel metrics
        const funnel = {
          pageViews: eventCounts['page_view'] || 0,
          demoAnalyses: eventCounts['demo_analysis_success'] || 0,
          signupPrompts: eventCounts['signup_prompt_shown'] || 0,
          signupClicks: eventCounts['signup_clicked'] || 0,
          signupCompleted: eventCounts['signup_completed'] || 0,
        };

        // Data trust metrics
        const cards = cardsResult.data || [];
        const thirtyDaysAgoDate = new Date(thirtyDaysAgo);
        
        const missingImageUrl = cards.filter(c => !c.image_url).length;
        const missingTermsUrl = cards.filter(c => !c.terms_url).length;
        const missingSourceUrl = cards.filter(c => !c.source_url).length;
        const staleCards = cards.filter(c => new Date(c.last_verified_at) < thirtyDaysAgoDate).length;

        const cardsNeedingAttention = cards
          .map(card => {
            const issues: string[] = [];
            if (!card.image_url) issues.push('Missing image');
            if (!card.terms_url) issues.push('Missing terms URL');
            if (new Date(card.last_verified_at) < thirtyDaysAgoDate) issues.push('Stale data');
            return { id: card.id, name: card.name, issues };
          })
          .filter(c => c.issues.length > 0)
          .slice(0, 10);

        const totalCards = cards.length;
        const cardsWithIssues = cards.filter(card => {
          const isStale = new Date(card.last_verified_at) < thirtyDaysAgoDate;
          return isStale || !card.image_url || !card.terms_url;
        }).length;
        
        const dataHealthScore = totalCards > 0 
          ? Math.round(((totalCards - cardsWithIssues) / totalCards) * 100)
          : 100;

        // 24h recommendations
        const recommendations24h = events.filter(e => 
          (e.event_name === 'recommendation_returned' || e.event_name === 'analyze_success') && 
          e.created_at >= oneDayAgo
        ).length;

        // Calculate Ask AI metrics
        const ragQueries = ragQueriesResult.data || [];
        let deterministicCount = 0;
        let ragCount = 0;
        let hybridCount = 0;
        let errorCount = 0;
        let totalLatency = 0;
        let totalCost = 0;

        ragQueries.forEach((q: any) => {
          const metrics = q.retrieved_chunks?.metrics;
          if (metrics?.route === 'deterministic') deterministicCount++;
          else if (metrics?.route === 'rag') ragCount++;
          else if (metrics?.route === 'hybrid') hybridCount++;
          else if (metrics?.route === 'error' || q.confidence === 0) errorCount++;
          else if (q.model === 'internal_rules') deterministicCount++;
          else ragCount++;

          totalLatency += q.latency_ms || 0;
          totalCost += metrics?.estimated_cost_usd || 0;
        });

        const totalQuestions = ragQueries.length;
        const askAI: AskAIMetrics = {
          totalQuestions,
          deterministicCount,
          ragCount,
          hybridCount,
          errorCount,
          deterministicPercent: totalQuestions > 0 ? Math.round((deterministicCount / totalQuestions) * 100) : 0,
          avgLatencyMs: totalQuestions > 0 ? Math.round(totalLatency / totalQuestions) : 0,
          totalEstimatedCostUsd: Math.round(totalCost * 10000) / 10000,
          costPerQuestion: totalQuestions > 0 ? Math.round((totalCost / totalQuestions) * 10000) / 10000 : 0,
        };

        setMetrics({
          totalUsers: usersResult.count || 0,
          activeUsersToday: todayVisitors.size,
          activeUsersWeek: visitorSet.size,
          uniqueVisitors7d: visitorSet.size,
          totalRecommendations: eventCounts['recommendation_returned'] || eventCounts['analyze_success'] || 0,
          recommendations24h,
          recommendations7d: eventCounts['recommendation_returned'] || eventCounts['analyze_success'] || 0,
          demoAnalyses7d: eventCounts['demo_analysis_success'] || 0,
          openReports: openReportsResult.count || 0,
          resolvedReports: resolvedReportsResult.count || 0,
          topDomains,
          topCategories,
          dataHealthScore,
          cardsWithMissingData: cardsWithIssues,
          errorRate: Math.round(errorRate * 100) / 100,
          funnel,
          dataTrust: {
            missingImageUrl,
            missingTermsUrl,
            missingSourceUrl,
            staleCards,
            cardsNeedingAttention,
          },
          askAI,
        });
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load metrics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          description="Registered accounts"
        />
        <KPICard
          title="Visitors (7d)"
          value={metrics.uniqueVisitors7d}
          icon={Eye}
          description="Unique visitors"
          trend={`${metrics.activeUsersToday} today`}
        />
        <KPICard
          title="Analyses (7d)"
          value={metrics.recommendations7d}
          icon={Zap}
          description="Total analyses"
          trend={`${metrics.recommendations24h} today`}
        />
        <KPICard
          title="Data Health"
          value={`${metrics.dataHealthScore}%`}
          icon={metrics.dataHealthScore >= 90 ? CheckCircle2 : AlertCircle}
          description={`${metrics.cardsWithMissingData} cards need attention`}
          variant={metrics.dataHealthScore >= 90 ? 'success' : metrics.dataHealthScore >= 70 ? 'warning' : 'danger'}
        />
      </div>

      {/* Second Row - Demo & Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Demo Analyses"
          value={metrics.demoAnalyses7d}
          icon={TrendingUp}
          description="Guest user analyses (7d)"
        />
        <KPICard
          title="Error Rate"
          value={`${metrics.errorRate}%`}
          icon={XCircle}
          description="Failed / Started"
          variant={metrics.errorRate > 5 ? 'danger' : metrics.errorRate > 2 ? 'warning' : 'success'}
        />
        <KPICard
          title="Open Reports"
          value={metrics.openReports}
          icon={AlertCircle}
          description="Pending review"
          variant={metrics.openReports > 5 ? 'warning' : 'default'}
        />
        <KPICard
          title="Resolved Reports"
          value={metrics.resolvedReports}
          icon={CheckCircle2}
          description="Handled"
          variant="success"
        />
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5" />
            Conversion Funnel (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelStep label="Page Views" count={metrics.funnel.pageViews} percentage={100} />
            <FunnelStep 
              label="Demo Analyses" 
              count={metrics.funnel.demoAnalyses} 
              percentage={metrics.funnel.pageViews > 0 ? (metrics.funnel.demoAnalyses / metrics.funnel.pageViews) * 100 : 0} 
            />
            <FunnelStep 
              label="Signup Prompts Shown" 
              count={metrics.funnel.signupPrompts} 
              percentage={metrics.funnel.pageViews > 0 ? (metrics.funnel.signupPrompts / metrics.funnel.pageViews) * 100 : 0} 
            />
            <FunnelStep 
              label="Signup Clicks" 
              count={metrics.funnel.signupClicks} 
              percentage={metrics.funnel.pageViews > 0 ? (metrics.funnel.signupClicks / metrics.funnel.pageViews) * 100 : 0} 
            />
            <FunnelStep 
              label="Signups Completed" 
              count={metrics.funnel.signupCompleted} 
              percentage={metrics.funnel.pageViews > 0 ? (metrics.funnel.signupCompleted / metrics.funnel.pageViews) * 100 : 0} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Trust Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Data Trust - Cards Needing Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{metrics.dataTrust.missingImageUrl}</p>
              <p className="text-xs text-muted-foreground">Missing image_url</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{metrics.dataTrust.missingTermsUrl}</p>
              <p className="text-xs text-muted-foreground">Missing terms_url</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{metrics.dataTrust.missingSourceUrl}</p>
              <p className="text-xs text-muted-foreground">Missing source_url</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{metrics.dataTrust.staleCards}</p>
              <p className="text-xs text-muted-foreground">Stale (30+ days)</p>
            </div>
          </div>

          {metrics.dataTrust.cardsNeedingAttention.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">Top 10 Cards Needing Attention:</p>
              {metrics.dataTrust.cardsNeedingAttention.map(card => (
                <div key={card.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">{card.name}</p>
                    <div className="flex gap-1 mt-1">
                      {card.issues.map((issue, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin?tab=cards">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p>All cards have complete data!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Domains & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5" />
              Top Domains (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topDomains.length === 0 ? (
              <p className="text-muted-foreground text-sm">No domain data yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {metrics.topDomains.map((d) => (
                  <Badge key={d.domain} variant="secondary" className="text-sm">
                    {d.domain} <span className="ml-1 text-muted-foreground">({d.count})</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="w-5 h-5" />
              Top Categories (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">No category data yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {metrics.topCategories.map((c) => (
                  <Badge key={c.category} variant="secondary" className="text-sm capitalize">
                    {c.category} <span className="ml-1 text-muted-foreground">({c.count})</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const iconColor = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-destructive',
  }[variant];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {trend && (
              <p className="text-xs text-primary mt-1">{trend}</p>
            )}
          </div>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelStep({ label, count, percentage }: { label: string; count: number; percentage: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-sm text-muted-foreground">{label}</div>
      <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
        <div 
          className="h-full bg-primary/20 flex items-center px-3"
          style={{ width: `${Math.max(percentage, 5)}%` }}
        >
          <span className="text-sm font-medium">{count}</span>
        </div>
      </div>
      <div className="w-16 text-right text-sm text-muted-foreground">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}
