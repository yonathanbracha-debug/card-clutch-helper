/**
 * Hook for managing user insight feedback
 * Enables deterministic memory for suppressing incorrect insights
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FeedbackType = 'incorrect' | 'correct' | 'suppress';

export interface InsightFeedback {
  id: string;
  user_id: string;
  insight_type: string;
  insight_key: string;
  feedback: FeedbackType;
  reason?: string;
  created_at: string;
}

export function useInsightFeedback() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(async (
    insightType: string,
    insightKey: string,
    feedback: FeedbackType,
    reason?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('user_feedback')
        .upsert({
          user_id: user.id,
          insight_type: insightType,
          insight_key: insightKey,
          feedback,
          reason,
        }, {
          onConflict: 'user_id,insight_type,insight_key'
        });

      if (upsertError) {
        setError(upsertError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeFeedback = useCallback(async (
    insightType: string,
    insightKey: string
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('user_feedback')
        .delete()
        .eq('user_id', user.id)
        .eq('insight_type', insightType)
        .eq('insight_key', insightKey);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    submitFeedback,
    removeFeedback,
    loading,
    error,
  };
}
