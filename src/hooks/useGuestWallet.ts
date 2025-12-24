import { useState, useEffect, useCallback } from 'react';

const GUEST_WALLET_KEY = 'cardclutch-guest-wallet';
const GUEST_PREFS_KEY = 'cardclutch-guest-prefs';

// Default demo cards (will be mapped to actual DB IDs)
const DEFAULT_DEMO_CARDS = ['amex-gold', 'chase-freedom-unlimited', 'capital-one-savor-one'];

export interface GuestPreferences {
  mode: 'rewards' | 'conservative';
  preferPoints: boolean;
  avoidForeignFees: boolean;
}

const defaultPrefs: GuestPreferences = {
  mode: 'rewards',
  preferPoints: true,
  avoidForeignFees: false,
};

export function useGuestWallet() {
  const [guestCardIds, setGuestCardIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(GUEST_WALLET_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [preferences, setPreferences] = useState<GuestPreferences>(() => {
    if (typeof window === 'undefined') return defaultPrefs;
    const stored = localStorage.getItem(GUEST_PREFS_KEY);
    return stored ? JSON.parse(stored) : defaultPrefs;
  });

  const [isUsingDemo, setIsUsingDemo] = useState(false);

  useEffect(() => {
    localStorage.setItem(GUEST_WALLET_KEY, JSON.stringify(guestCardIds));
  }, [guestCardIds]);

  useEffect(() => {
    localStorage.setItem(GUEST_PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const toggleCard = useCallback((cardId: string) => {
    setGuestCardIds(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
    setIsUsingDemo(false);
  }, []);

  const setCards = useCallback((cardIds: string[]) => {
    setGuestCardIds(cardIds);
    setIsUsingDemo(false);
  }, []);

  const useDemoWallet = useCallback((demoCardIds: string[]) => {
    setGuestCardIds(demoCardIds);
    setIsUsingDemo(true);
  }, []);

  const updatePreferences = useCallback((updates: Partial<GuestPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const clearWallet = useCallback(() => {
    setGuestCardIds([]);
    setIsUsingDemo(false);
  }, []);

  const hasCards = guestCardIds.length > 0;

  return {
    guestCardIds,
    preferences,
    isUsingDemo,
    hasCards,
    toggleCard,
    setCards,
    useDemoWallet,
    updatePreferences,
    clearWallet,
  };
}
