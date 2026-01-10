/**
 * WaitlistForm - Email signup with spam protection
 * Clean, calm design
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WaitlistFormProps {
  className?: string;
  variant?: 'default' | 'inline';
}

const RATE_LIMIT_KEY = 'waitlist_last_submit';
const RATE_LIMIT_MS = 60000;

export function WaitlistForm({ className, variant = 'default' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

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
      return true;
    }
  };

  const setRateLimitTimestamp = () => {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Honeypot check
    if (honeypotRef.current?.value) {
      setSuccess(true);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!checkRateLimit()) {
      return;
    }

    setLoading(true);

    try {
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
          toast.success("You're already on the list!");
          setSuccess(true);
        } else {
          throw insertError;
        }
      } else {
        setSuccess(true);
        setRateLimitTimestamp();
        toast.success('Welcome to the waitlist!');
      }
    } catch (err) {
      console.error('Waitlist signup failed:', err);
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded border border-primary/20 bg-primary/5",
        className
      )}>
        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="font-medium text-primary text-sm">You're on the list!</p>
          <p className="text-xs text-muted-foreground">We'll notify you when we launch.</p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
        <div className="flex gap-2">
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
              className={cn("pl-10 h-10", error && "border-destructive")}
              disabled={loading}
              aria-invalid={!!error}
            />
          </div>
          <Button type="submit" disabled={loading} size="default">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
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
          className={cn("pl-10 h-11", error && "border-destructive")}
          disabled={loading}
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
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
      <p className="font-mono text-xs text-muted-foreground text-center">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
