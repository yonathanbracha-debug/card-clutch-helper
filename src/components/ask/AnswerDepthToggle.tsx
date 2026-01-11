/**
 * Answer Depth Toggle - Section 1 & B1
 * Persistent answer depth selector with one-time tooltip
 * Updates user_ai_preferences.answer_depth immediately
 */
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, User, GraduationCap, Briefcase } from 'lucide-react';
import type { AnswerDepth } from '@/lib/ai/answerSchema';

const TOOLTIP_DISMISSED_KEY = 'cardclutch_depth_tooltip_dismissed';

interface DepthOption {
  value: AnswerDepth;
  label: string;
  icon: typeof User;
  description: string;
}

const DEPTH_OPTIONS: DepthOption[] = [
  { 
    value: 'beginner', 
    label: 'Beginner', 
    icon: User,
    description: 'Steps only. No jargon.' 
  },
  { 
    value: 'intermediate', 
    label: 'Intermediate', 
    icon: GraduationCap,
    description: 'Mechanics included.' 
  },
  { 
    value: 'advanced', 
    label: 'Advanced', 
    icon: Briefcase,
    description: 'Edge cases & assumptions.' 
  },
];

interface AnswerDepthToggleProps {
  value: AnswerDepth;
  onChange: (depth: AnswerDepth) => void;
  disabled?: boolean;
  /** Persist the depth to database immediately */
  onPersist?: (depth: AnswerDepth) => Promise<void>;
}

export function AnswerDepthToggle({ value, onChange, disabled, onPersist }: AnswerDepthToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(true);

  // Check if tooltip was already dismissed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
      if (!dismissed) {
        setTooltipDismissed(false);
        setShowTooltip(true);
      }
    }
  }, []);

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    setTooltipDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOOLTIP_DISMISSED_KEY, 'true');
    }
  };

  const handleChange = async (depth: AnswerDepth) => {
    onChange(depth);
    if (onPersist) {
      await onPersist(depth);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Depth:
      </span>
      
      <div className="flex items-center gap-1.5">
        {DEPTH_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleChange(option.value)}
              disabled={disabled}
              title={option.description}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className="w-3 h-3" />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* One-time tooltip */}
      {!tooltipDismissed && (
        <TooltipProvider>
          <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground" 
                onClick={handleDismissTooltip}
              >
                <Info className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs p-3">
              <div className="space-y-2">
                <p className="text-xs font-medium">Answer Depth Controls Output</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Beginner:</strong> Steps only. Max 3 steps. No jargon.</p>
                  <p><strong>Intermediate:</strong> Mechanics included. Why each step matters.</p>
                  <p><strong>Advanced:</strong> Edge cases, assumptions, and limitations.</p>
                </div>
                <button 
                  onClick={handleDismissTooltip}
                  className="text-xs text-primary hover:underline"
                >
                  Got it, don't show again
                </button>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
