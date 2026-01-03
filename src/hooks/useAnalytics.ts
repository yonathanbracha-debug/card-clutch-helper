import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ANON_ID_KEY = 'cardclutch_anon_id';

type EventName =
  | 'app_open'
  | 'page_view'
  | 'recommendation_requested'
  | 'recommendation_returned'
  | 'report_submitted'
  | 'card_selected'
  | 'card_deselected'
  | 'admin_viewed_dashboard'
  | 'analyze_started'
  | 'analyze_success'
  | 'analyze_failed'
  | 'demo_analysis_started'
  | 'demo_analysis_success'
  | 'demo_limit_reached'
  | 'signup_prompt_shown'
  | 'signup_clicked'
  | 'signup_completed'
  | 'wallet_card_added'
  | 'wallet_card_removed';

interface EventContext {
  domain?: string;
  categorySlug?: string;
  selectedCardCount?: number;
  recommendedCardId?: string;
  confidence?: string;
  cardId?: string;
  path?: string;
  search?: string;
  hash?: string;
  error?: string;
  remaining?: number;
  [key: string]: unknown;
}

// Generate or retrieve stable anonymous ID
function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

export function useAnalytics() {
  const { user } = useAuth();
  const [anonId, setAnonId] = useState<string>('');

  useEffect(() => {
    setAnonId(getAnonId());
  }, []);

  const trackEvent = useCallback(
    async (eventName: EventName, context: EventContext = {}, url?: string) => {
      try {
        const domain = context.domain || (url ? extractDomain(url) : undefined);
        
        // Include anon_id in context for anonymous tracking
        const enrichedContext = {
          ...context,
          anon_id: user?.id ? undefined : anonId,
        };
        
        const insertData = {
          user_id: user?.id || null,
          event_name: eventName,
          context: JSON.parse(JSON.stringify(enrichedContext)),
          url: url || null,
          domain: domain || null,
        };
        
        const { error } = await supabase.from('analytics_events').insert([insertData]);

        if (error) {
          console.error('Failed to track event:', error);
        }
      } catch (err) {
        console.error('Analytics error:', err);
      }
    },
    [user?.id, anonId]
  );

  return { trackEvent, anonId };
}

function extractDomain(url: string): string | undefined {
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}
