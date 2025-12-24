import { useAuth } from '@/contexts/AuthContext';
import { useWalletCards } from '@/hooks/useWalletCards';
import { useGuestWallet } from '@/hooks/useGuestWallet';
import { useCreditCards, CreditCardDB } from '@/hooks/useCreditCards';
import { useMemo, useCallback } from 'react';

// Unified wallet hook that works for both guests and authenticated users
export function useUnifiedWallet() {
  const { user } = useAuth();
  const { cards: allCards, loading: cardsLoading } = useCreditCards();
  
  // Authenticated wallet
  const {
    walletCards: authWalletCards,
    selectedCardIds: authSelectedIds,
    loading: authLoading,
    toggleCard: authToggleCard,
  } = useWalletCards();

  // Guest wallet
  const {
    guestCardIds,
    preferences: guestPrefs,
    isUsingDemo,
    toggleCard: guestToggleCard,
    setCards: setGuestCards,
    useDemoWallet,
    clearWallet: clearGuestWallet,
  } = useGuestWallet();

  const isAuthenticated = !!user;
  const loading = cardsLoading || (isAuthenticated && authLoading);

  // Get demo card IDs based on slug matching
  const demoCardIds = useMemo(() => {
    const demoSlugs = ['amex-gold', 'chase-freedom-unlimited', 'capital-one-savor-one'];
    const demoNamePatterns = ['Gold Card', 'Freedom Unlimited', 'SavorOne'];
    
    return allCards
      .filter(card => 
        demoNamePatterns.some(pattern => 
          card.name.toLowerCase().includes(pattern.toLowerCase())
        )
      )
      .map(c => c.id)
      .slice(0, 3);
  }, [allCards]);

  // Current selected card IDs
  const selectedCardIds = useMemo(() => {
    if (isAuthenticated) {
      return authSelectedIds;
    }
    return guestCardIds;
  }, [isAuthenticated, authSelectedIds, guestCardIds]);

  // Get full card objects for selected cards
  const selectedCards = useMemo(() => {
    return selectedCardIds
      .map(id => allCards.find(c => c.id === id))
      .filter(Boolean) as CreditCardDB[];
  }, [selectedCardIds, allCards]);

  // Toggle card in wallet
  const toggleCard = useCallback((cardId: string) => {
    if (isAuthenticated) {
      authToggleCard(cardId);
    } else {
      guestToggleCard(cardId);
    }
  }, [isAuthenticated, authToggleCard, guestToggleCard]);

  // Use demo wallet
  const startWithDemo = useCallback(() => {
    if (!isAuthenticated && demoCardIds.length > 0) {
      useDemoWallet(demoCardIds);
    }
  }, [isAuthenticated, demoCardIds, useDemoWallet]);

  const hasCards = selectedCardIds.length > 0;
  const canSave = isAuthenticated;

  return {
    // State
    isAuthenticated,
    loading,
    selectedCardIds,
    selectedCards,
    allCards,
    hasCards,
    canSave,
    isUsingDemo,
    demoCardIds,
    
    // Actions
    toggleCard,
    startWithDemo,
    setGuestCards,
    clearGuestWallet,
  };
}
