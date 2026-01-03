import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Zap, 
  AlertCircle, 
  TrendingUp,
  Globe,
  Tag,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface DashboardMetrics {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  totalRecommendations: number;
  recommendations24h: number;
  recommendations7d: number;
  openReports: number;
  resolvedReports: number;
  topDomains: { domain: string; count: number }[];
  topCategories: { category: string; count: number }[];
  dataHealthScore: number;
  cardsWithMissingData: number;
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

        const [
          usersResult,
          activeUsersResult,
          recommendationsResult,
          recommendations24hResult,
          recommendations7dResult,
          openReportsResult,
          resolvedReportsResult,
          topDomainsResult,
          cardsResult,
        ] = await Promise.all([
          // Total users
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          
          // Active users (events in last 7 days)
          supabase
            .from('analytics_events')
            .select('user_id')
            .gte('created_at', sevenDaysAgo)
            .not('user_id', 'is', null),
          
          // Total recommendations
          supabase
            .from('analytics_events')
            .select('id', { count: 'exact', head: true })
            .eq('event_name', 'recommendation_returned'),
          
          // Recommendations last 24h
          supabase
            .from('analytics_events')
            .select('id', { count: 'exact', head: true })
            .eq('event_name', 'recommendation_returned')
            .gte('created_at', oneDayAgo),
          
          // Recommendations last 7 days
          supabase
            .from('analytics_events')
            .select('id', { count: 'exact', head: true })
            .eq('event_name', 'recommendation_returned')
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
          
          // Top domains from events
          supabase
            .from('analytics_events')
            .select('domain')
            .eq('event_name', 'recommendation_requested')
            .not('domain', 'is', null)
            .limit(500),
          
          // Cards health check
          supabase
            .from('credit_cards')
            .select('id, annual_fee_cents, last_verified_at, image_url')
            .eq('is_active', true),
        ]);

        // Process active users (unique user_ids)
        const uniqueUserIdsWeek = new Set(
          activeUsersResult.data?.map(e => e.user_id).filter(Boolean)
        );
        
        // Calculate DAU from the same data
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const activeToday = activeUsersResult.data?.filter(
          e => e.user_id && new Date(todayStart) <= new Date()
        );
        const uniqueUserIdsToday = new Set(activeToday?.map(e => e.user_id).filter(Boolean));

        // Process top domains
        const domainCounts: Record<string, number> = {};
        topDomainsResult.data?.forEach(e => {
          if (e.domain) {
            domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
          }
        });
        const topDomains = Object.entries(domainCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([domain, count]) => ({ domain, count }));

        // Calculate data health
        const totalCards = cardsResult.data?.length || 0;
        const cardsWithIssues = cardsResult.data?.filter(card => {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const isStale = new Date(card.last_verified_at) < thirtyDaysAgo;
          return isStale || !card.image_url;
        }).length || 0;
        
        const dataHealthScore = totalCards > 0 
          ? Math.round(((totalCards - cardsWithIssues) / totalCards) * 100)
          : 100;

        setMetrics({
          totalUsers: usersResult.count || 0,
          activeUsersToday: uniqueUserIdsToday.size,
          activeUsersWeek: uniqueUserIdsWeek.size,
          totalRecommendations: recommendationsResult.count || 0,
          recommendations24h: recommendations24hResult.count || 0,
          recommendations7d: recommendations7dResult.count || 0,
          openReports: openReportsResult.count || 0,
          resolvedReports: resolvedReportsResult.count || 0,
          topDomains,
          topCategories: [], // Would need category tracking
          dataHealthScore,
          cardsWithMissingData: cardsWithIssues,
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
          title="WAU"
          value={metrics.activeUsersWeek}
          icon={TrendingUp}
          description="Active this week"
          trend={metrics.activeUsersToday > 0 ? `${metrics.activeUsersToday} today` : undefined}
        />
        <KPICard
          title="Recommendations"
          value={metrics.totalRecommendations}
          icon={Zap}
          description="Total served"
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

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <KPICard
          title="Recs (24h)"
          value={metrics.recommendations24h}
          icon={Zap}
          description="Last 24 hours"
        />
        <KPICard
          title="Recs (7d)"
          value={metrics.recommendations7d}
          icon={TrendingUp}
          description="Last 7 days"
        />
      </div>

      {/* Top Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5" />
            Top Domains (Recommendations)
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
