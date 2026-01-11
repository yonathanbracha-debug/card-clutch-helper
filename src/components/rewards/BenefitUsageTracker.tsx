/**
 * Benefit Usage Tracker Component
 * Track and display card benefit usage with calm, informative design
 */

import { useState, useEffect } from 'react';
import { Gift, Check, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BENEFIT_RULES, BenefitRule } from '@/lib/benefitRules';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface BenefitUsage {
  id: string;
  benefit_id: string;
  card_name: string;
  issuer: string;
  period_start: string;
  period_end: string;
  value_usd: number;
  used_amount: number;
  usage_count: number;
  status: 'available' | 'partial' | 'claimed' | 'expired';
}

interface BenefitUsageTrackerProps {
  walletCards?: Array<{ issuer: string; card_name: string }>;
  className?: string;
  compact?: boolean;
}

export function BenefitUsageTracker({ 
  walletCards = [], 
  className,
  compact = false 
}: BenefitUsageTrackerProps) {
  const { user } = useAuth();
  const [benefitUsage, setBenefitUsage] = useState<BenefitUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  // Get applicable benefits based on user's wallet
  const applicableBenefits = BENEFIT_RULES.filter(rule =>
    walletCards.some(
      card =>
        card.issuer.toLowerCase().includes(rule.issuer.toLowerCase()) ||
        card.card_name.toLowerCase().includes(rule.card_name.toLowerCase())
    )
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchBenefitUsage();
  }, [user]);

  async function fetchBenefitUsage() {
    if (!user) return;
    
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('benefit_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_end', monthStart.toISOString());
      
      if (error) throw error;
      setBenefitUsage(data as BenefitUsage[] || []);
    } catch (err) {
      console.error('Error fetching benefit usage:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markBenefitUsed(benefit: BenefitRule, amountUsed?: number) {
    if (!user) return;
    
    const now = new Date();
    const periodStart = benefit.cadence === 'monthly' 
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);
    const periodEnd = benefit.cadence === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : new Date(now.getFullYear(), 11, 31);
    
    const amount = amountUsed || benefit.value_usd;
    
    try {
      const { error } = await supabase
        .from('benefit_usage')
        .upsert({
          user_id: user.id,
          benefit_id: benefit.benefit_id,
          card_name: benefit.card_name,
          issuer: benefit.issuer,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          value_usd: benefit.value_usd,
          used_amount: amount,
          usage_count: 1,
          status: amount >= benefit.value_usd ? 'claimed' : 'partial',
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,benefit_id,period_start',
        });
      
      if (error) throw error;
      fetchBenefitUsage();
    } catch (err) {
      console.error('Error marking benefit used:', err);
    }
  }

  function getBenefitStatus(benefit: BenefitRule): { 
    status: 'available' | 'partial' | 'claimed' | 'expired';
    usedAmount: number;
    daysRemaining: number;
  } {
    const now = new Date();
    const usage = benefitUsage.find(u => u.benefit_id === benefit.benefit_id);
    
    // Calculate days remaining in period
    let periodEnd: Date;
    if (benefit.cadence === 'monthly') {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      periodEnd = new Date(now.getFullYear(), 11, 31);
    }
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (!usage) {
      return { status: 'available', usedAmount: 0, daysRemaining };
    }
    
    return {
      status: usage.status as 'available' | 'partial' | 'claimed' | 'expired',
      usedAmount: usage.used_amount,
      daysRemaining,
    };
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return 'text-primary';
      case 'partial': return 'text-amber-500';
      case 'expired': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'claimed': return <Check className="h-4 w-4" />;
      case 'partial': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  // Calculate summary stats
  const totalAvailable = applicableBenefits
    .filter(b => b.cadence === 'monthly')
    .reduce((sum, b) => {
      const { status, usedAmount } = getBenefitStatus(b);
      if (status === 'claimed') return sum;
      return sum + (b.value_usd - usedAmount);
    }, 0);

  const totalClaimed = benefitUsage
    .filter(u => u.status === 'claimed' || u.status === 'partial')
    .reduce((sum, u) => sum + u.used_amount, 0);

  if (!user) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 text-center">
          <Gift className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Sign in to track your card benefits
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn('overflow-hidden animate-pulse', className)}>
        <CardContent className="p-6">
          <div className="h-4 w-32 bg-muted rounded mb-4" />
          <div className="h-8 w-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (applicableBenefits.length === 0) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 text-center">
          <Gift className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No trackable benefits found for your cards
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <Card className={cn('overflow-hidden', className)}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Benefits Available</p>
                  <p className="text-xs text-muted-foreground">
                    ${totalAvailable.toFixed(0)} this month
                  </p>
                </div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 px-4 pb-4 space-y-3">
              {applicableBenefits.filter(b => b.cadence === 'monthly').slice(0, 3).map(benefit => {
                const { status, usedAmount, daysRemaining } = getBenefitStatus(benefit);
                const progress = (usedAmount / benefit.value_usd) * 100;
                
                return (
                  <div key={benefit.benefit_id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{benefit.title}</span>
                      <span className={cn("flex items-center gap-1", getStatusColor(status))}>
                        {getStatusIcon(status)}
                        ${usedAmount.toFixed(0)}/${benefit.value_usd}
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    {status === 'available' && daysRemaining <= 7 && (
                      <p className="text-xs text-amber-500">
                        {daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Benefit Tracker
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-semibold text-foreground">${totalAvailable.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">available this month</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Benefits */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Monthly Credits
          </p>
          {applicableBenefits.filter(b => b.cadence === 'monthly').map(benefit => {
            const { status, usedAmount, daysRemaining } = getBenefitStatus(benefit);
            const progress = (usedAmount / benefit.value_usd) * 100;
            
            return (
              <div 
                key={benefit.benefit_id} 
                className="p-4 rounded-xl bg-muted/50 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">{benefit.card_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-medium flex items-center gap-1 justify-end", getStatusColor(status))}>
                      {getStatusIcon(status)}
                      ${usedAmount.toFixed(0)} / ${benefit.value_usd}
                    </p>
                    {status !== 'claimed' && (
                      <p className="text-xs text-muted-foreground">
                        {daysRemaining} days left
                      </p>
                    )}
                  </div>
                </div>
                
                <Progress value={progress} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {benefit.notes}
                  </p>
                  {status !== 'claimed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => markBenefitUsed(benefit)}
                      className="text-xs"
                    >
                      Mark Used
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Annual Benefits */}
        {applicableBenefits.some(b => b.cadence === 'annual') && (
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Annual Credits
            </p>
            {applicableBenefits.filter(b => b.cadence === 'annual').map(benefit => {
              const { status, usedAmount } = getBenefitStatus(benefit);
              const progress = (usedAmount / benefit.value_usd) * 100;
              
              return (
                <div 
                  key={benefit.benefit_id} 
                  className="p-4 rounded-xl bg-muted/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground">{benefit.card_name}</p>
                    </div>
                    <p className={cn("font-medium flex items-center gap-1", getStatusColor(status))}>
                      {getStatusIcon(status)}
                      ${usedAmount.toFixed(0)} / ${benefit.value_usd}
                    </p>
                  </div>
                  
                  <Progress value={progress} className="h-2" />
                  
                  {status !== 'claimed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => markBenefitUsed(benefit)}
                      className="text-xs"
                    >
                      Mark Used
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            All insights are based solely on your data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default BenefitUsageTracker;
