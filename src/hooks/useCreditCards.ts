import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CreditCardDB {
  id: string;
  name: string;
  network: string;
  annual_fee_cents: number;
  reward_summary: string;
  image_url: string | null;
  source_url: string;
  terms_url: string | null;
  last_verified_at: string;
  verification_status: string;
  issuer_name: string;
  issuer_id: string | null;
  is_active: boolean;
  foreign_tx_fee_percent: number | null;
  credits_summary: string | null;
  slug: string | null;
}

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCardDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credit_cards')
        .select(`
          id,
          name,
          network,
          annual_fee_cents,
          reward_summary,
          image_url,
          source_url,
          terms_url,
          last_verified_at,
          verification_status,
          issuer_id,
          is_active,
          foreign_tx_fee_percent,
          credits_summary,
          slug,
          issuers!inner(id, name)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const transformed = (data || []).map(card => ({
        id: card.id,
        name: card.name,
        network: card.network,
        annual_fee_cents: card.annual_fee_cents,
        reward_summary: card.reward_summary,
        image_url: card.image_url,
        source_url: card.source_url,
        terms_url: card.terms_url,
        last_verified_at: card.last_verified_at,
        verification_status: card.verification_status,
        issuer_id: card.issuer_id,
        issuer_name: (card.issuers as any)?.name || 'Unknown',
        is_active: card.is_active,
        foreign_tx_fee_percent: card.foreign_tx_fee_percent,
        credits_summary: card.credits_summary,
        slug: card.slug,
      }));
      
      setCards(transformed);
    } catch (err) {
      console.error('Failed to fetch cards:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch cards'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return { cards, loading, error, refetch: fetchCards };
}
