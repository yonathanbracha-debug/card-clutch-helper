/**
 * Ask Page - Credit Q&A
 * Trust-first, calm experience for credit questions
 * CardClutch Vertical AI System
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { DemoLimitModal } from '@/components/DemoLimitModal';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';
import { CalibrationQuestions, CalibrationResult } from '@/components/ask/CalibrationQuestions';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences, ExperienceLevel } from '@/hooks/useUserPreferences';
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
} from 'lucide-react';

const ASK_DEMO_KEY = 'cardclutch_ask_demo';
const MAX_ASK_DEMO = 3;

// Local storage keys for guest users
const GUEST_EXPERIENCE_KEY = 'cardclutch_guest_experience';
const GUEST_CALIBRATION_KEY = 'cardclutch_guest_calibration';
const GUEST_MYTH_FLAGS_KEY = 'cardclutch_guest_myth_flags';

// Score impact types
type ScoreImpact = 'none' | 'temporary' | 'long_term' | 'unknown';
type ConfidenceLevel = 'high' | 'issuer_dependent' | 'situational' | 'insufficient_data';
type AnswerMode = 'quick' | 'mechanics' | 'action' | 'risk';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  confidenceLevel?: ConfidenceLevel;
  scoreImpact?: ScoreImpact;
  citations?: Array<{
    title: string;
    url: string;
    category: string;
    relevance: number;
  }>;
  intent?: string;
  timestamp: Date;
  isError?: boolean;
  isMyth?: boolean;
  mythCorrection?: string | null;
}

// Answer Mode configurations
const ANSWER_MODES: { id: AnswerMode; label: string; icon: typeof Zap; description: string }[] = [
  { id: 'quick', label: 'Quick Answer', icon: Zap, description: 'Direct answer only' },
  { id: 'mechanics', label: 'Explain Mechanics', icon: Cog, description: 'How it works' },
  { id: 'action', label: 'What To Do', icon: ListChecks, description: 'Actionable steps' },
  { id: 'risk', label: 'Risk Analysis', icon: AlertOctagon, description: 'Full risk breakdown' },
];

// Experience Level configurations
const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; icon: typeof User }[] = [
  { id: 'beginner', label: 'Beginner', icon: User },
  { id: 'intermediate', label: 'Intermediate', icon: GraduationCap },
  { id: 'advanced', label: 'Advanced', icon: Briefcase },
];

// Score Impact Badge Component
function ScoreImpactBadge({ impact }: { impact: ScoreImpact }) {
  const config = {
    none: { icon: Minus, label: 'No score impact', className: 'text-muted-foreground bg-muted' },
    temporary: { icon: TrendingDown, label: 'Temporary impact', className: 'text-amber-600 bg-amber-500/10' },
    long_term: { icon: TrendingUp, label: 'Long-term impact', className: 'text-destructive bg-destructive/10' },
    unknown: { icon: HelpCircle, label: 'Impact varies', className: 'text-muted-foreground bg-muted' },
  };
  
  const { icon: Icon, label, className } = config[impact];
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", className)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// Confidence Level Badge Component  
function ConfidenceLevelBadge({ level }: { level: ConfidenceLevel }) {
  const config = {
    high: { label: 'High certainty', className: 'text-emerald-600 bg-emerald-500/10' },
    issuer_dependent: { label: 'Issuer-dependent', className: 'text-amber-600 bg-amber-500/10' },
    situational: { label: 'Situational', className: 'text-blue-600 bg-blue-500/10' },
    insufficient_data: { label: 'Insufficient data', className: 'text-muted-foreground bg-muted' },
  };
  
  const { label, className } = config[level];
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", className)}>
      <Shield className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// Myth Warning Component
function MythWarning({ correction }: { correction: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-4">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
          Common misconception
        </p>
        <p className="text-sm text-muted-foreground">
          {correction}
        </p>
      </div>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoState, setDemoState] = useState<AskDemoState>({ count: 0 });
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const [answerMode, setAnswerMode] = useState<AnswerMode>('quick');
  
  // Local state for guest users, synced with DB for logged-in users
  const [guestExperienceLevel, setGuestExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [guestCalibrationComplete, setGuestCalibrationComplete] = useState(false);
  const [guestMythFlags, setGuestMythFlags] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derived state - use DB for logged-in users, localStorage for guests
  const isLoggedIn = !!user;
  const experienceLevel = isLoggedIn && preferences 
    ? preferences.experience_level 
    : guestExperienceLevel;
  const calibrationComplete = isLoggedIn && preferences 
    ? preferences.calibration_completed 
    : guestCalibrationComplete;
  const mythFlags = isLoggedIn && preferences 
    ? Object.keys(preferences.myth_flags).filter(k => preferences.myth_flags[k]) 
    : guestMythFlags;

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
      // Persist to database for logged-in users
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
      // Persist to localStorage for guests
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
    // Clear messages to show calibration
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

  const handleSubmit = async (question: string) => {
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
          experience_level: experienceLevel,
          answer_mode: answerMode,
        },
      });

      if (error) {
        let errorMsg = 'Something went wrong. Please try again.';
        const errStr = error.message?.toLowerCase() || '';
        if (errStr.includes('429') || errStr.includes('rate')) {
          errorMsg = 'Too many requests. Please wait a moment.';
        } else if (errStr.includes('402') || errStr.includes('quota')) {
          errorMsg = 'Service temporarily unavailable.';
        }
        throw new Error(errorMsg);
      }

      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      if (!data?.answer) {
        throw new Error('No response received.');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        confidence: data.confidence,
        confidenceLevel: data.confidence_level,
        scoreImpact: data.score_impact,
        citations: data.citations,
        intent: data.intent,
        timestamp: new Date(),
        isMyth: data.is_myth,
        mythCorrection: data.myth_correction,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (!isLoggedIn) {
        setDemoState(prev => ({ count: prev.count + 1 }));
      }
    } catch (err) {
      console.error('Ask error:', err);
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

  const toggleCitations = (messageId: string) => {
    setExpandedCitations(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
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
            <span className="pill-secondary mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              Credit Q&A
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              Ask about credit
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Get conservative, fact-based answers about credit scores, cards, and personal finance. 
              No hype, just clarity.
            </p>
            {!isLoggedIn && remaining > 0 && remaining !== Infinity && (
              <p className="text-sm text-muted-foreground/70 mt-4 font-mono">
                {remaining} free question{remaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </motion.div>

          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            {/* Experience Level Selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Experience:
              </span>
              <div className="flex items-center gap-1.5">
                {EXPERIENCE_LEVELS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleExperienceLevelChange(id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                      experienceLevel === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Mode Toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Mode:
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

            {/* Conservative Mode Indicator & Reset Calibration */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Conservative Mode Active — We avoid aggressive strategies.</span>
              </div>
              <button
                onClick={handleResetCalibration}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                Reset calibration
              </button>
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
                  {messages.map((message, index) => (
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
                        
                        {/* Myth Warning */}
                        {message.role === 'assistant' && message.isMyth && message.mythCorrection && (
                          <MythWarning correction={message.mythCorrection} />
                        )}
                        
                        {/* Score Impact & Confidence Badges */}
                        {message.role === 'assistant' && !message.isError && (
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            {message.scoreImpact && (
                              <ScoreImpactBadge impact={message.scoreImpact} />
                            )}
                            {message.confidenceLevel && (
                              <ConfidenceLevelBadge level={message.confidenceLevel} />
                            )}
                          </div>
                        )}
                        
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                        
                        {message.role === 'assistant' && !message.isError && (
                          <div className="mt-4 space-y-4">
                            {message.confidence !== undefined && message.confidence < 0.95 && (
                              <ConfidenceMeter 
                                confidence={message.confidence} 
                                size="sm"
                              />
                            )}
                            
                            {message.citations && message.citations.length > 0 && (
                              <div className="border-t border-border pt-4">
                                <button
                                  onClick={() => toggleCitations(message.id)}
                                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                                >
                                  <ChevronDown
                                    className={cn(
                                      "w-4 h-4 transition-transform duration-300",
                                      expandedCitations.has(message.id) && "rotate-180"
                                    )}
                                  />
                                  {expandedCitations.has(message.id) ? 'Hide' : 'Show'} sources ({message.citations.length})
                                </button>
                                
                                <AnimatePresence>
                                  {expandedCitations.has(message.id) && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="mt-3 space-y-2 overflow-hidden"
                                    >
                                      {message.citations.map((citation, i) => (
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
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
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
              AI-generated answers. Always verify important information with official sources.
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
    </div>
  );
}
