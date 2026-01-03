import { useState } from 'react';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Link2,
  XCircle,
} from 'lucide-react';
import { cardCatalog } from '@/lib/cardCatalog';
import { validateCardUrls, getIssuerAllowlist } from '@/lib/cardUrlValidation';

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

interface CatalogUrlStatus {
  cardId: string;
  cardName: string;
  issuer: string;
  learnMoreUrl?: string;
  applyUrl?: string;
  learnMoreValid: boolean;
  learnMoreReason?: string;
  applyValid: boolean;
  applyReason?: string;
}

export function AdminUrlHealthChecker() {
  const { cards, loading, refetch } = useCreditCards();
  const { logEvent } = useAuditLog();
  const [issues, setIssues] = useState<UrlIssue[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogUrlStatus[]>([]);
  const [validating, setValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('database');

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

    // Validate catalog URLs
    const catalogStatuses: CatalogUrlStatus[] = cardCatalog.map(card => {
      const allowlist = card.issuerDomainAllowlist || getIssuerAllowlist(card.issuer);
      const validation = validateCardUrls(card.issuer, card.learnMoreUrl, card.applyUrl, allowlist);
      
      return {
        cardId: card.id,
        cardName: card.name,
        issuer: card.issuer,
        learnMoreUrl: card.learnMoreUrl,
        applyUrl: card.applyUrl,
        learnMoreValid: validation.learnMore.isValid,
        learnMoreReason: validation.learnMore.reason,
        applyValid: validation.apply.isValid,
        applyReason: validation.apply.reason,
      };
    });

    setIssues(foundIssues);
    setCatalogStatus(catalogStatuses);
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

  const catalogValidCount = catalogStatus.filter(s => s.learnMoreValid && s.applyValid).length;
  const catalogInvalidCount = catalogStatus.filter(s => !s.learnMoreValid || !s.applyValid).length;
  const catalogWithIssues = catalogStatus.filter(s => 
    (s.learnMoreUrl && !s.learnMoreValid) || (s.applyUrl && !s.applyValid)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">URL Health Checker</h3>
          <p className="text-sm text-muted-foreground">
            Validate card URLs for security and domain allowlist compliance
          </p>
        </div>
        <Button onClick={runValidation} disabled={loading || validating}>
          <RefreshCw className={`w-4 h-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
          {validating ? 'Validating...' : 'Validate All URLs'}
        </Button>
      </div>

      {lastValidated && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <span className="font-medium">{validCards.length}</span>
              <span className="text-muted-foreground text-sm ml-1">DB cards valid</span>
            </div>
          </div>
          {issues.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <span className="font-medium">{issues.length}</span>
                <span className="text-muted-foreground text-sm ml-1">DB issues</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-500" />
            <div>
              <span className="font-medium">{catalogValidCount}</span>
              <span className="text-muted-foreground text-sm ml-1">catalog URLs valid</span>
            </div>
          </div>
          {catalogWithIssues.length > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <span className="font-medium">{catalogWithIssues.length}</span>
                <span className="text-muted-foreground text-sm ml-1">catalog issues</span>
              </div>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="database">
            Database URLs {issues.length > 0 && <Badge variant="destructive" className="ml-2">{issues.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="catalog">
            Catalog Outbound Links {catalogWithIssues.length > 0 && <Badge variant="destructive" className="ml-2">{catalogWithIssues.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="mt-4">
          {issues.length > 0 ? (
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
          ) : lastValidated ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-foreground">All database URLs are valid!</p>
              <p className="text-sm">No issues found during validation.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Click "Validate All URLs" to check database URLs</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          {catalogWithIssues.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card</TableHead>
                    <TableHead>Learn More</TableHead>
                    <TableHead>Apply</TableHead>
                    <TableHead>Issue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogWithIssues.map((status) => (
                    <TableRow key={status.cardId}>
                      <TableCell className="font-medium">
                        {status.cardName}
                        <span className="text-muted-foreground block text-xs">
                          {status.issuer}
                        </span>
                      </TableCell>
                      <TableCell>
                        {status.learnMoreUrl ? (
                          status.learnMoreValid ? (
                            <Badge variant="outline" className="text-emerald-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Invalid
                            </Badge>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {status.applyUrl ? (
                          status.applyValid ? (
                            <Badge variant="outline" className="text-emerald-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Invalid
                            </Badge>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400 text-xs max-w-[300px]">
                        {!status.learnMoreValid && status.learnMoreReason && (
                          <div>Learn More: {status.learnMoreReason}</div>
                        )}
                        {!status.applyValid && status.applyReason && (
                          <div>Apply: {status.applyReason}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : lastValidated ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-foreground">All catalog outbound links are valid!</p>
              <p className="text-sm">{cardCatalog.length} cards validated against issuer allowlists.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Click "Validate All URLs" to check catalog Learn More and Apply links</p>
            </div>
          )}

          {lastValidated && catalogStatus.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                ℹ️ Catalog URLs are validated against issuer domain allowlists. Only https:// URLs from official issuer domains are allowed. 
                To fix issues, update the cardCatalog.ts file with correct URLs or extend the issuer allowlist in cardUrlValidation.ts.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!lastValidated && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Validate All URLs" to check all card URLs</p>
        </div>
      )}

      {lastValidated && (
        <p className="text-sm text-muted-foreground text-right">
          Last checked: {lastValidated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
