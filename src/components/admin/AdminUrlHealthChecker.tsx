import { useState } from 'react';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
  ExternalLink,
} from 'lucide-react';

// Issuer homepage URLs for auto-fix
const ISSUER_HOMEPAGE_URLS: Record<string, string> = {
  'American Express': 'https://www.americanexpress.com/us/credit-cards/',
  'Chase': 'https://creditcards.chase.com/',
  'Capital One': 'https://www.capitalone.com/credit-cards/',
  'Citi': 'https://www.citi.com/credit-cards/',
  'Discover': 'https://www.discover.com/credit-cards/',
  'Bank of America': 'https://www.bankofamerica.com/credit-cards/',
  'Wells Fargo': 'https://www.wellsfargo.com/credit-cards/',
  'US Bank': 'https://www.usbank.com/credit-cards/',
  'Barclays': 'https://www.barclaycardus.com/',
  'BILT': 'https://www.bilt.com/',
};

// Client-side URL validation matching the Postgres function
function isValidHttpUrl(url: string | null): boolean {
  if (!url) return true; // NULL is valid

  // Must start with http:// or https://
  if (!/^https?:\/\//i.test(url)) return false;

  // Reject dangerous schemes
  if (/(javascript:|data:|file:|vbscript:|about:)/i.test(url)) return false;

  // Basic URL structure
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

interface UrlIssue {
  card: CreditCardDB;
  field: 'source_url' | 'image_url';
  currentValue: string | null;
  suggestedFix: string | null;
  reason: string;
}

export function AdminUrlHealthChecker() {
  const { cards, loading, refetch } = useCreditCards();
  const { logEvent } = useAuditLog();
  const [issues, setIssues] = useState<UrlIssue[]>([]);
  const [validating, setValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);

  const runValidation = () => {
    setValidating(true);
    const foundIssues: UrlIssue[] = [];

    for (const card of cards) {
      // Check source_url
      if (card.source_url && !isValidHttpUrl(card.source_url)) {
        foundIssues.push({
          card,
          field: 'source_url',
          currentValue: card.source_url,
          suggestedFix: ISSUER_HOMEPAGE_URLS[card.issuer_name] || null,
          reason: 'Invalid URL format',
        });
      }

      // Check image_url
      if (card.image_url && !isValidHttpUrl(card.image_url)) {
        foundIssues.push({
          card,
          field: 'image_url',
          currentValue: card.image_url,
          suggestedFix: null, // No auto-fix for images, set to NULL
          reason: 'Invalid URL format',
        });
      }
    }

    setIssues(foundIssues);
    setLastValidated(new Date());
    setValidating(false);
  };

  const handleAutoFix = async (issue: UrlIssue) => {
    setFixingId(`${issue.card.id}-${issue.field}`);

    const updateData: Record<string, string | null> = {};

    if (issue.field === 'source_url') {
      updateData.source_url = issue.suggestedFix;
    } else {
      updateData.image_url = null; // Set invalid image_url to NULL
    }

    const { error } = await supabase
      .from('credit_cards')
      .update(updateData)
      .eq('id', issue.card.id);

    if (error) {
      toast.error(`Failed to fix URL: ${error.message}`);
    } else {
      await logEvent('ADMIN_CARD_EDIT', {
        card_id: issue.card.id,
        action: 'url_auto_fix',
        field: issue.field,
        old_value: issue.currentValue,
        new_value: updateData[issue.field],
      });
      toast.success(`URL fixed for ${issue.card.name}`);
      // Remove this issue from the list
      setIssues(prev => prev.filter(i => 
        !(i.card.id === issue.card.id && i.field === issue.field)
      ));
      refetch();
    }

    setFixingId(null);
  };

  const handleMarkVerified = async (cardId: string) => {
    const { error } = await supabase
      .from('credit_cards')
      .update({ last_verified_at: new Date().toISOString() })
      .eq('id', cardId);

    if (error) {
      toast.error('Failed to mark verified');
    } else {
      await logEvent('ADMIN_CARD_EDIT', { card_id: cardId, action: 'mark_url_verified' });
      toast.success('URL marked as verified');
      refetch();
    }
  };

  const validCards = cards.filter(card => 
    isValidHttpUrl(card.source_url) && isValidHttpUrl(card.image_url)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">URL Health Checker</h3>
          <p className="text-sm text-muted-foreground">
            Validate and fix card URLs to ensure they meet security requirements
          </p>
        </div>
        <Button onClick={runValidation} disabled={loading || validating}>
          <RefreshCw className={`w-4 h-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
          {validating ? 'Validating...' : 'Validate URLs'}
        </Button>
      </div>

      {lastValidated && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">{validCards.length} cards</span>
            <span className="text-muted-foreground">with valid URLs</span>
          </div>
          {issues.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="font-medium">{issues.length} issues</span>
              <span className="text-muted-foreground">need attention</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            Last checked: {lastValidated.toLocaleTimeString()}
          </span>
        </div>
      )}

      {issues.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Suggested Fix</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue, idx) => (
                <TableRow key={`${issue.card.id}-${issue.field}-${idx}`}>
                  <TableCell className="font-medium">
                    {issue.card.name}
                    <span className="text-muted-foreground block text-xs">
                      {issue.card.issuer_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{issue.field}</Badge>
                  </TableCell>
                  <TableCell className="text-amber-600 dark:text-amber-400">
                    {issue.reason}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs font-mono">
                    {issue.currentValue || 'NULL'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs font-mono">
                    {issue.suggestedFix || 'Set to NULL'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAutoFix(issue)}
                      disabled={fixingId === `${issue.card.id}-${issue.field}`}
                    >
                      <Wrench className="w-4 h-4 mr-1" />
                      Auto-Fix
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {lastValidated && issues.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <p className="font-medium text-foreground">All URLs are valid!</p>
          <p className="text-sm">No issues found during validation.</p>
        </div>
      )}

      {!lastValidated && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Validate URLs" to check all card URLs</p>
        </div>
      )}
    </div>
  );
}
