import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CardThumbnail } from '@/components/CardThumbnail';
import { cardCatalog, Card as CatalogCard } from '@/lib/cardCatalog';
import { validateUrl, ValidateUrlResult } from '@/lib/validateUrl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Link as LinkIcon,
  ImageOff,
  Clock,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  FileWarning,
  ShieldAlert
} from 'lucide-react';

interface CardIssue {
  field: string;
  type: 'error' | 'warning';
  message: string;
}

interface CardQAResult {
  card: CatalogCard;
  issues: CardIssue[];
  urlValidations: {
    learnMoreUrl: ValidateUrlResult;
    applyUrl: ValidateUrlResult;
  };
}

function validateCard(card: CatalogCard): CardQAResult {
  const issues: CardIssue[] = [];
  
  // Required field checks
  if (card.annual_fee_cents === null) {
    issues.push({ field: 'annual_fee_cents', type: 'error', message: 'Missing annual fee' });
  }
  
  if (!card.last_verified || card.last_verified.trim() === '') {
    issues.push({ field: 'last_verified', type: 'error', message: 'Missing last verified date' });
  } else {
    // Check if stale (> 90 days)
    const lastVerified = new Date(card.last_verified);
    const daysSince = Math.floor((Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 90) {
      issues.push({ field: 'last_verified', type: 'warning', message: `Stale data (${daysSince} days old)` });
    }
  }
  
  if (!card.rewards || card.rewards.length === 0) {
    issues.push({ field: 'rewards', type: 'error', message: 'No reward rules defined' });
  }
  
  if (card.needsVerification) {
    issues.push({ field: 'verification', type: 'warning', message: 'Marked as needs verification' });
  }
  
  if (card.dataConfidence === 'low') {
    issues.push({ field: 'dataConfidence', type: 'warning', message: 'Low data confidence' });
  }
  
  // URL validations
  const learnMoreUrl = validateUrl(card.learnMoreUrl);
  const applyUrl = validateUrl(card.applyUrl);
  
  if (card.learnMoreUrl && !learnMoreUrl.ok) {
    issues.push({ field: 'learnMoreUrl', type: 'error', message: learnMoreUrl.reason || 'Invalid URL' });
  }
  
  if (card.applyUrl && !applyUrl.ok) {
    issues.push({ field: 'applyUrl', type: 'error', message: applyUrl.reason || 'Invalid URL' });
  }
  
  if (!card.learnMoreUrl) {
    issues.push({ field: 'learnMoreUrl', type: 'warning', message: 'No Learn More URL' });
  }
  
  if (!card.applyUrl) {
    issues.push({ field: 'applyUrl', type: 'warning', message: 'No Apply URL' });
  }
  
  return {
    card,
    issues,
    urlValidations: { learnMoreUrl, applyUrl },
  };
}

export function AdminCatalogQA() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyIssues, setShowOnlyIssues] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [validating, setValidating] = useState(false);

  const qaResults = useMemo(() => {
    return cardCatalog.map(validateCard);
  }, []);

  const summary = useMemo(() => {
    const total = qaResults.length;
    const withErrors = qaResults.filter(r => r.issues.some(i => i.type === 'error')).length;
    const withWarnings = qaResults.filter(r => r.issues.some(i => i.type === 'warning') && !r.issues.some(i => i.type === 'error')).length;
    const healthy = total - withErrors - withWarnings;
    
    // Specific issue counts
    const missingFee = qaResults.filter(r => r.issues.some(i => i.field === 'annual_fee_cents')).length;
    const missingUrls = qaResults.filter(r => r.issues.some(i => i.field === 'learnMoreUrl' || i.field === 'applyUrl')).length;
    const staleData = qaResults.filter(r => r.issues.some(i => i.field === 'last_verified' && i.type === 'warning')).length;
    const lowConfidence = qaResults.filter(r => r.issues.some(i => i.field === 'dataConfidence')).length;
    
    return {
      total,
      withErrors,
      withWarnings,
      healthy,
      missingFee,
      missingUrls,
      staleData,
      lowConfidence,
      healthPercentage: Math.round((healthy / total) * 100),
    };
  }, [qaResults]);

  const filteredResults = useMemo(() => {
    let results = qaResults;
    
    if (showOnlyIssues) {
      results = results.filter(r => r.issues.length > 0);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(r => 
        r.card.name.toLowerCase().includes(q) ||
        r.card.issuer.toLowerCase().includes(q) ||
        r.card.id.toLowerCase().includes(q)
      );
    }
    
    // Sort by error count (most issues first)
    return results.sort((a, b) => {
      const aErrors = a.issues.filter(i => i.type === 'error').length;
      const bErrors = b.issues.filter(i => i.type === 'error').length;
      if (aErrors !== bErrors) return bErrors - aErrors;
      return b.issues.length - a.issues.length;
    });
  }, [qaResults, showOnlyIssues, searchQuery]);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRunValidation = () => {
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      toast.success(`Validated ${qaResults.length} cards`);
    }, 500);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Card ID copied');
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Catalog Health</p>
                <p className="text-2xl font-bold">{summary.healthPercentage}%</p>
                <p className="text-xs text-muted-foreground">{summary.healthy}/{summary.total} healthy</p>
              </div>
              <CheckCircle2 className={`w-8 h-8 ${summary.healthPercentage >= 90 ? 'text-emerald-500' : 'text-amber-500'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-destructive">{summary.withErrors}</p>
                <p className="text-xs text-muted-foreground">Need immediate fix</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-amber-500">{summary.withWarnings}</p>
                <p className="text-xs text-muted-foreground">Review recommended</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cards</p>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground">In local catalog</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Breakdown */}
      <div className="flex flex-wrap gap-2">
        {summary.missingFee > 0 && (
          <Badge variant="destructive" className="gap-1">
            <DollarSign className="w-3 h-3" />
            {summary.missingFee} missing fee
          </Badge>
        )}
        {summary.missingUrls > 0 && (
          <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500/50">
            <LinkIcon className="w-3 h-3" />
            {summary.missingUrls} URL issues
          </Badge>
        )}
        {summary.staleData > 0 && (
          <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500/50">
            <Clock className="w-3 h-3" />
            {summary.staleData} stale
          </Badge>
        )}
        {summary.lowConfidence > 0 && (
          <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500/50">
            <ShieldAlert className="w-3 h-3" />
            {summary.lowConfidence} low confidence
          </Badge>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant={showOnlyIssues ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowOnlyIssues(!showOnlyIssues)}
        >
          <FileWarning className="w-4 h-4 mr-2" />
          {showOnlyIssues ? 'Showing Issues Only' : 'Show All'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunValidation}
          disabled={validating}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
          Run Validation
        </Button>
        
        <Badge variant="secondary">{filteredResults.length} cards</Badge>
      </div>

      {/* Results Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-16"></TableHead>
              <TableHead>Card</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => {
              const isExpanded = expandedCards.has(result.card.id);
              const errorCount = result.issues.filter(i => i.type === 'error').length;
              const warningCount = result.issues.filter(i => i.type === 'warning').length;
              
              return (
                <Collapsible key={result.card.id} asChild open={isExpanded}>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleCard(result.card.id)}
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <CardThumbnail
                            issuer={result.card.issuer}
                            cardName={result.card.name}
                            network={result.card.network}
                            size="xs"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{result.card.name}</TableCell>
                        <TableCell className="text-muted-foreground">{result.card.issuer}</TableCell>
                        <TableCell>
                          {result.card.annual_fee_cents === null ? (
                            <Badge variant="destructive" className="text-xs">Missing</Badge>
                          ) : result.card.annual_fee_cents === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                          ) : (
                            `$${result.card.annual_fee_cents / 100}`
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              result.card.dataConfidence === 'high' 
                                ? 'border-emerald-500/50 text-emerald-600' 
                                : result.card.dataConfidence === 'medium'
                                ? 'border-amber-500/50 text-amber-600'
                                : 'border-destructive/50 text-destructive'
                            }
                          >
                            {result.card.dataConfidence}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.issues.length === 0 ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Healthy
                            </Badge>
                          ) : (
                            <div className="flex gap-1">
                              {errorCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              {warningCount > 0 && (
                                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyId(result.card.id);
                            }}
                            title="Copy card ID"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={`/cards/${result.card.id}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={8} className="p-4">
                          <div className="space-y-4">
                            {/* Issues List */}
                            {result.issues.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  Issues Found
                                </h4>
                                <div className="grid gap-2">
                                  {result.issues.map((issue, idx) => (
                                    <div 
                                      key={idx}
                                      className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                                        issue.type === 'error' 
                                          ? 'bg-destructive/10 text-destructive' 
                                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      }`}
                                    >
                                      {issue.type === 'error' ? (
                                        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                      ) : (
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                      )}
                                      <div>
                                        <span className="font-medium">{issue.field}:</span>{' '}
                                        <span>{issue.message}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* URL Status */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Learn More URL</p>
                                {result.card.learnMoreUrl ? (
                                  result.urlValidations.learnMoreUrl.ok ? (
                                    <a 
                                      href={result.card.learnMoreUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                      Valid
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-destructive flex items-center gap-1">
                                      <XCircle className="w-3 h-3" />
                                      {result.urlValidations.learnMoreUrl.reason}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Not set</span>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Apply URL</p>
                                {result.card.applyUrl ? (
                                  result.urlValidations.applyUrl.ok ? (
                                    <a 
                                      href={result.card.applyUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                      Valid
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-destructive flex items-center gap-1">
                                      <XCircle className="w-3 h-3" />
                                      {result.urlValidations.applyUrl.reason}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Not set</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Card ID for reference */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>ID:</span>
                              <code className="bg-muted px-1.5 py-0.5 rounded">{result.card.id}</code>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {filteredResults.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">All Clear!</h3>
          <p className="text-sm text-muted-foreground">
            {showOnlyIssues ? 'No issues found in the catalog.' : 'No cards match your search.'}
          </p>
        </div>
      )}
    </div>
  );
}
