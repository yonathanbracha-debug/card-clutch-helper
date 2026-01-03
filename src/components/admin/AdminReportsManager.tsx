import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Search, MessageSquare, Clock, User } from 'lucide-react';

interface Report {
  id: string;
  created_at: string;
  user_id: string | null;
  card_id: string | null;
  merchant_id: string | null;
  issue_type: string;
  description: string;
  status: string;
  admin_notes: string | null;
  resolved_at: string | null;
}

const STATUS_OPTIONS = ['open', 'triaged', 'fixed', 'rejected'];

export function AdminReportsManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('data_issue_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const updates: Partial<Report> = {
        status: newStatus,
        admin_notes: adminNotes || null,
      };
      
      if (newStatus === 'fixed' || newStatus === 'rejected') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('data_issue_reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report marked as ${newStatus}`);
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (err) {
      console.error('Failed to update report:', err);
      toast.error('Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      report.description.toLowerCase().includes(q) ||
      report.card_id?.toLowerCase().includes(q) ||
      report.issue_type.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'destructive',
      triaged: 'default',
      fixed: 'secondary',
      rejected: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredReports.length} reports</Badge>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Card ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.issue_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-sm">{report.description}</p>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">
                      {report.card_id?.slice(0, 8) || '-'}
                    </code>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedReport(report);
                        setAdminNotes(report.admin_notes || '');
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Report Detail Sheet */}
      <Sheet open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Report Details</SheetTitle>
          </SheetHeader>
          
          {selectedReport && (
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issue Type</p>
                <Badge variant="outline" className="mt-1">{selectedReport.issue_type}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{selectedReport.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="mt-1 text-sm flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>

              {selectedReport.user_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reporter</p>
                  <p className="mt-1 text-sm font-mono flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {selectedReport.user_id.slice(0, 8)}...
                  </p>
                </div>
              )}

              {selectedReport.card_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Card ID</p>
                  <code className="mt-1 text-sm">{selectedReport.card_id}</code>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating || selectedReport.status === 'triaged'}
                  onClick={() => handleUpdateStatus(selectedReport.id, 'triaged')}
                >
                  Mark Triaged
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  disabled={updating || selectedReport.status === 'fixed'}
                  onClick={() => handleUpdateStatus(selectedReport.id, 'fixed')}
                >
                  Mark Fixed
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={updating || selectedReport.status === 'rejected'}
                  onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
