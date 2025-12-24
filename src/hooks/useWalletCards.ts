import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WalletCard {
  id: string;
  card_id: string;
  utilization_status: 'low' | 'medium' | 'high';
  do_not_recommend: boolean;
}

export interface CreditCardDB {
  id: string;
  name: string;
  network: string;
  annual_fee_cents: number;
  reward_summary: string;
  image_url: string | null;
  source_url: string;
  last_verified_at: string;
  verification_status: string;
  issuer: {
    id: string;
    name: string;
  } | null;
}

export function useWalletCards() {
  const { user } = useAuth();
  const [walletCards, setWalletCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletCards = useCallback(async () => {
    if (!user) {
      setWalletCards([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_wallet_cards')
        .select('id, card_id, utilization_status, do_not_recommend')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setWalletCards((data || []).map(d => ({
        id: d.id,
        card_id: d.card_id,
        utilization_status: d.utilization_status as 'low' | 'medium' | 'high',
        do_not_recommend: d.do_not_recommend
      })));
    } catch (err) {
      console.error('Failed to fetch wallet cards:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWalletCards();
  }, [fetchWalletCards]);

  const addCard = async (cardId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_wallet_cards')
        .insert({ user_id: user.id, card_id: cardId })
        .select('id, card_id, utilization_status, do_not_recommend')
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already exists, ignore
          return;
        }
        throw error;
      }
      
      if (data) {
        setWalletCards(prev => [...prev, {
          id: data.id,
          card_id: data.card_id,
          utilization_status: data.utilization_status as 'low' | 'medium' | 'high',
          do_not_recommend: data.do_not_recommend
        }]);
      }
    } catch (err) {
      console.error('Failed to add card:', err);
      throw err;
    }
  };

  const removeCard = async (cardId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_wallet_cards')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) throw error;
      
      setWalletCards(prev => prev.filter(c => c.card_id !== cardId));
    } catch (err) {
      console.error('Failed to remove card:', err);
      throw err;
    }
  };

  const updateCard = async (cardId: string, updates: Partial<Pick<WalletCard, 'utilization_status' | 'do_not_recommend'>>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_wallet_cards')
        .update(updates)
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) throw error;
      
      setWalletCards(prev => prev.map(c => 
        c.card_id === cardId ? { ...c, ...updates } : c
      ));
    } catch (err) {
      console.error('Failed to update card:', err);
      throw err;
    }
  };

  const toggleCard = async (cardId: string) => {
    const exists = walletCards.some(c => c.card_id === cardId);
    if (exists) {
      await removeCard(cardId);
    } else {
      await addCard(cardId);
    }
  };

  return { 
    walletCards, 
    loading, 
    addCard, 
    removeCard, 
    updateCard,
    toggleCard,
    refetch: fetchWalletCards,
    selectedCardIds: walletCards.map(c => c.card_id)
  };
}
