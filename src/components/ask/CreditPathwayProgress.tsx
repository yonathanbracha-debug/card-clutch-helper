/**
 * Credit Pathway UI - Visual Progression Map
 * Shows user's current stage, unlock conditions, and blocked actions
 * Section 9: Frontend Render Contract
 */
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Shield,
  TrendingUp,
  Rocket
} from 'lucide-react';
import type { CreditStage, CreditState } from '@/hooks/useCreditProfile';

interface StageConfig {
  id: CreditStage;
  label: string;
  description: string;
  icon: typeof Shield;
  unlockConditions: string[];
}

const STAGES: StageConfig[] = [
  {
    id: 'starter',
    label: 'Starter',
    description: 'Building foundation',
    icon: Shield,
    unlockConditions: ['Sign up', 'Complete onboarding'],
  },
  {
    id: 'builder',
    label: 'Builder',
    description: 'Establishing credit habits',
    icon: TrendingUp,
    unlockConditions: ['Pay in full', 'No BNPL reliance', 'Age 21+'],
  },
  {
    id: 'optimizer',
    label: 'Optimizer',
    description: 'Maximizing rewards safely',
    icon: Sparkles,
    unlockConditions: ['Advanced knowledge', 'No balance carrying', 'Stable utilization'],
  },
  {
    id: 'advanced_optimizer',
    label: 'Advanced',
    description: 'Full strategy access',
    icon: Rocket,
    unlockConditions: ['Expert-level knowledge', 'Clean credit history', 'High income verified'],
  },
];

const STAGE_ORDER: CreditStage[] = ['starter', 'builder', 'optimizer', 'advanced_optimizer'];

interface CreditPathwayProgressProps {
  creditState: CreditState | null;
  className?: string;
}

export function CreditPathwayProgress({ creditState, className }: CreditPathwayProgressProps) {
  const currentStage = creditState?.stage || 'starter';
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const suppressionFlags = creditState?.suppression_flags || [];

  const getBlockedReasons = () => {
    const reasons: string[] = [];
    if (suppressionFlags.includes('balance_carrier')) {
      reasons.push('Carrying a balance blocks rewards optimization');
    }
    if (suppressionFlags.includes('high_bnpl_usage')) {
      reasons.push('High BNPL usage restricts premium card access');
    }
    if (suppressionFlags.includes('age_restriction')) {
      reasons.push('Age restriction limits available features');
    }
    if (suppressionFlags.includes('suppress_rewards_optimization')) {
      reasons.push('Pay off balances to unlock rewards strategies');
    }
    return reasons;
  };

  const blockedReasons = getBlockedReasons();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Track */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {/* Stage Nodes */}
        <div className="relative flex justify-between">
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLocked = index > currentIndex;
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id}
                className="flex flex-col items-center"
              >
                {/* Node */}
                <div
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isLocked && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Details */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          {(() => {
            const currentConfig = STAGES.find(s => s.id === currentStage);
            const Icon = currentConfig?.icon || Shield;
            return <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />;
          })()}
          <div className="flex-1">
            <p className="font-medium text-sm">
              {STAGES.find(s => s.id === currentStage)?.label} Stage
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {STAGES.find(s => s.id === currentStage)?.description}
            </p>
            
            {/* Max Tier Badge */}
            {creditState && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  Max Card Tier: {creditState.max_allowed_card_tier}
                </Badge>
                <Badge 
                  variant={creditState.risk_ceiling === 'low' ? 'secondary' : 'outline'} 
                  className="text-[10px]"
                >
                  Risk: {creditState.risk_ceiling}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unlock Conditions for Next Stage */}
      {currentIndex < STAGES.length - 1 && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Unlock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Unlock {STAGES[currentIndex + 1].label}
            </span>
          </div>
          <ul className="space-y-1">
            {STAGES[currentIndex + 1].unlockConditions.map((condition, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                {condition}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blocked Actions */}
      {blockedReasons.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Blocked Actions
            </span>
          </div>
          <ul className="space-y-1">
            {blockedReasons.map((reason, i) => (
              <li key={i} className="text-xs text-amber-600/80 dark:text-amber-400/80">
                • {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
