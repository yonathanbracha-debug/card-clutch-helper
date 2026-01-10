/**
 * Ask Page - Credit Q&A
 * Trust-first, calm experience for credit questions
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { DemoLimitModal } from '@/components/DemoLimitModal';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';

const ASK_DEMO_KEY = 'cardclutch_ask_demo';
const MAX_ASK_DEMO = 3;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  citations?: Array<{
    title: string;
    url: string;
    category: string;
    relevance: number;
  }>;
  intent?: string;
  timestamp: Date;
  isError?: boolean;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoState, setDemoState] = useState<AskDemoState>({ count: 0 });
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASK_DEMO_KEY, JSON.stringify(demoState));
    }
  }, [demoState]);

  const isLoggedIn = !!user;
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
        citations: data.citations,
        intent: data.intent,
        timestamp: new Date(),
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
            className="mb-8"
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
                        
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                        
                        {message.role === 'assistant' && !message.isError && (
                          <div className="mt-4 space-y-4">
                            {message.confidence !== undefined && (
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
