import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type EventName =
  | 'app_open'
  | 'recommendation_requested'
  | 'recommendation_returned'
  | 'report_submitted'
  | 'card_selected'
  | 'card_deselected'
  | 'admin_viewed_dashboard';

interface EventContext {
  domain?: string;
  categorySlug?: string;
  selectedCardCount?: number;
  recommendedCardId?: string;
  confidence?: string;
  cardId?: string;
  [key: string]: unknown;
}

export function useAnalytics() {
  const { user } = useAuth();

  const trackEvent = useCallback(
    async (eventName: EventName, context: EventContext = {}, url?: string) => {
      try {
        const domain = context.domain || (url ? extractDomain(url) : undefined);
        
        const insertData = {
          user_id: user?.id || null,
          event_name: eventName,
          context: JSON.parse(JSON.stringify(context)),
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
    [user?.id]
  );

  return { trackEvent };
}

function extractDomain(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}
