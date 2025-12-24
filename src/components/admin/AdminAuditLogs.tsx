import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Search, Clock, User } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_user_id: string | null;
  event_type: string;
  event_payload: unknown;
  created_at: string;
}

const EVENT_TYPES = [
  'ROLE_CHANGE',
  'CARD_ADDED',
  'CARD_REMOVED',
  'PREFERENCE_UPDATE',
  'ADMIN_CARD_EDIT',
  'ADMIN_CARD_CREATE',
  'ADMIN_CARD_DELETE',
  'ADMIN_MERCHANT_EDIT',
  'ADMIN_MERCHANT_CREATE',
  'ADMIN_MERCHANT_DELETE',
  'ADMIN_RULE_EDIT',
  'ADMIN_RULE_CREATE',
  'ADMIN_RULE_DELETE',
];

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch audit logs:', error);
      } else {
        setLogs(data || []);
      }
      setLoading(false);
    }

    fetchLogs();
  }, [eventTypeFilter]);

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType.startsWith('ADMIN_')) return 'default';
    if (eventType === 'ROLE_CHANGE') return 'destructive';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {EVENT_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{logs.length} events</Badge>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => {
                const date = new Date(log.created_at);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>{date.toLocaleDateString()}</span>
                        <span className="text-muted-foreground">{date.toLocaleTimeString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEventBadgeVariant(log.event_type)}>
                        {log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span className="font-mono text-xs">
                          {log.actor_user_id?.slice(0, 8) || 'System'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs text-muted-foreground max-w-md truncate">
                        {JSON.stringify(log.event_payload)}
                      </pre>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
