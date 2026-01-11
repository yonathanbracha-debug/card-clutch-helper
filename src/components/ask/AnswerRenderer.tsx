import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, CheckCircle, ChevronRight, Lightbulb, Info } from 'lucide-react';
import type { AnswerResponse, CalibrationQuestion } from '@/lib/ai/answerSchema';

interface AnswerRendererProps {
  response: AnswerResponse;
  onCalibrationSubmit?: (answers: Record<string, string>) => void;
  isLoading?: boolean;
}

export function AnswerRenderer({ response, onCalibrationSubmit, isLoading }: AnswerRendererProps) {
  const [calibrationAnswers, setCalibrationAnswers] = useState<Record<string, string>>({});

  // Calibration form
  if (response.calibration.needed) {
    return (
      <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <span className="font-medium">{response.top_line.one_sentence}</span>
        </div>
        <div className="space-y-3">
          {response.calibration.questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <label className="text-sm font-medium">{q.prompt}</label>
              {q.type === 'single_select' && q.options && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <Button
                      key={opt.value}
                      size="sm"
                      variant={calibrationAnswers[q.id] === opt.value ? 'default' : 'outline'}
                      onClick={() => setCalibrationAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <Button
          onClick={() => onCalibrationSubmit?.(calibrationAnswers)}
          disabled={isLoading || response.calibration.questions.filter(q => q.required).some(q => !calibrationAnswers[q.id])}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>
      </div>
    );
  }

  const { answer_depth, myth_detection, top_line, steps, mechanics, edge_cases, assumptions, disclaimers } = response;

  return (
    <div className="space-y-4">
      {/* Myth Corrections */}
      {myth_detection.corrections.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">Common Misconception Detected</p>
              {myth_detection.corrections.map((c) => (
                <p key={c.myth_id} className="text-sm text-amber-600 dark:text-amber-400">{c.correction}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Line */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-lg">{top_line.verdict}</p>
            <p className="text-sm text-muted-foreground mt-1">{top_line.one_sentence}</p>
          </div>
          <Badge variant={top_line.confidence === 'high' ? 'default' : 'secondary'}>
            {top_line.confidence} confidence
          </Badge>
        </div>
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            What to do
          </h4>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.action}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Mechanics & Edge Cases (Accordion) */}
      {(mechanics.length > 0 || edge_cases.length > 0) && (
        <Accordion type="multiple" defaultValue={answer_depth !== 'beginner' ? ['mechanics'] : []}>
          {mechanics.length > 0 && (
            <AccordionItem value="mechanics">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  How it works ({mechanics.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {mechanics.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30">
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-sm text-muted-foreground">{m.explanation}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          {edge_cases.length > 0 && (
            <AccordionItem value="edge_cases">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Edge cases ({edge_cases.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {edge_cases.map((e, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 flex items-start gap-2">
                      <Badge variant={e.risk === 'high' ? 'destructive' : e.risk === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                        {e.risk}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-sm text-muted-foreground">{e.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {/* Assumptions & Disclaimers */}
      {(assumptions.length > 0 || disclaimers.length > 0) && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          {assumptions.length > 0 && <p><strong>Assumptions:</strong> {assumptions.join('. ')}</p>}
          {disclaimers.length > 0 && <p>{disclaimers.join(' ')}</p>}
        </div>
      )}
    </div>
  );
}
