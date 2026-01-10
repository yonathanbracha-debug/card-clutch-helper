import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  RefreshCw, 
  Loader2, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ExternalLink,
  Trash2,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeSource {
  id: string;
  url: string;
  title: string;
  category: string;
  issuer: string | null;
  trust_tier: number;
  status: string;
  last_fetched_at: string | null;
  last_ingested_at: string | null;
  error_message: string | null;
  created_at: string;
  refresh_interval_days: number;
}

interface HealthStatus {
  pinecone_ok: boolean;
  openai_ok: boolean;
  last_ingestion: string | null;
  index_name: string | null;
  sources_count: number;
  error?: string;
}

const CATEGORIES = [
  'issuer_policy',
  'credit_education',
  'regulatory',
  'rewards_guide',
  'general',
];

export function AdminKnowledgeManager() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [refreshingStale, setRefreshingStale] = useState(false);

  // Form state
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('credit_education');
  const [newIssuer, setNewIssuer] = useState('');
  const [newRefreshDays, setNewRefreshDays] = useState('30');

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
      toast.error('Failed to load knowledge sources');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('health-rag');
      if (error) throw error;
      setHealthStatus(data);
    } catch (err) {
      console.error('Health check failed:', err);
      setHealthStatus({
        pinecone_ok: false,
        openai_ok: false,
        last_ingestion: null,
        index_name: null,
        sources_count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
    fetchHealth();
  }, [fetchSources, fetchHealth]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUrl.trim() || !newTitle.trim()) {
      toast.error('URL and title are required');
      return;
    }

    setAddingSource(true);
    try {
      const { data, error } = await supabase.functions.invoke('ingest-source', {
        body: {
          url: newUrl.trim(),
          title: newTitle.trim(),
          category: newCategory,
          issuer: newIssuer.trim() || null,
          refresh_interval_days: parseInt(newRefreshDays, 10),
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Source added and ingestion started');
      
      // Reset form
      setNewUrl('');
      setNewTitle('');
      setNewCategory('credit_education');
      setNewIssuer('');
      setNewRefreshDays('30');
      
      // Refresh list
      fetchSources();
    } catch (err) {
      console.error('Failed to add source:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setAddingSource(false);
    }
  };

  const handleReIngest = async (sourceId: string) => {
    setIngestingId(sourceId);
    try {
      const source = sources.find(s => s.id === sourceId);
      if (!source) return;

      const { data, error } = await supabase.functions.invoke('ingest-source', {
        body: {
          url: source.url,
          title: source.title,
          category: source.category,
          issuer: source.issuer,
          refresh_interval_days: source.refresh_interval_days,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Re-ingestion complete');
      fetchSources();
    } catch (err) {
      console.error('Re-ingestion failed:', err);
      toast.error(err instanceof Error ? err.message : 'Re-ingestion failed');
    } finally {
      setIngestingId(null);
    }
  };

  const handleRefreshStale = async () => {
    setRefreshingStale(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-stale-sources');

      if (error) throw error;

      if (data?.refreshed > 0) {
        toast.success(`Refreshed ${data.refreshed} stale source(s)`);
      } else {
        toast.info('No stale sources found');
      }
      
      fetchSources();
    } catch (err) {
      console.error('Refresh stale failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to refresh stale sources');
    } finally {
      setRefreshingStale(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Delete this source and all its data?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;

      toast.success('Source deleted');
      fetchSources();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete source');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Health Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                RAG System Health
              </CardTitle>
              <CardDescription>Connection status for AI services</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealth}
              disabled={healthLoading}
            >
              {healthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {healthStatus.pinecone_ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">Pinecone</span>
              </div>
              <div className="flex items-center gap-2">
                {healthStatus.openai_ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">OpenAI</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{healthStatus.sources_count}</span> sources
              </div>
              <div className="text-sm text-muted-foreground">
                Last: {formatDate(healthStatus.last_ingestion)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Loading health status...</div>
          )}
        </CardContent>
      </Card>

      {/* Add Source Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Knowledge Source
          </CardTitle>
          <CardDescription>Add a new URL to the knowledge base</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSource} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/credit-guide"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Credit Score Guide"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer (optional)</Label>
                <Input
                  id="issuer"
                  placeholder="Chase, Amex, etc."
                  value={newIssuer}
                  onChange={(e) => setNewIssuer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refresh">Refresh Interval (days)</Label>
                <Input
                  id="refresh"
                  type="number"
                  min="1"
                  max="365"
                  value={newRefreshDays}
                  onChange={(e) => setNewRefreshDays(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={addingSource}>
              {addingSource ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingesting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add & Ingest
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sources List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Knowledge Sources
              </CardTitle>
              <CardDescription>
                {sources.length} source{sources.length !== 1 ? 's' : ''} in knowledge base
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStale}
                disabled={refreshingStale}
              >
                {refreshingStale ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Clock className="w-4 h-4 mr-2" />
                )}
                Refresh Stale
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSources}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No knowledge sources yet. Add one above.
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className={cn(
                    "p-4 rounded-lg border border-border bg-card",
                    source.status === 'error' && "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{source.title}</h4>
                        {getStatusBadge(source.status)}
                        <Badge variant="secondary" className="text-xs">
                          Tier {source.trust_tier}
                        </Badge>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                      >
                        {source.url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      {source.error_message && (
                        <p className="text-xs text-red-500 mt-1">{source.error_message}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Category: {source.category.replace(/_/g, ' ')}</span>
                        {source.issuer && <span>Issuer: {source.issuer}</span>}
                        <span>Last ingested: {formatDate(source.last_ingested_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleReIngest(source.id)}
                        disabled={ingestingId === source.id}
                      >
                        {ingestingId === source.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSource(source.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
