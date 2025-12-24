import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MerchantExclusion {
  id: string;
  card_id: string;
  merchant_pattern: string;
  reason: string;
}

export function useMerchantExclusions(cardId?: string) {
  const [exclusions, setExclusions] = useState<MerchantExclusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchExclusions() {
      if (!cardId) {
        setExclusions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('merchant_exclusions')
          .select('*')
          .eq('card_id', cardId);

        if (error) throw error;
        setExclusions(data || []);
      } catch (err) {
        console.error('Failed to fetch exclusions:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch exclusions'));
      } finally {
        setLoading(false);
      }
    }

    fetchExclusions();
  }, [cardId]);

  return { exclusions, loading, error };
}

export function useAllMerchantExclusions() {
  const [exclusions, setExclusions] = useState<MerchantExclusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAllExclusions() {
      try {
        const { data, error } = await supabase
          .from('merchant_exclusions')
          .select('*');

        if (error) throw error;
        setExclusions(data || []);
      } catch (err) {
        console.error('Failed to fetch all exclusions:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch exclusions'));
      } finally {
        setLoading(false);
      }
    }

    fetchAllExclusions();
  }, []);

  return { exclusions, loading, error };
}
