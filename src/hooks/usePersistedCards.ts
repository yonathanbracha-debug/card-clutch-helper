import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cardclutch-selected-cards';
const LAST_URL_KEY = 'cardclutch-last-url';

export function usePersistedCards() {
  const [selectedCards, setSelectedCards] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [lastUrl, setLastUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(LAST_URL_KEY) || '';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCards));
  }, [selectedCards]);

  useEffect(() => {
    if (lastUrl) {
      localStorage.setItem(LAST_URL_KEY, lastUrl);
    }
  }, [lastUrl]);

  const toggleCard = (cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  return {
    selectedCards,
    toggleCard,
    lastUrl,
    setLastUrl,
  };
}
