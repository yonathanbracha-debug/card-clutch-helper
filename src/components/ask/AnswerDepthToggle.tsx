import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { AnswerDepth } from '@/lib/ai/answerSchema';

interface AnswerDepthToggleProps {
  value: AnswerDepth;
  onChange: (depth: AnswerDepth) => void;
  disabled?: boolean;
}

export function AnswerDepthToggle({ value, onChange, disabled }: AnswerDepthToggleProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Depth:</span>
      <Select value={value} onValueChange={(v) => onChange(v as AnswerDepth)} disabled={disabled}>
        <SelectTrigger className="w-[130px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
        </SelectContent>
      </Select>
      {showTooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTooltip(false)}>
                <Info className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">
                <strong>Beginner:</strong> Steps only.<br />
                <strong>Intermediate:</strong> Mechanics included.<br />
                <strong>Advanced:</strong> Edge cases & assumptions.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
