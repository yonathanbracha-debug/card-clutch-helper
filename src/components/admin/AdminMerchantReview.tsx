/**
 * Admin Merchant Review Page
 * For reviewing AI/heuristic suggestions and approving/rejecting
 */

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  ExternalLink,
  Brain,
  Lightbulb,
  User,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  PendingMerchantSuggestion, 
  getAllSuggestions,
  approveSuggestion,
  rejectSuggestion,
} from '@/lib/reviewQueue';
import { createOverrideFromApproval } from '@/lib/merchantOverrides';
import { MERCHANT_CATEGORIES, MerchantCategory, CATEGORY_LABELS } from '@/lib/merchantCategories';

export function AdminMerchantReview() {
  const [suggestions, setSuggestions] = useState<PendingMerchantSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedSuggestion, setSelectedSuggestion] = useState<PendingMerchantSuggestion | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [editCategory, setEditCategory] = useState<MerchantCategory>('other');
  const [editMerchantName, setEditMerchantName] = useState('');

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const all = await getAllSuggestions();
      setSuggestions(all);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const filteredSuggestions = suggestions
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .filter(s => 
      !searchTerm || 
      s.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.suggestedMerchantName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleApprove = async () => {
    if (!selectedSuggestion) return;

    try {
      // Create override
      createOverrideFromApproval(
        selectedSuggestion.domain,
        editMerchantName || selectedSuggestion.suggestedMerchantName || selectedSuggestion.domain,
        editCategory,
        reviewNotes
      );

      // Mark as approved
      await approveSuggestion(selectedSuggestion.id, reviewNotes);
      
      toast.success(`Approved: ${selectedSuggestion.domain} → ${editCategory}`);
      setSelectedSuggestion(null);
      loadSuggestions();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve suggestion');
    }
  };

  const handleReject = async () => {
    if (!selectedSuggestion) return;

    try {
      await rejectSuggestion(selectedSuggestion.id, reviewNotes);
      toast.success('Suggestion rejected');
      setSelectedSuggestion(null);
      loadSuggestions();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject suggestion');
    }
  };

  const openReviewModal = (suggestion: PendingMerchantSuggestion) => {
    setSelectedSuggestion(suggestion);
    setEditCategory(suggestion.inferredCategory);
    setEditMerchantName(suggestion.suggestedMerchantName || '');
    setReviewNotes('');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'heuristic': return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'user_report': return <User className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    return <Badge variant={variants[confidence] || 'outline'}>{confidence}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const { variant, label } = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const stats = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Suggestions</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl text-amber-500">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl text-emerald-500">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-2xl text-destructive">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Merchant Review Queue</CardTitle>
          <CardDescription>
            Review AI and heuristic merchant suggestions. Approved mappings become authoritative.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by domain or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSuggestions} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No suggestions found</p>
              <p className="text-sm">Suggestions appear when the AI classifies unknown merchants</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Merchant Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell className="font-mono text-sm">
                      <a 
                        href={`https://${suggestion.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        {suggestion.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell>{suggestion.suggestedMerchantName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[suggestion.inferredCategory] || suggestion.inferredCategory}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSourceIcon(suggestion.source)}
                        <span className="text-sm capitalize">{suggestion.source}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getConfidenceBadge(suggestion.confidence)}</TableCell>
                    <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(suggestion.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {suggestion.status === 'pending' ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openReviewModal(suggestion)}
                        >
                          Review
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {suggestion.reviewedAt && new Date(suggestion.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!selectedSuggestion} onOpenChange={(open) => !open && setSelectedSuggestion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Merchant Suggestion</DialogTitle>
            <DialogDescription>
              Approve to add to authoritative mappings, or reject to dismiss.
            </DialogDescription>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Domain</span>
                  <a 
                    href={`https://${selectedSuggestion.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono hover:text-primary flex items-center gap-1"
                  >
                    {selectedSuggestion.domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <div className="flex items-center gap-2">
                    {getSourceIcon(selectedSuggestion.source)}
                    <span className="text-sm capitalize">{selectedSuggestion.source}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  {getConfidenceBadge(selectedSuggestion.confidence)}
                </div>
                {selectedSuggestion.rationale && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Rationale:</p>
                    <p className="text-sm">{selectedSuggestion.rationale}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Merchant Name</label>
                  <Input
                    value={editMerchantName}
                    onChange={(e) => setEditMerchantName(e.target.value)}
                    placeholder="e.g., Amazon, Target"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={editCategory} onValueChange={(v: MerchantCategory) => setEditCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MERCHANT_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this decision..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="destructive" onClick={handleReject} className="gap-2">
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button onClick={handleApprove} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
