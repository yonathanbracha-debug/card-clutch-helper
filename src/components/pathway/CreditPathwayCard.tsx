/**
 * Credit Pathway Card Component
 * Displays user's current stage, blocked cards, and recommended next cards
 */

import { useMemo } from 'react';
import { 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Star,
  ShieldCheck,
  TrendingUp,
  Rocket,
  CreditCard,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  generateCreditPathway, 
  CreditPathway,
  CreditPathwayStage,
  STAGE_DISPLAY_NAMES,
  STAGE_DESCRIPTIONS,
  PathwayProfile
} from '@/lib/creditPathwayEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreditPathwayCardProps {
  profile: PathwayProfile;
  className?: string;
  compact?: boolean;
}

const STAGE_ICONS: Record<CreditPathwayStage, React.ReactNode> = {
  first_card: <CreditCard className="h-5 w-5" />,
  early_builder: <ShieldCheck className="h-5 w-5" />,
  established_builder: <TrendingUp className="h-5 w-5" />,
  optimizer: <Star className="h-5 w-5" />,
  advanced_optimizer: <Rocket className="h-5 w-5" />,
};

const STAGE_COLORS: Record<CreditPathwayStage, string> = {
  first_card: 'bg-slate-500',
  early_builder: 'bg-blue-500',
  established_builder: 'bg-emerald-500',
  optimizer: 'bg-amber-500',
  advanced_optimizer: 'bg-purple-500',
};

function ApprovalOddsBadge({ odds }: { odds: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'High' },
    medium: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Medium' },
    low: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Low' },
  };
  
  return (
    <Badge variant="outline" className={cn('text-xs', config[odds].color)}>
      {config[odds].label} approval
    </Badge>
  );
}

export function CreditPathwayCard({ profile, className, compact = false }: CreditPathwayCardProps) {
  const pathway = useMemo(() => generateCreditPathway(profile), [profile]);
  
  const stageIndex = ['first_card', 'early_builder', 'established_builder', 'optimizer', 'advanced_optimizer']
    .indexOf(pathway.current_stage);
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Credit Pathway</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Your personalized credit journey based on your profile. 
                  We recommend cards you're likely to be approved for.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Stage Progress */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('p-2 rounded-lg', STAGE_COLORS[pathway.current_stage])}>
              <div className="text-white">
                {STAGE_ICONS[pathway.current_stage]}
              </div>
            </div>
            <div>
              <p className="font-semibold">{STAGE_DISPLAY_NAMES[pathway.current_stage]}</p>
              <p className="text-sm text-muted-foreground">
                {STAGE_DESCRIPTIONS[pathway.current_stage]}
              </p>
            </div>
          </div>
          
          {/* Progress Track */}
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i <= stageIndex ? STAGE_COLORS[pathway.current_stage] : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Approval Constraints */}
        {pathway.approval_constraints.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Current Constraints
            </p>
            <ul className="space-y-1.5">
              {pathway.approval_constraints.slice(0, compact ? 2 : 4).map((constraint, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Recommended Cards */}
        {pathway.recommended_next_cards.length > 0 && (
          <Accordion type="single" collapsible defaultValue={compact ? undefined : "recommended"}>
            <AccordionItem value="recommended" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">Recommended Cards</span>
                  <Badge variant="secondary" className="ml-2">
                    {pathway.recommended_next_cards.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {pathway.recommended_next_cards.slice(0, compact ? 2 : 5).map((card, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-sm">{card.card_name}</p>
                          <p className="text-xs text-muted-foreground">{card.issuer}</p>
                        </div>
                        <ApprovalOddsBadge odds={card.estimated_approval_odds} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{card.reason}</p>
                      {card.prerequisites.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {card.prerequisites.map((prereq, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {prereq}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {/* Blocked Cards */}
        {pathway.blocked_cards.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="blocked" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Blocked Cards</span>
                  <Badge variant="outline" className="ml-2">
                    {pathway.blocked_cards.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {pathway.blocked_cards.map((card, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-lg border border-border bg-muted/20"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="font-medium text-sm">{card.card_name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground ml-5 mb-1">
                        {card.reason_blocked}
                      </p>
                      {card.retry_after && (
                        <p className="text-xs text-primary ml-5 flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" />
                          {card.retry_after}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {/* Timeline */}
        {!compact && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Your Timeline
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Now</p>
                  <p className="text-sm text-muted-foreground">{pathway.timeline.now}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">3-6 months</p>
                  <p className="text-sm text-muted-foreground">{pathway.timeline.next_3_6_months}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-muted mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">12 months</p>
                  <p className="text-sm text-muted-foreground">{pathway.timeline.next_12_months}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Behavior Rules */}
        {!compact && pathway.behavior_rules.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Rules to Follow
            </p>
            <ul className="space-y-1.5">
              {pathway.behavior_rules.slice(0, 4).map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CreditPathwayCard;
