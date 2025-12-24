import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Plus, 
  Check,
  ExternalLink, 
  AlertTriangle,
  Info,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useCardRewardRules } from '@/hooks/useCardRewardRules';
import { useMerchantExclusions } from '@/hooks/useMerchantExclusions';
import { useWalletCards } from '@/hooks/useWalletCards';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { cards, loading: cardsLoading } = useCreditCards();
  const { rules, loading: rulesLoading } = useCardRewardRules(id);
  const { exclusions, loading: exclusionsLoading } = useMerchantExclusions(id);
  const { selectedCardIds, toggleCard } = useWalletCards();
  
  const card = cards.find(c => c.id === id);
  const isSelected = card ? selectedCardIds.includes(card.id) : false;
  const isLoading = cardsLoading || rulesLoading || exclusionsLoading;

  if (cardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container max-w-4xl mx-auto px-4">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <Skeleton className="w-48 h-32" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!card) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-4">Card Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The card you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/cards">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Card Library
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const annualFee = card.annual_fee_cents / 100;
  const verifiedDate = new Date(card.last_verified_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Aggregate exclusions from rules
  const allExclusions = rules.flatMap(r => r.exclusions || []);
  const uniqueExclusions = [...new Set(allExclusions)];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <Link 
            to="/cards" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Card Library
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <CardImage 
              issuer={card.issuer_name}
              cardName={card.name}
              network={card.network}
              size="lg"
              className="shrink-0"
            />
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline">{card.network.toUpperCase()}</Badge>
                  <VerificationBadge 
                    status={card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                  />
                </div>
                <h1 className="text-3xl font-bold">{card.name}</h1>
                <p className="text-lg text-muted-foreground">{card.issuer_name}</p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Fee</p>
                  <p className="text-2xl font-bold">
                    {annualFee === 0 ? 'Free' : `$${annualFee}/year`}
                  </p>
                </div>
                <Button
                  onClick={() => toggleCard(card.id)}
                  variant={isSelected ? "secondary" : "default"}
                  className="gap-2"
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" />
                      In My Wallet
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to Wallet
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-8 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Reward Summary</h2>
            </div>
            <p className="text-muted-foreground">{card.reward_summary}</p>
          </div>

          {/* Earning Rules */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Earning Rates
            </h2>
            
            {rulesLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : rules.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Category</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Cap</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium capitalize">
                          {rule.category_name}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {rule.multiplier}x
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rule.cap_cents 
                            ? `$${(rule.cap_cents / 100).toLocaleString()}/${rule.cap_period || 'period'}`
                            : 'Uncapped'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rule.conditions && (
                            <span className="text-amber-500 text-sm">{rule.conditions}</span>
                          )}
                          {rule.description && !rule.conditions && (
                            <span className="text-sm">{rule.description}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-border text-center text-muted-foreground">
                <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>No detailed earning rules available.</p>
                <p className="text-sm mt-1">See reward summary above for general information.</p>
              </div>
            )}
          </div>

          {/* Exclusions */}
          {(uniqueExclusions.length > 0 || exclusions.length > 0) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Known Exclusions
              </h2>
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <p className="text-sm text-muted-foreground mb-3">
                  These merchants or categories do not earn bonus rewards on this card:
                </p>
                <div className="space-y-2">
                  {/* From merchant_exclusions table */}
                  {exclusions.map((exc) => (
                    <div key={exc.id} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium capitalize">{exc.merchant_pattern}</span>
                        <span className="text-sm text-muted-foreground ml-2">— {exc.reason}</span>
                      </div>
                    </div>
                  ))}
                  {/* From rule exclusions array */}
                  {uniqueExclusions.length > 0 && exclusions.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uniqueExclusions.map((exclusion, i) => (
                        <Badge key={i} variant="outline" className="border-amber-500/50 text-amber-500">
                          {exclusion}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sources */}
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Source Information
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last verified: {verifiedDate}
              </p>
              <a 
                href={card.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                View official card terms
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Data integrity check warning */}
          {card.name.toLowerCase().includes('gold') && 
           card.issuer_name.toLowerCase().includes('american express') && 
           card.annual_fee_cents === 25000 && (
            <div className="mt-6 p-4 rounded-xl border border-red-500/50 bg-red-500/10">
              <p className="text-sm text-red-500 font-medium">
                ⚠️ Data integrity issue: This card shows $250/year but should be $325/year. 
                Please report this issue.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CardDetail;
