import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CardImage } from '@/components/CardImage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ImageOff,
  Clock,
  DollarSign,
  Check
} from 'lucide-react';

interface CardHealth {
  id: string;
  name: string;
  issuer_name: string;
  network: string;
  annual_fee_cents: number;
  last_verified_at: string;
  image_url: string | null;
  source_url: string;
  issues: string[];
}

interface HealthSummary {
  totalCards: number;
  cardsFullyComplete: number;
  cardsMissingFee: number;
  cardsStale: number;
  cardsBrokenImage: number;
  healthPercentage: number;
}

export function AdminDataHealth() {
  const [cards, setCards] = useState<CardHealth[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select(`
          id,
          name,
          network,
          annual_fee_cents,
          last_verified_at,
          image_url,
          source_url,
          issuers!inner(name)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const processed: CardHealth[] = (data || []).map(card => {
        const issues: string[] = [];
        const lastVerified = new Date(card.last_verified_at);
        
        if (lastVerified < thirtyDaysAgo) {
          issues.push('stale');
        }
        if (!card.image_url) {
          issues.push('no_image');
        }
        
        return {
          id: card.id,
          name: card.name,
          issuer_name: (card.issuers as any)?.name || 'Unknown',
          network: card.network,
          annual_fee_cents: card.annual_fee_cents,
          last_verified_at: card.last_verified_at,
          image_url: card.image_url,
          source_url: card.source_url,
          issues,
        };
      });

      setCards(processed);
      
      // Calculate summary
      const totalCards = processed.length;
      const cardsStale = processed.filter(c => c.issues.includes('stale')).length;
      const cardsBrokenImage = processed.filter(c => c.issues.includes('no_image')).length;
      const cardsFullyComplete = processed.filter(c => c.issues.length === 0).length;

      setSummary({
        totalCards,
        cardsFullyComplete,
        cardsMissingFee: 0, // All cards should have fee
        cardsStale,
        cardsBrokenImage,
        healthPercentage: totalCards > 0 ? Math.round((cardsFullyComplete / totalCards) * 100) : 100,
      });
    } catch (err) {
      console.error('Failed to fetch cards:', err);
      toast.error('Failed to load data health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleMarkVerified = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('credit_cards')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('id', cardId);

      if (error) throw error;
      toast.success('Card marked as verified');
      fetchCards();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleImageError = (cardId: string) => {
    setImageErrors(prev => new Set(prev).add(cardId));
  };

  const filteredCards = cards.filter(card => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      card.name.toLowerCase().includes(q) ||
      card.issuer_name.toLowerCase().includes(q)
    );
  });

  // Show cards with issues first
  const sortedCards = [...filteredCards].sort((a, b) => {
    const aHasIssues = a.issues.length > 0 || imageErrors.has(a.id);
    const bHasIssues = b.issues.length > 0 || imageErrors.has(b.id);
    if (aHasIssues && !bHasIssues) return -1;
    if (!aHasIssues && bHasIssues) return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold">{summary.healthPercentage}%</p>
                  <p className="text-xs text-muted-foreground">{summary.cardsFullyComplete}/{summary.totalCards} complete</p>
                </div>
                <CheckCircle2 className={`w-8 h-8 ${summary.healthPercentage >= 90 ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stale Cards</p>
                  <p className="text-2xl font-bold">{summary.cardsStale}</p>
                  <p className="text-xs text-muted-foreground">Not verified in 30+ days</p>
                </div>
                <Clock className={`w-8 h-8 ${summary.cardsStale === 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Missing Images</p>
                  <p className="text-2xl font-bold">{summary.cardsBrokenImage + imageErrors.size}</p>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </div>
                <ImageOff className={`w-8 h-8 ${summary.cardsBrokenImage + imageErrors.size === 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cards</p>
                  <p className="text-2xl font-bold">{summary.totalCards}</p>
                  <p className="text-xs text-muted-foreground">In catalog</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{sortedCards.length} cards</Badge>
      </div>

      {/* Cards Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Card Name</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Annual Fee</TableHead>
              <TableHead>Last Verified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCards.map(card => {
              const hasImageError = imageErrors.has(card.id);
              const allIssues = [...card.issues, ...(hasImageError ? ['broken_image'] : [])];
              const daysSinceVerified = Math.floor(
                (Date.now() - new Date(card.last_verified_at).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="relative">
                      <CardImage
                        issuer={card.issuer_name}
                        cardName={card.name}
                        network={card.network}
                        size="sm"
                        onError={() => handleImageError(card.id)}
                      />
                      {hasImageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded">
                          <ImageOff className="w-3 h-3 text-destructive" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell className="text-muted-foreground">{card.issuer_name}</TableCell>
                  <TableCell>
                    {card.annual_fee_cents === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                    ) : (
                      `$${card.annual_fee_cents / 100}/yr`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <span className={daysSinceVerified > 30 ? 'text-amber-500' : 'text-muted-foreground'}>
                        {daysSinceVerified}d ago
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {allIssues.length === 0 ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Healthy
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {allIssues.includes('stale') && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                            <Clock className="w-3 h-3 mr-1" />
                            Stale
                          </Badge>
                        )}
                        {(allIssues.includes('no_image') || allIssues.includes('broken_image')) && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                            <ImageOff className="w-3 h-3 mr-1" />
                            Image
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkVerified(card.id)}
                      title="Mark as verified"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
