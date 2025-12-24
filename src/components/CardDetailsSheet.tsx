import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardArtwork } from '@/components/CardArtwork';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Card, CardReward, formatAnnualFee, networkLabels } from '@/lib/cardCatalog';
import { CreditCardDB } from '@/hooks/useCreditCards';
import { useCardRewardRules, CardRewardRule } from '@/hooks/useCardRewardRules';
import { useMerchantExclusions } from '@/hooks/useMerchantExclusions';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  Globe, 
  Gift, 
  ExternalLink,
  Clock,
  Percent,
  Info,
  Star
} from 'lucide-react';

interface CardDetailsSheetProps {
  card: CreditCardDB | Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Type guard to check if it's a DB card
function isDBCard(card: CreditCardDB | Card): card is CreditCardDB {
  return 'issuer_name' in card;
}

export function CardDetailsSheet({ card, open, onOpenChange }: CardDetailsSheetProps) {
  // Get card ID for database lookups
  const cardId = card?.id || null;
  const { rules, loading: rulesLoading } = useCardRewardRules(cardId);
  const { exclusions, loading: exclusionsLoading } = useMerchantExclusions(cardId);

  if (!card) return null;

  // Normalize card data
  const issuer = isDBCard(card) ? card.issuer_name : card.issuer;
  const name = card.name;
  const network = card.network;
  const annualFeeCents = isDBCard(card) ? card.annual_fee_cents : card.annual_fee_cents;
  const lastVerified = isDBCard(card) 
    ? new Date(card.last_verified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : card.last_verified;
  const sourceUrl = isDBCard(card) ? card.source_url : undefined;
  const verificationStatus = isDBCard(card) ? card.verification_status : 'verified';
  
  // Get rewards and exclusions from catalog if available
  const catalogCard = isDBCard(card) ? undefined : card;
  const catalogRewards = catalogCard?.rewards || [];
  const catalogExclusions = catalogCard?.exclusions || [];
  const highlights = catalogCard?.highlights || [];
  const foreignTxFee = catalogCard?.foreign_tx_fee_percent;
  const creditsSummary = catalogCard?.credits_summary;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header with card art */}
        <div className="bg-muted/30 p-6 pb-8">
          <SheetHeader className="space-y-4">
            <div className="flex justify-center">
              <CardArtwork 
                issuer={issuer}
                cardName={name}
                network={network}
                size="lg"
                className="shadow-xl"
              />
            </div>
            <div className="text-center space-y-2">
              <SheetTitle className="text-xl font-bold">{name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{issuer}</p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {networkLabels[network as keyof typeof networkLabels] || network.toUpperCase()}
                </Badge>
                <VerificationBadge 
                  status={verificationStatus === 'verified' ? 'verified' : 'unverified'} 
                />
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="p-4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="earn" className="text-xs">Earn Rates</TabsTrigger>
            <TabsTrigger value="exclusions" className="text-xs">Exclusions</TabsTrigger>
            <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Annual Fee */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Annual Fee</span>
              </div>
              <p className="text-2xl font-bold">
                {formatAnnualFee(annualFeeCents)}
              </p>
            </div>

            {/* Foreign Transaction Fee */}
            <div className="p-4 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span>Foreign Transaction Fee</span>
              </div>
              <p className="text-sm font-medium">
                {foreignTxFee === 0 || foreignTxFee === null 
                  ? 'No foreign transaction fees' 
                  : `${foreignTxFee}%`}
              </p>
            </div>

            {/* Credits Summary */}
            {creditsSummary && (
              <div className="p-4 rounded-xl border border-border space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gift className="w-4 h-4" />
                  <span>Card Credits</span>
                </div>
                <p className="text-sm text-foreground">{creditsSummary}</p>
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star className="w-4 h-4 text-primary" />
                  <span>Best For</span>
                </div>
                <div className="space-y-2">
                  {highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Earn Rates Tab */}
          <TabsContent value="earn" className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <Percent className="w-4 h-4 text-primary" />
              <span>Earning Rates</span>
            </div>

            {/* From catalog */}
            {catalogRewards.length > 0 ? (
              <div className="space-y-2">
                {catalogRewards.map((reward, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="font-medium text-sm">{reward.category}</p>
                      {reward.notes && (
                        <p className="text-xs text-muted-foreground">{reward.notes}</p>
                      )}
                      {reward.caps && (
                        <p className="text-xs text-amber-500">{reward.caps}</p>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 font-bold ml-2">
                      {reward.multiplier}x
                    </Badge>
                  </div>
                ))}
              </div>
            ) : rulesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : rules.length > 0 ? (
              <div className="space-y-2">
                {rules.map((rule: CardRewardRule) => (
                  <div 
                    key={rule.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="font-medium text-sm capitalize">{rule.category_name}</p>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      )}
                      {rule.conditions && (
                        <p className="text-xs text-amber-500">{rule.conditions}</p>
                      )}
                      {rule.cap_cents && (
                        <p className="text-xs text-muted-foreground">
                          Cap: ${rule.cap_cents / 100}/{rule.cap_period || 'year'}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 font-bold ml-2">
                      {rule.multiplier}x
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                No detailed reward rules available.
              </p>
            )}
          </TabsContent>

          {/* Exclusions Tab */}
          <TabsContent value="exclusions" className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Merchant Exclusions</span>
            </div>

            {/* From catalog */}
            {catalogExclusions.length > 0 ? (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                  These merchants may not qualify for bonus categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {catalogExclusions.map((exc, idx) => (
                    <Badge key={idx} variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                      {exc}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : exclusionsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : exclusions.length > 0 ? (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                {exclusions.map(exc => (
                  <div key={exc.id} className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <div>
                      <span className="font-medium text-sm capitalize">{exc.merchant_pattern}</span>
                      <span className="text-xs text-muted-foreground ml-2">— {exc.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Info className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No known merchant exclusions for this card.
                </p>
              </div>
            )}

            {/* General disclaimer */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                ⚠️ Exclusions can vary. Warehouse clubs, superstores, and some online retailers often don't qualify for grocery or dining bonuses. Always verify with your issuer.
              </p>
            </div>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>Verification Sources</span>
            </div>

            <div className="space-y-4">
              {/* Last Verified */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Verified</p>
                  <p className="text-sm text-muted-foreground">{lastVerified}</p>
                </div>
              </div>

              {/* Source URL */}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors group"
                >
                  <ExternalLink className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      View Official Card Terms
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {new URL(sourceUrl).hostname}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground">
                    Source pending verification
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mt-4">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Card terms may change. Always verify current rewards, fees, and benefits with your card issuer before making decisions.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
