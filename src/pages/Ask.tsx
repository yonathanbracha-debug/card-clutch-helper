/**
 * Ask Page - Credit Q&A
 * Trust-first, calm experience for credit questions
 * CardClutch Vertical AI System
 * 
 * Updated 2026-01-11: Hard output schema + Credit Onboarding integration
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { DemoLimitModal } from '@/components/DemoLimitModal';
import { CreditOnboardingModal } from '@/components/CreditOnboardingModal';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';
import { CalibrationQuestions, CalibrationResult } from '@/components/ask/CalibrationQuestions';
import { AnswerRenderer } from '@/components/ask/AnswerRenderer';
import { AnswerDepthToggle } from '@/components/ask/AnswerDepthToggle';
import { CreditPathwayProgress } from '@/components/ask/CreditPathwayProgress';
import { AskAiResponseSchema, type AskAiResponse } from '@/lib/askAiSchema';
import { AnswerSchema as NewAnswerSchemaValidator, type AnswerResponse as NewAnswerSchema } from '@/lib/ai/answerSchema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences, ExperienceLevel } from '@/hooks/useUserPreferences';
import { useCreditProfile } from '@/hooks/useCreditProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ChevronDown, 
  ExternalLink,
  AlertCircle,
  Loader2,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Zap,
  Cog,
  ListChecks,
  AlertOctagon,
  User,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

const ASK_DEMO_KEY = 'cardclutch_ask_demo';
const MAX_ASK_DEMO = 3;

// Local storage keys for guest users
const GUEST_EXPERIENCE_KEY = 'cardclutch_guest_experience';
const GUEST_CALIBRATION_KEY = 'cardclutch_guest_calibration';
const GUEST_MYTH_FLAGS_KEY = 'cardclutch_guest_myth_flags';

type AnswerMode = 'quick' | 'mechanics' | 'action' | 'risk';
type AnswerDepth = 'beginner' | 'intermediate' | 'advanced';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AskAiResponse;
  newSchemaResponse?: NewAnswerSchema;
  timestamp: Date;
  isError?: boolean;
  isOnboardingRequired?: boolean;
}

// Answer Mode configurations
const ANSWER_MODES: { id: AnswerMode; label: string; icon: typeof Zap; description: string }[] = [
  { id: 'quick', label: 'Quick', icon: Zap, description: 'Direct answer' },
  { id: 'mechanics', label: 'Mechanics', icon: Cog, description: 'How it works' },
  { id: 'action', label: 'Steps', icon: ListChecks, description: 'What to do' },
  { id: 'risk', label: 'Risk', icon: AlertOctagon, description: 'Full breakdown' },
];

// Experience Level configurations
const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; icon: typeof User }[] = [
  { id: 'beginner', label: 'Beginner', icon: User },
  { id: 'intermediate', label: 'Intermediate', icon: GraduationCap },
  { id: 'advanced', label: 'Advanced', icon: Briefcase },
];

// Score Impact Badge Component
function ScoreImpactBadge({ shortTerm, longTerm }: { shortTerm: string; longTerm: string }) {
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'help': return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
      case 'hurt': return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
      case 'neutral': return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };
  
  const formatImpact = (impact: string) => {
    switch (impact) {
      case 'help': return 'Helps';
      case 'hurt': return 'Hurts';
      case 'neutral': return 'Neutral';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3 h-3" />
        Short: {formatImpact(shortTerm)}
        {getImpactIcon(shortTerm)}
      </span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        Long: {formatImpact(longTerm)}
        {getImpactIcon(longTerm)}
      </span>
    </div>
  );
}

// Confidence Badge Component  
function ConfidenceBadge({ level, score }: { level: string; score: number }) {
  const config: Record<string, { icon: typeof CheckCircle2; className: string }> = {
    high: { icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10' },
    medium: { icon: Shield, className: 'text-amber-600 bg-amber-500/10' },
    low: { icon: XCircle, className: 'text-muted-foreground bg-muted' },
  };
  
  const { icon: Icon, className } = config[level] || config.low;
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", className)}>
      <Icon className="w-3.5 h-3.5" />
      {Math.round(score * 100)}% confident
    </span>
  );
}

// Route Badge Component
function RouteBadge({ route }: { route: string }) {
  const config: Record<string, { label: string; className: string }> = {
    deterministic: { label: 'Verified', className: 'text-emerald-600 bg-emerald-500/10' },
    rag: { label: 'AI-assisted', className: 'text-blue-600 bg-blue-500/10' },
    hybrid: { label: 'Hybrid', className: 'text-purple-600 bg-purple-500/10' },
    error: { label: 'Error', className: 'text-destructive bg-destructive/10' },
  };
  
  const { label, className } = config[route] || { label: route, className: 'text-muted-foreground bg-muted' };
  
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono", className)}>
      {label}
    </span>
  );
}

// Myth Warning Component
function MythWarning({ label, correction }: { label: string | null; correction: string | null }) {
  if (!correction) return null;
  
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-4">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
          Common Misconception{label ? `: ${label}` : ''}
        </p>
        <p className="text-sm text-muted-foreground">
          {correction}
        </p>
      </div>
    </div>
  );
}

// Answer Section Renderer - handles the new schema structure
function AnswerSection({ response, experienceLevel }: { response: AskAiResponse; experienceLevel: ExperienceLevel }) {
  const [showDetailed, setShowDetailed] = useState(false);

  // For beginners: show only TL;DR and action items
  // For intermediate: show short answer
  // For advanced: show everything
  const showActionItems = response.answer.action_items.length > 0;
  const showPitfalls = response.answer.pitfalls.length > 0 && experienceLevel !== 'beginner';
  const showDetailedToggle = response.answer.detailed && response.answer.detailed !== response.answer.short && experienceLevel !== 'beginner';

  return (
    <div className="space-y-4">
      {/* TL;DR - always shown */}
      <div className="text-sm leading-relaxed font-medium">
        {response.answer.tl_dr}
      </div>

      {/* Short answer - shown for intermediate/advanced */}
      {experienceLevel !== 'beginner' && response.answer.short !== response.answer.tl_dr && (
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {response.answer.short}
        </div>
      )}

      {/* Action Items */}
      {showActionItems && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What to do</p>
          <ul className="space-y-1.5">
            {response.answer.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pitfalls */}
      {showPitfalls && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Watch out for</p>
          <ul className="space-y-1.5">
            {response.answer.pitfalls.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed (collapsible) */}
      {showDetailedToggle && (
        <Collapsible open={showDetailed} onOpenChange={setShowDetailed}>
          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={cn("w-4 h-4 transition-transform", showDetailed && "rotate-180")} />
            {showDetailed ? 'Hide' : 'Show'} full explanation
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {response.answer.detailed}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Score Impact */}
      {experienceLevel !== 'beginner' && (
        <div className="pt-3 border-t border-border">
          <ScoreImpactBadge 
            shortTerm={response.score_impact.short_term} 
            longTerm={response.score_impact.long_term} 
          />
          {response.score_impact.notes && (
            <p className="text-xs text-muted-foreground mt-1">{response.score_impact.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Citations Section
function CitationsSection({ citations, messageId }: { citations: AskAiResponse['citations']; messageId: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="border-t border-border pt-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", expanded && "rotate-180")} />
        {expanded ? 'Hide' : 'Show'} sources ({citations.length})
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {citations.map((citation, i) => (
              citation.url ? (
                <a
                  key={i}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{citation.title}</span>
                </a>
              ) : (
                <span key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span className="truncate">{citation.title}</span>
                </span>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Rate Limit Display
function RateLimitIndicator({ metrics }: { metrics: AskAiResponse['metrics'] }) {
  const ipRemaining = metrics.rate_limit.ip.remaining;
  const ipLimit = metrics.rate_limit.ip.limit;
  const userRemaining = metrics.rate_limit.user?.remaining ?? null;
  
  if (ipRemaining > ipLimit * 0.5) return null; // Only show when running low
  
  return (
    <div className="text-xs text-muted-foreground/70 font-mono">
      {userRemaining !== null ? `${userRemaining} requests remaining` : `${ipRemaining}/${ipLimit} remaining`}
    </div>
  );
}

interface AskDemoState {
  count: number;
}

const EXAMPLE_PROMPTS = [
  "How does credit utilization affect my score?",
  "When should I pay my balance to avoid interest?",
  "What's the difference between a hard and soft credit pull?",
  "Should I close old credit cards I don't use?",
];

export default function Ask() {
  const { user } = useAuth();
  const { preferences, loading: prefsLoading, updatePreferences } = useUserPreferences();
  const { 
    requiresOnboarding, 
    loading: profileLoading, 
    refetch: refetchProfile,
    creditState 
  } = useCreditProfile();
  const { trackEvent } = useAnalytics();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [demoState, setDemoState] = useState<AskDemoState>({ count: 0 });
  const [answerMode, setAnswerMode] = useState<AnswerMode>('quick');
  const [answerDepth, setAnswerDepth] = useState<AnswerDepth>('beginner');
  
  // Local state for guest users, synced with DB for logged-in users
  const [guestExperienceLevel, setGuestExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [guestCalibrationComplete, setGuestCalibrationComplete] = useState(false);
  const [guestMythFlags, setGuestMythFlags] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Show onboarding modal if authenticated user needs it
  useEffect(() => {
    if (user && requiresOnboarding && !profileLoading) {
      setShowOnboardingModal(true);
    }
  }, [user, requiresOnboarding, profileLoading]);

  // Sync answer depth with experience level
  useEffect(() => {
    if (preferences?.experience_level) {
      setAnswerDepth(preferences.experience_level as AnswerDepth);
    } else {
      setAnswerDepth(guestExperienceLevel as AnswerDepth);
    }
  }, [preferences?.experience_level, guestExperienceLevel]);

  // Derived state - use DB for logged-in users, localStorage for guests
  const isLoggedIn = !!user;
  const experienceLevel = isLoggedIn && preferences 
    ? preferences.experience_level 
    : guestExperienceLevel;
  const calibrationComplete = isLoggedIn && preferences 
    ? preferences.calibration_completed 
    : guestCalibrationComplete;

  // Load demo state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ASK_DEMO_KEY);
        if (stored) {
          setDemoState(JSON.parse(stored));
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  // Load guest preferences from localStorage
  useEffect(() => {
    if (!isLoggedIn && typeof window !== 'undefined') {
      try {
        const storedExp = localStorage.getItem(GUEST_EXPERIENCE_KEY);
        if (storedExp && ['beginner', 'intermediate', 'advanced'].includes(storedExp)) {
          setGuestExperienceLevel(storedExp as ExperienceLevel);
        }
        
        const calibrationDone = localStorage.getItem(GUEST_CALIBRATION_KEY);
        if (calibrationDone === 'true') {
          setGuestCalibrationComplete(true);
        }
        
        const storedMythFlags = localStorage.getItem(GUEST_MYTH_FLAGS_KEY);
        if (storedMythFlags) {
          setGuestMythFlags(JSON.parse(storedMythFlags));
        }
      } catch {
        // Ignore
      }
    }
  }, [isLoggedIn]);

  // Persist demo state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASK_DEMO_KEY, JSON.stringify(demoState));
    }
  }, [demoState]);

  // Handle calibration completion
  const handleCalibrationComplete = async (result: CalibrationResult) => {
    if (isLoggedIn) {
      try {
        const mythFlagsObj: Record<string, boolean> = {};
        result.mythFlags.forEach(flag => { mythFlagsObj[flag] = true; });
        
        await updatePreferences({
          experience_level: result.experienceLevel,
          calibration_completed: true,
          calibration_responses: result.responses,
          myth_flags: mythFlagsObj,
        });
      } catch (err) {
        console.error('Failed to save calibration to database:', err);
      }
    } else {
      setGuestExperienceLevel(result.experienceLevel);
      setGuestMythFlags(result.mythFlags);
      setGuestCalibrationComplete(true);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUEST_CALIBRATION_KEY, 'true');
        localStorage.setItem(GUEST_EXPERIENCE_KEY, result.experienceLevel);
        localStorage.setItem(GUEST_MYTH_FLAGS_KEY, JSON.stringify(result.mythFlags));
      }
    }
  };

  const handleCalibrationSkip = async () => {
    if (isLoggedIn) {
      try {
        await updatePreferences({ calibration_completed: true });
      } catch (err) {
        console.error('Failed to save calibration skip to database:', err);
      }
    } else {
      setGuestCalibrationComplete(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUEST_CALIBRATION_KEY, 'true');
      }
    }
  };

  // Handle experience level change
  const handleExperienceLevelChange = async (level: ExperienceLevel) => {
    if (isLoggedIn) {
      try {
        await updatePreferences({ experience_level: level });
      } catch (err) {
        console.error('Failed to update experience level:', err);
      }
    } else {
      setGuestExperienceLevel(level);
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUEST_EXPERIENCE_KEY, level);
      }
    }
  };

  // Handle reset calibration
  const handleResetCalibration = async () => {
    if (isLoggedIn) {
      try {
        await updatePreferences({
          calibration_completed: false,
          calibration_responses: {},
          myth_flags: {},
          experience_level: 'beginner',
        });
      } catch (err) {
        console.error('Failed to reset calibration:', err);
      }
    } else {
      setGuestCalibrationComplete(false);
      setGuestExperienceLevel('beginner');
      setGuestMythFlags([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_CALIBRATION_KEY);
        localStorage.removeItem(GUEST_EXPERIENCE_KEY);
        localStorage.removeItem(GUEST_MYTH_FLAGS_KEY);
      }
    }
    setMessages([]);
  };

  const canAsk = isLoggedIn || demoState.count < MAX_ASK_DEMO;
  const remaining = isLoggedIn ? Infinity : MAX_ASK_DEMO - demoState.count;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (question: string, calibrationAnswers?: Record<string, any>) => {
    if (!question.trim() || isLoading) return;

    if (!canAsk) {
      setShowDemoModal(true);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-credit-question', {
        body: {
          question: question.trim(),
          include_citations: true,
          answer_depth: answerDepth,
          answer_mode: answerMode,
          calibration_answers: calibrationAnswers,
        },
      });

      // Handle ONBOARDING_REQUIRED error from server
      if (error || data?.error === 'ONBOARDING_REQUIRED') {
        if (data?.error === 'ONBOARDING_REQUIRED') {
          setShowOnboardingModal(true);
          const onboardingMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Complete onboarding to get personalized answers.',
            timestamp: new Date(),
            isOnboardingRequired: true,
          };
          setMessages(prev => [...prev, onboardingMessage]);
          return;
        }

        let errorMsg = 'Something went wrong. Please try again.';
        if (error) {
          const errStr = error.message?.toLowerCase() || '';
          if (errStr.includes('429') || errStr.includes('rate')) {
            errorMsg = 'Too many requests. Please wait a moment.';
          } else if (errStr.includes('402') || errStr.includes('quota')) {
            errorMsg = 'Service temporarily unavailable.';
          } else if (errStr.includes('403') || errStr.includes('onboarding')) {
            // Server returned 403 for onboarding required
            setShowOnboardingModal(true);
            const onboardingMessage: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: 'Complete onboarding to get personalized answers.',
              timestamp: new Date(),
              isOnboardingRequired: true,
            };
            setMessages(prev => [...prev, onboardingMessage]);
            return;
          }
        }
        throw new Error(errorMsg);
      }

      // Try new schema first, then fallback to legacy
      const newSchemaResult = NewAnswerSchemaValidator.safeParse(data);
      
      if (newSchemaResult.success) {
        // New schema response
        const response = newSchemaResult.data;
        
        trackEvent('ask_success', {
          route: response.routing.mode,
          confidence: response.top_line.confidence,
          depth: response.answer_depth,
        }).catch(() => {});

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.top_line.verdict,
          newSchemaResponse: response,
          timestamp: new Date(),
          isError: false,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Try legacy schema
        const parseResult = AskAiResponseSchema.safeParse(data);
        
        if (!parseResult.success) {
          console.error('Schema validation failed:', parseResult.error);
          trackEvent('ask_schema_error', { 
            error: parseResult.error.message?.slice(0, 100) 
          }).catch(() => {});
          
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data?.answer?.short || data?.answer || data?.top_line?.verdict || 'Unable to process response.',
            timestamp: new Date(),
            isError: !!data?.error,
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const response = parseResult.data;
          
          trackEvent('ask_success', {
            route: response.route,
            confidence: response.confidence.level,
          }).catch(() => {});

          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.answer.tl_dr,
            response,
            timestamp: new Date(),
            isError: response.route === 'error',
          };

          setMessages(prev => [...prev, assistantMessage]);
        }
      }

      if (!isLoggedIn) {
        setDemoState(prev => ({ count: prev.count + 1 }));
      }
    } catch (err) {
      console.error('Ask error:', err);
      
      // Track error analytics
      trackEvent('ask_error', {
        error: err instanceof Error ? err.message.slice(0, 100) : 'unknown'
      }).catch(() => {});
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error 
          ? err.message 
          : 'An error occurred. Please try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputValue(text);
    textareaRef.current?.focus();
  };

  // Show loading state while fetching preferences for logged-in users
  if (isLoggedIn && prefsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 pb-6 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading your preferences...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show calibration for first-time users
  if (!calibrationComplete && messages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 pb-6">
          <div className="container-main py-12">
            <CalibrationQuestions 
              onComplete={handleCalibrationComplete}
              onSkip={handleCalibrationSkip}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-6">
        <div className="container-main h-full flex flex-col py-8">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="pill-secondary">
                <MessageSquare className="w-3.5 h-3.5" />
                Credit Q&A
              </span>
              {/* Experience Level Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                {EXPERIENCE_LEVELS.find(l => l.id === experienceLevel)?.icon && (
                  (() => {
                    const LevelIcon = EXPERIENCE_LEVELS.find(l => l.id === experienceLevel)!.icon;
                    return <LevelIcon className="w-3 h-3" />;
                  })()
                )}
                {experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              Ask about credit
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Get conservative, fact-based answers about credit scores, cards, and personal finance.
            </p>
            {!isLoggedIn && remaining > 0 && remaining !== Infinity && (
              <p className="text-sm text-muted-foreground/70 mt-4 font-mono">
                {remaining} free question{remaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </motion.div>

          {/* Credit Pathway Progress - Show for logged in users with credit state */}
          {isLoggedIn && creditState && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mb-6"
            >
              <CreditPathwayProgress creditState={creditState} />
            </motion.div>
          )}

          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            {/* Answer Depth Toggle - Integrated with tooltip */}
            <AnswerDepthToggle
              value={answerDepth}
              onChange={(depth) => {
                setAnswerDepth(depth);
                handleExperienceLevelChange(depth);
              }}
              disabled={isLoading}
              onPersist={async (depth) => {
                if (isLoggedIn) {
                  try {
                    await supabase
                      .from('user_ai_preferences')
                      .upsert({
                        user_id: user!.id,
                        answer_depth: depth,
                        updated_at: new Date().toISOString(),
                      });
                  } catch (err) {
                    console.error('Failed to persist depth:', err);
                  }
                }
              }}
            />

            {/* Answer Mode Toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Focus:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ANSWER_MODES.map(({ id, label, icon: Icon, description }) => (
                  <button
                    key={id}
                    onClick={() => setAnswerMode(id)}
                    title={description}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                      answerMode === id
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Calibration */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Conservative Mode — We avoid aggressive strategies.</span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline">
                    Reset calibration
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset calibration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear your calibration data and experience level.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetCalibration}>
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-6 mb-6 min-h-[300px]">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <HelpCircle className="w-4 h-4" />
                    <span>Ask anything about credit. Here are some ideas:</span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * i }}
                        onClick={() => {
                          setInputValue(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="text-left p-5 rounded-2xl border border-border bg-card hover:bg-secondary/50 hover:border-accent/40 transition-all duration-300 text-sm text-muted-foreground hover:text-foreground shadow-soft-sm hover:shadow-soft-md"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 }}
                      className={cn(
                        "flex",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-5 py-4 shadow-soft-sm",
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.isError
                            ? 'bg-destructive/5 border border-destructive/20'
                            : 'bg-card border border-border'
                        )}
                      >
                        {message.isError && (
                          <div className="flex items-center gap-2 text-destructive mb-3">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Error</span>
                          </div>
                        )}
                        
                        {/* New schema response rendering */}
                        {message.newSchemaResponse ? (
                          <AnswerRenderer 
                            response={message.newSchemaResponse}
                            onCalibrationSubmit={(answers) => {
                              // Re-submit the original question with calibration answers
                              handleSubmit(message.content || '', answers);
                            }}
                          />
                        ) : message.response ? (
                          <>
                            {/* Myth Warning */}
                            {message.response.myth.is_myth && (
                              <MythWarning 
                                label={message.response.myth.myth_label} 
                                correction={message.response.myth.correction} 
                              />
                            )}
                            
                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-wrap mb-4">
                              <RouteBadge route={message.response.route} />
                              <ConfidenceBadge 
                                level={message.response.confidence.level} 
                                score={message.response.confidence.score} 
                              />
                            </div>
                            
                            {/* Answer Section */}
                            <AnswerSection 
                              response={message.response} 
                              experienceLevel={experienceLevel} 
                            />
                            
                            {/* Citations */}
                            <CitationsSection 
                              citations={message.response.citations} 
                              messageId={message.id} 
                            />
                            
                            {/* Rate Limit Indicator */}
                            <RateLimitIndicator metrics={message.response.metrics} />
                          </>
                        ) : message.isOnboardingRequired ? (
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <div>
                              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                Complete onboarding first
                              </p>
                              <p className="text-xs text-muted-foreground">
                                We need to know your credit profile to give personalized answers.
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Legacy/fallback rendering */
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-card border border-border rounded-2xl px-5 py-4 shadow-soft-sm">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Analyzing your question...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Input */}
          <div className="mb-4">
            <AIVoiceInput 
              onTranscript={handleVoiceTranscript} 
              disabled={isLoading}
            />
          </div>

          {/* Text Input */}
          <div className="sticky bottom-0 bg-background pt-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about credit..."
                disabled={isLoading}
                rows={1}
                className={cn(
                  "w-full resize-none rounded-2xl border border-border bg-card px-5 py-4 pr-14",
                  "text-sm placeholder:text-muted-foreground/60 text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "min-h-[56px] max-h-[200px] transition-all duration-300",
                  "shadow-soft-sm hover:shadow-soft-md"
                )}
                style={{
                  height: 'auto',
                  minHeight: '56px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              <Button
                size="icon"
                variant="primary"
                onClick={() => handleSubmit(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-3 bottom-3 h-10 w-10 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/70 text-center mt-4">
              AI-generated answers. Always verify with official sources.
            </p>
          </div>
        </div>
      </main>

      <Footer />

      <DemoLimitModal
        open={showDemoModal}
        onOpenChange={setShowDemoModal}
        showBonusOption={false}
      />

      {/* Credit Onboarding Modal - shows when authenticated user needs onboarding */}
      <CreditOnboardingModal
        open={showOnboardingModal}
        onComplete={() => {
          setShowOnboardingModal(false);
          refetchProfile();
        }}
      />
    </div>
  );
}
