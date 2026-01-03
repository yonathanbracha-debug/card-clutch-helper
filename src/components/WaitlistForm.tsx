import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface WaitlistFormProps {
  className?: string;
  variant?: 'default' | 'inline';
}

export function WaitlistForm({ className, variant = 'default' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#34d399', '#10b981', '#059669', '#047857'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#34d399', '#10b981', '#059669', '#047857'],
      });
    }, 250);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Get UTM params from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source');
      const utm_campaign = urlParams.get('utm_campaign');
      const referrer = document.referrer || null;

      const { error } = await supabase
        .from('waitlist_subscribers')
        .insert({
          email: email.trim().toLowerCase(),
          utm_source,
          utm_campaign,
          referrer,
        });

      if (error) {
        if (error.code === '23505') {
          toast.success("You're already on the list! 🎉");
          setSuccess(true);
          triggerConfetti();
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        toast.success('Welcome to the waitlist! 🎉');
        triggerConfetti();
      }
    } catch (err) {
      console.error('Waitlist signup failed:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("flex items-center gap-2 text-primary", className)}>
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">You're on the list!</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          disabled={loading}
        />
      </div>
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
