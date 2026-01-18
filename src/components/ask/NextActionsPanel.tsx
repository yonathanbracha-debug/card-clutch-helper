/**
 * Next Actions Panel - Surfaces pathway-based actions in Ask responses
 * CRITICAL for 1.1.3 Ask Page UX Upgrade
 */
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRight, Target, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NextAction {
  label: string;
  rationale?: string;
  deadline?: string;
  priority?: 'now' | 'soon' | 'later';
}

interface NextActionsPanelProps {
  immediateActions: string[];
  nextMoves: NextAction[];
  className?: string;
}

export function NextActionsPanel({ 
  immediateActions, 
  nextMoves,
  className 
}: NextActionsPanelProps) {
  if (immediateActions.length === 0 && nextMoves.length === 0) {
    return null;
  }

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'now': return <Zap className="w-3.5 h-3.5 text-primary" />;
      case 'soon': return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'later': return <Target className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'now': return 'Do now';
      case 'soon': return 'This week';
      case 'later': return 'When ready';
      default: return 'Recommended';
    }
  };

  return (
    <div className={cn(
      "p-4 rounded-xl bg-primary/5 border border-primary/20",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Next Actions
        </h4>
        <Link to="/pathway">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary/80">
            View Pathway
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* Immediate Focus */}
      {immediateActions.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
            Immediate Focus
          </p>
          <ul className="space-y-1.5">
            {immediateActions.slice(0, 2).map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Moves */}
      {nextMoves.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
            Next Moves
          </p>
          <ul className="space-y-2">
            {nextMoves.slice(0, 2).map((move, i) => (
              <li key={i} className="flex items-start gap-2">
                {getPriorityIcon(move.priority)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{move.label}</p>
                  {move.rationale && (
                    <p className="text-xs text-muted-foreground mt-0.5">{move.rationale}</p>
                  )}
                  {move.deadline && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                      <Clock className="w-2.5 h-2.5" />
                      {move.deadline}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {getPriorityLabel(move.priority)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
