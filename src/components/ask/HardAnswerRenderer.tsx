/**
 * Hard Answer Renderer - Section 9
 * Frontend Render Contract
 * Renders strictly in order: Summary, Recommended Action, Steps, Mechanics, Edge Cases, Warnings, Block Reason
 */
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Shield,
  Ban,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import type { HardAnswer } from '@/lib/ai/hardAnswerSchema';

interface HardAnswerRendererProps {
  answer: HardAnswer;
  depth: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

export function HardAnswerRenderer({ answer, depth, className }: HardAnswerRendererProps) {
  const {
    summary,
    recommended_action,
    steps,
    mechanics,
    edge_cases,
    warnings,
    confidence,
    blocked,
    block_reason,
  } = answer;

  // Blocked state - Section 6
  if (blocked) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-3">
            <Ban className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive mb-1">Blocked</p>
              <p className="text-sm text-destructive/80">{block_reason}</p>
            </div>
          </div>
        </div>
        
        {steps.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Unlock conditions:</p>
            <ul className="space-y-1">
              {steps.map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="w-3 h-3" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Confidence badge styling
  const confidenceConfig = {
    high: { variant: 'default' as const, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    medium: { variant: 'secondary' as const, className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    low: { variant: 'outline' as const, className: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Warnings - Red, non-dismissable - Section 9 */}
      {warnings && warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertOctagon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <p key={i} className="text-sm text-destructive font-medium">{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary - Always visible */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-base font-medium leading-relaxed">{summary}</p>
          </div>
          <Badge 
            variant={confidenceConfig[confidence].variant}
            className={cn("text-[10px] shrink-0", confidenceConfig[confidence].className)}
          >
            {confidence} confidence
          </Badge>
        </div>
      </div>

      {/* Recommended Action - Highlighted */}
      {recommended_action && (
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-accent uppercase tracking-wide">
              Recommended
            </span>
          </div>
          <p className="text-sm font-medium mt-2">{recommended_action}</p>
        </div>
      )}

      {/* Steps - Collapsed by default per Section 9 */}
      {steps.length > 0 && (
        <Accordion type="single" collapsible defaultValue={depth !== 'beginner' ? 'steps' : undefined}>
          <AccordionItem value="steps" className="border-none">
            <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Steps ({steps.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 pt-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <p className="text-sm pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Mechanics - Collapsed, depth-gated */}
      {mechanics && depth !== 'beginner' && (
        <Accordion type="single" collapsible defaultValue={depth === 'advanced' ? 'mechanics' : undefined}>
          <AccordionItem value="mechanics" className="border-none">
            <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                How it works
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                {mechanics}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Edge Cases - Advanced only */}
      {edge_cases && edge_cases.length > 0 && depth === 'advanced' && (
        <Accordion type="single" collapsible defaultValue="edge_cases">
          <AccordionItem value="edge_cases" className="border-none">
            <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Edge Cases ({edge_cases.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pt-2">
                {edge_cases.map((edgeCase, i) => (
                  <li key={i} className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                    • {edgeCase}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
