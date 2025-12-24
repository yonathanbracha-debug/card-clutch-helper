import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CardImage } from '@/components/CardImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Check,
  ExternalLink, 
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';
import { creditCards } from '@/lib/cardData';
import { usePersistedCards } from '@/hooks/usePersistedCards';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const CardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedCards, toggleCard } = usePersistedCards();
  
  const card = creditCards.find(c => c.id === id);
  
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

  const isSelected = selectedCards.includes(card.id);

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
              issuer={card.issuer}
              cardName={card.name}
              network={card.network}
              size="lg"
              className="shrink-0"
            />
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline">{card.network.toUpperCase()}</Badge>
                  <VerificationBadge status="unverified" />
                </div>
                <h1 className="text-3xl font-bold">{card.name}</h1>
                <p className="text-lg text-muted-foreground">{card.issuer}</p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Fee</p>
                  <p className="text-2xl font-bold">
                    {card.annualFee === 0 ? 'Free' : `$${card.annualFee}`}
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

          {/* Verification Warning */}
          <Alert className="mb-8 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Data Not Verified</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              The information below has not been verified against official issuer sources. 
              Please confirm details with your card issuer before making financial decisions.
            </AlertDescription>
          </Alert>

          {/* Summary */}
          <div className="mb-8 p-4 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-2">Reward Summary</h2>
            <p className="text-muted-foreground">{card.rewardSummary}</p>
          </div>

          {/* Earning Rules */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Earning Rules</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Category</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Cap</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {card.rewards.map((reward, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium capitalize">{reward.category}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {reward.multiplier}x
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reward.cap || 'Uncapped'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reward.conditions && (
                          <span className="text-amber-500 text-sm">{reward.conditions}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Exclusions - aggregated from all rewards */}
          {(() => {
            const allExclusions = card.rewards.flatMap(r => r.exclusions || []);
            const uniqueExclusions = [...new Set(allExclusions)];
            return uniqueExclusions.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Known Exclusions
                </h2>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <p className="text-sm text-muted-foreground mb-3">
                    These merchants or categories do not earn bonus rewards on this card:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueExclusions.map((exclusion, i) => (
                      <Badge key={i} variant="outline" className="border-amber-500/50 text-amber-500">
                        {exclusion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* Notes */}
          {card.notes && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-muted-foreground" />
                Additional Notes
              </h2>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-muted-foreground">{card.notes}</p>
              </div>
            </div>
          )}

          {/* Sources */}
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Sources
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last checked: December 2024
              </p>
              <p className="text-amber-500">
                ⚠️ This data has not been verified. Please check official issuer terms.
              </p>
              <a 
                href={`https://www.${card.issuer.toLowerCase().replace(/\s+/g, '')}.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Visit issuer website
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CardDetail;