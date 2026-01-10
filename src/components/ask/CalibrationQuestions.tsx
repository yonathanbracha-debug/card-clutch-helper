/**
 * Calibration Questions Component
 * Determines user experience level before first AI answer
 * Detects myths, risk tolerance, and credit understanding
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Shield,
  Sparkles,
} from 'lucide-react';

export interface CalibrationResult {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  mythFlags: string[];
  responses: Record<string, boolean>;
}

interface CalibrationQuestion {
  id: string;
  question: string;
  correctAnswer: boolean;
  mythId?: string;
  explanation: {
    correct: string;
    incorrect: string;
  };
}

const CALIBRATION_QUESTIONS: CalibrationQuestion[] = [
  {
    id: 'balance_myth',
    question: 'Carrying a small balance on your credit card helps build your score.',
    correctAnswer: false,
    mythId: 'balance_builds_credit',
    explanation: {
      correct: 'Correct. Paying in full is always better. Carrying a balance only costs you interest.',
      incorrect: 'Actually, this is a common myth. Paying in full every month is the best strategy.',
    },
  },
  {
    id: 'utilization_timing',
    question: 'Credit utilization is measured when you make a payment.',
    correctAnswer: false,
    mythId: 'payment_timing',
    explanation: {
      correct: 'Correct. Utilization is typically measured at statement close, not when you pay.',
      incorrect: 'Not quite. Most issuers report your balance at statement close, not at payment time.',
    },
  },
  {
    id: 'closing_cards',
    question: 'Closing an old credit card always hurts your credit score.',
    correctAnswer: false,
    mythId: 'closing_always_hurts',
    explanation: {
      correct: 'Correct. It depends on your overall credit mix and utilization. Sometimes it\'s fine.',
      incorrect: 'It\'s more nuanced. Closing may or may not hurt depending on your situation.',
    },
  },
  {
    id: 'hard_pull_impact',
    question: 'A single hard inquiry typically has only a minor, temporary impact on your score.',
    correctAnswer: true,
    explanation: {
      correct: 'Correct. One inquiry usually drops your score by only a few points, temporarily.',
      incorrect: 'Actually, a single hard pull is usually minor. Multiple pulls in a short time can add up.',
    },
  },
  {
    id: 'payment_history',
    question: 'Payment history is the most important factor in your credit score.',
    correctAnswer: true,
    explanation: {
      correct: 'Correct. Payment history typically accounts for about 35% of your FICO score.',
      incorrect: 'Actually, payment history is the single most weighted factor in most scoring models.',
    },
  },
];

interface CalibrationQuestionsProps {
  onComplete: (result: CalibrationResult) => void;
  onSkip?: () => void;
}

export function CalibrationQuestions({ onComplete, onSkip }: CalibrationQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<boolean | null>(null);

  const currentQuestion = CALIBRATION_QUESTIONS[currentIndex];
  const isComplete = currentIndex >= CALIBRATION_QUESTIONS.length;
  const progress = (currentIndex / CALIBRATION_QUESTIONS.length) * 100;

  const handleAnswer = (answer: boolean) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    setLastAnswer(answer);
    setShowExplanation(true);
  };

  const handleContinue = () => {
    setShowExplanation(false);
    setLastAnswer(null);
    
    if (currentIndex < CALIBRATION_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate results
      const correctCount = CALIBRATION_QUESTIONS.reduce((count, q) => {
        return count + (answers[q.id] === q.correctAnswer ? 1 : 0);
      }, 0);
      
      const mythFlags = CALIBRATION_QUESTIONS
        .filter(q => q.mythId && answers[q.id] !== q.correctAnswer)
        .map(q => q.mythId as string);

      let experienceLevel: 'beginner' | 'intermediate' | 'advanced';
      if (correctCount >= 4) {
        experienceLevel = 'advanced';
      } else if (correctCount >= 2) {
        experienceLevel = 'intermediate';
      } else {
        experienceLevel = 'beginner';
      }

      onComplete({
        experienceLevel,
        mythFlags,
        responses: answers,
      });
    }
  };

  if (isComplete) {
    return null;
  }

  const isCorrect = lastAnswer === currentQuestion.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Tuning accuracy
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Quick calibration
        </h2>
        <p className="text-sm text-muted-foreground">
          {CALIBRATION_QUESTIONS.length - currentIndex} question{CALIBRATION_QUESTIONS.length - currentIndex !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft-md">
        <AnimatePresence mode="wait">
          {!showExplanation ? (
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-lg font-medium text-foreground mb-6 leading-relaxed">
                "{currentQuestion.question}"
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-12 text-base font-medium",
                    "hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600"
                  )}
                  onClick={() => handleAnswer(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  True
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-12 text-base font-medium",
                    "hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-600"
                  )}
                  onClick={() => handleAnswer(false)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  False
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`explanation-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl mb-6",
                isCorrect 
                  ? "bg-emerald-500/10 border border-emerald-500/20" 
                  : "bg-amber-500/10 border border-amber-500/20"
              )}>
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn(
                    "text-sm font-medium mb-1",
                    isCorrect ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {isCorrect ? 'You got it!' : 'Not quite'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isCorrect 
                      ? currentQuestion.explanation.correct 
                      : currentQuestion.explanation.incorrect
                    }
                  </p>
                </div>
              </div>

              <Button
                className="w-full h-12"
                onClick={handleContinue}
              >
                {currentIndex < CALIBRATION_QUESTIONS.length - 1 ? (
                  <>
                    Next question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Start asking questions
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip option */}
      {onSkip && (
        <div className="text-center mt-6">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip calibration
          </button>
        </div>
      )}

      {/* Trust indicator */}
      <div className="flex items-center justify-center gap-2 mt-8 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5" />
        <span>Your answers help us give more relevant advice</span>
      </div>
    </motion.div>
  );
}
