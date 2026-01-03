import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/CardImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardRewardRules } from '@/hooks/useCardRewardRules';
import { useMerchantExclusions } from '@/hooks/useMerchantExclusions';
import { 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  Globe, 
  Gift, 
  ExternalLink,
  Clock,
  Percent
} from 'lucide-react';
import { CreditCardDB } from '@/hooks/useCreditCards';

interface CardInfoDrawerProps {
  card: CreditCardDB | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardInfoDrawer({ card, open, onOpenChange }: CardInfoDrawerProps) {
  const { rules, loading: rulesLoading } = useCardRewardRules(card?.id);
  const { exclusions, loading: exclusionsLoading } = useMerchantExclusions(card?.id);

  if (!card) return null;

  const annualFee = card.annual_fee_cents / 100;
  const verifiedDate = new Date(card.last_verified_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-start gap-4">
            <CardImage 
              issuer={card.issuer_name}
              cardName={card.name}
              network={card.network}
              imageUrl={card.image_url}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold truncate">{card.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{card.issuer_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {card.network.toUpperCase()}
                </Badge>
                <VerificationBadge 
                  status={card.verification_status === 'verified' ? 'verified' : 'unverified'} 
                  className="scale-90" 
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Annual Fee */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Annual Fee</span>
            </div>
            <p className="text-2xl font-bold">
              {annualFee === 0 ? 'Free' : `$${annualFee}/year`}
            </p>
          </div>

          {/* Reward Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Percent className="w-4 h-4 text-primary" />
              <span>Reward Summary</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {card.reward_summary}
            </p>
          </div>

          {/* Rewards Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Earning Rates</span>
            </div>
            
            {rulesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : rules.length > 0 ? (
              <div className="space-y-2">
                {rules.map(rule => (
                  <div 
                    key={rule.id} 
                    className="flex items-start justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm capitalize">{rule.category_name}</p>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      )}
                      {rule.conditions && (
                        <p className="text-xs text-amber-500">{rule.conditions}</p>
                      )}
                      {rule.cap_cents && (
                        <p className="text-xs text-muted-foreground">
                          Cap: ${rule.cap_cents / 100}/
                          {rule.cap_period === 'yearly' ? 'year' : rule.cap_period}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 font-bold">
                      {rule.multiplier}x
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No detailed reward rules available.
              </p>
            )}
          </div>

          {/* Exclusions */}
          {exclusionsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : exclusions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Merchant Exclusions</span>
              </div>
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
            </div>
          )}

          {/* Foreign Transaction Fee */}
          <div className="p-4 rounded-xl border border-border space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>Foreign Transaction Fee</span>
            </div>
            <p className="text-sm font-medium">
              {/* Default to 2.7% if not specified */}
              No foreign transaction fees
            </p>
          </div>

          {/* Credits Summary */}
          {card.reward_summary.includes('credit') && (
            <div className="p-4 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gift className="w-4 h-4" />
                <span>Card Credits</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Check card terms for available statement credits.
              </p>
            </div>
          )}

          {/* Source & Verification */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Last verified: {verifiedDate}</span>
            </div>
            <a
              href={card.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View official card terms
            </a>
          </div>

          {/* Data Integrity Warning */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-500">
              ⚠️ Reward details may change. Always verify with your card issuer before making decisions.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
