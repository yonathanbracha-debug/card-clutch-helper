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
import { 
  Send, 
  ChevronDown, 
  ExternalLink,
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium mb-4">
              <MessageSquare className="w-3 h-3" />
              Credit Q&A
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              Ask about credit
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Get answers about credit scores, cards, and personal finance.
            </p>
            {!isLoggedIn && remaining > 0 && remaining !== Infinity && (
              <p className="text-xs text-muted-foreground mt-3">
                {remaining} free question{remaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
            {messages.length === 0 ? (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Ask anything about credit. Some ideas:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(prompt);
                        textareaRef.current?.focus();
                      }}
                      className="text-left p-4 rounded-2xl border border-border bg-card hover:bg-secondary transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.isError
                          ? 'bg-destructive/10 border border-destructive/20'
                          : 'bg-card border border-border'
                      )}
                    >
                      {message.isError && (
                        <div className="flex items-center gap-2 text-destructive mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Error</span>
                        </div>
                      )}
                      
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      
                      {message.role === 'assistant' && !message.isError && (
                        <div className="mt-3 space-y-3">
                          {message.confidence !== undefined && (
                            <ConfidenceMeter 
                              confidence={message.confidence} 
                              size="sm"
                            />
                          )}
                          
                          {message.citations && message.citations.length > 0 && (
                            <div className="border-t border-border pt-3">
                              <button
                                onClick={() => toggleCitations(message.id)}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 transition-transform",
                                    expandedCitations.has(message.id) && "rotate-180"
                                  )}
                                />
                                {expandedCitations.has(message.id) ? 'Hide' : 'Show'} sources ({message.citations.length})
                              </button>
                              
                              {expandedCitations.has(message.id) && (
                                <div className="mt-2 space-y-2">
                                  {message.citations.map((citation, i) => (
                                    <a
                                      key={i}
                                      href={citation.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span className="truncate">{citation.title}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Input */}
          <div className="mb-3">
            <AIVoiceInput 
              onTranscript={handleVoiceTranscript} 
              disabled={isLoading}
            />
          </div>

          {/* Text Input */}
          <div className="sticky bottom-0 bg-background pt-2">
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
                  "w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 pr-12",
                  "text-sm placeholder:text-muted-foreground text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "min-h-[48px] max-h-[200px] transition-all"
                )}
                style={{
                  height: 'auto',
                  minHeight: '48px',
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
                className="absolute right-2 bottom-2 h-8 w-8 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              AI-generated. Verify important information independently.
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