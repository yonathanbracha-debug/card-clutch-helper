import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CardRewardRule {
  id: string;
  card_id: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  multiplier: number;
  description: string | null;
  notes: string | null;
  cap_cents: number | null;
  cap_period: string | null;
  conditions: string | null;
  exclusions: string[] | null;
}

export function useCardRewardRules(cardId?: string) {
  const [rules, setRules] = useState<CardRewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRules() {
      if (!cardId) {
        setRules([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('card_reward_rules')
          .select(`
            id,
            card_id,
            category_id,
            multiplier,
            description,
            cap_cents,
            cap_period,
            conditions,
            exclusions,
            reward_categories!inner(id, slug, display_name)
          `)
          .eq('card_id', cardId)
          .order('multiplier', { ascending: false });

        if (error) throw error;

        const transformed = (data || []).map(rule => ({
          id: rule.id,
          card_id: rule.card_id,
          category_id: rule.category_id,
          category_slug: (rule.reward_categories as any)?.slug || 'general',
          category_name: (rule.reward_categories as any)?.display_name || 'General',
          multiplier: Number(rule.multiplier),
          description: rule.description,
          notes: null, // Will be from extended schema
          cap_cents: rule.cap_cents,
          cap_period: rule.cap_period,
          conditions: rule.conditions,
          exclusions: rule.exclusions,
        }));

        setRules(transformed);
      } catch (err) {
        console.error('Failed to fetch reward rules:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch rules'));
      } finally {
        setLoading(false);
      }
    }

    fetchRules();
  }, [cardId]);

  return { rules, loading, error };
}

export function useAllCardRewardRules() {
  const [rules, setRules] = useState<CardRewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAllRules() {
      try {
        const { data, error } = await supabase
          .from('card_reward_rules')
          .select(`
            id,
            card_id,
            category_id,
            multiplier,
            description,
            cap_cents,
            cap_period,
            conditions,
            exclusions,
            reward_categories!inner(id, slug, display_name)
          `)
          .order('multiplier', { ascending: false });

        if (error) throw error;

        const transformed = (data || []).map(rule => ({
          id: rule.id,
          card_id: rule.card_id,
          category_id: rule.category_id,
          category_slug: (rule.reward_categories as any)?.slug || 'general',
          category_name: (rule.reward_categories as any)?.display_name || 'General',
          multiplier: Number(rule.multiplier),
          description: rule.description,
          notes: null,
          cap_cents: rule.cap_cents,
          cap_period: rule.cap_period,
          conditions: rule.conditions,
          exclusions: rule.exclusions,
        }));

        setRules(transformed);
      } catch (err) {
        console.error('Failed to fetch all reward rules:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch rules'));
      } finally {
        setLoading(false);
      }
    }

    fetchAllRules();
  }, []);

  return { rules, loading, error };
}
