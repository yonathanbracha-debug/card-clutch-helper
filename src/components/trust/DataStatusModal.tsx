import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAllCardRewardRules } from '@/hooks/useCardRewardRules';
import { useAllMerchantExclusions } from '@/hooks/useMerchantExclusions';
import { ReportIssueModal } from '@/components/cards/ReportIssueModal';
import { 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  Database,
  ExternalLink,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface DataStatusModalProps {
  trigger?: React.ReactNode;
}

export function DataStatusModal({ trigger }: DataStatusModalProps) {
  const { cards, loading: cardsLoading } = useCreditCards();
  const { rules, loading: rulesLoading } = useAllCardRewardRules();
  const { exclusions, loading: exclusionsLoading } = useAllMerchantExclusions();
  const [reportOpen, setReportOpen] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const verifiedCards = cards.filter(c => c.verification_status === 'verified');
    const recentlyVerified = cards.filter(c => {
      const verifiedDate = new Date(c.last_verified_at);
      return verifiedDate >= thirtyDaysAgo;
    });
    const missingFee = cards.filter(c => c.annual_fee_cents === null || c.annual_fee_cents === undefined);
    
    // Cards with at least one reward rule
    const cardsWithRules = new Set(rules.map(r => r.card_id));
    const cardsWithExclusions = new Set(exclusions.map(e => e.card_id));

    return {
      totalCards: cards.length,
      verifiedCards: verifiedCards.length,
      recentlyVerified: recentlyVerified.length,
      missingFee: missingFee.length,
      cardsWithRules: cardsWithRules.size,
      cardsWithExclusions: cardsWithExclusions.size,
      totalRules: rules.length,
      totalExclusions: exclusions.length,
    };
  }, [cards, rules, exclusions]);

  const loading = cardsLoading || rulesLoading || exclusionsLoading;

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="link" size="sm" className="text-xs text-muted-foreground h-auto p-0">
              View data status
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <DialogTitle>Data Status</DialogTitle>
            </div>
            <DialogDescription>
              CardClutch's data quality at a glance.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading data status...
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Cards Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Cards</span>
                  </div>
                  <p className="text-xl font-bold">{stats.totalCards}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Verified</span>
                  </div>
                  <p className="text-xl font-bold">{stats.verifiedCards}</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Data Coverage</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cards with reward rules</span>
                    <Badge variant="outline" className="font-mono">
                      {stats.cardsWithRules}/{stats.totalCards}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cards with exclusions documented</span>
                    <Badge variant="outline" className="font-mono">
                      {stats.cardsWithExclusions}/{stats.totalCards}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verified in last 30 days</span>
                    <Badge variant="outline" className="font-mono">
                      {stats.recentlyVerified}/{stats.totalCards}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {stats.missingFee > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {stats.missingFee} card{stats.missingFee > 1 ? 's' : ''} missing fee data
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      These will display "Unknown" until verified.
                    </p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">
                  Spot something wrong? Help us keep data accurate.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setReportOpen(true)}
                  className="w-full"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report incorrect info
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReportIssueModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        cardId="general"
        cardName="General Data Issue"
      />
    </>
  );
}
