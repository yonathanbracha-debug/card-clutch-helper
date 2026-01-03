/**
 * WaitlistForm - Email signup with spam protection and robust error handling
 * Never causes black screen - always provides clear feedback
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface WaitlistFormProps {
  className?: string;
  variant?: 'default' | 'inline';
}

// Rate limit: 1 submit per 60 seconds
const RATE_LIMIT_KEY = 'waitlist_last_submit';
const RATE_LIMIT_MS = 60000;

export function WaitlistForm({ className, variant = 'default' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const triggerConfetti = useCallback(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.2, 0.4), y: Math.random() - 0.2 },
        colors: ['hsl(160, 84%, 39%)', 'hsl(158, 64%, 52%)', 'hsl(161, 94%, 30%)'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.8), y: Math.random() - 0.2 },
        colors: ['hsl(160, 84%, 39%)', 'hsl(158, 64%, 52%)', 'hsl(161, 94%, 30%)'],
      });
    }, 200);
  }, []);

  const checkRateLimit = (): boolean => {
    try {
      const lastSubmit = localStorage.getItem(RATE_LIMIT_KEY);
      if (lastSubmit) {
        const elapsed = Date.now() - parseInt(lastSubmit, 10);
        if (elapsed < RATE_LIMIT_MS) {
          const remaining = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
          setError(`Please wait ${remaining}s before trying again`);
          return false;
        }
      }
      return true;
    } catch {
      // localStorage not available, allow submission
      return true;
    }
  };

  const setRateLimitTimestamp = () => {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Honeypot check - if filled, silently "succeed" (bot trap)
    if (honeypotRef.current?.value) {
      setSuccess(true);
      return;
    }

    // Validate email
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    // Rate limit check
    if (!checkRateLimit()) {
      return;
    }

    setLoading(true);

    try {
      // Get UTM params from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source');
      const utm_campaign = urlParams.get('utm_campaign');
      const referrer = document.referrer || null;

      const { error: insertError } = await supabase
        .from('waitlist_subscribers')
        .insert({
          email: trimmedEmail,
          utm_source,
          utm_campaign,
          referrer,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate - still a success from UX perspective
          toast.success("You're already on the list! 🎉");
          setSuccess(true);
          triggerConfetti();
        } else {
          throw insertError;
        }
      } else {
        setSuccess(true);
        setRateLimitTimestamp();
        toast.success('Welcome to the waitlist! 🎉');
        triggerConfetti();
      }
    } catch (err) {
      console.error('Waitlist signup failed:', err);
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20",
        className
      )}>
        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="font-medium text-primary">You're on the list!</p>
          <p className="text-sm text-muted-foreground">We'll notify you when we launch.</p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
        <div className="flex gap-2">
          {/* Honeypot - hidden from humans */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            aria-hidden="true"
          />
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={cn("pl-10", error && "border-destructive")}
              disabled={loading}
              aria-invalid={!!error}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      {/* Honeypot - hidden from humans */}
      <input
        ref={honeypotRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        aria-hidden="true"
      />
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          className={cn("pl-10", error && "border-destructive")}
          disabled={loading}
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          'Join the Waitlist'
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
