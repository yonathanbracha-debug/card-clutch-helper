import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cardclutch-recent-searches';
const MAX_SEARCHES = 5;

export interface RecentSearch {
  id: string;
  url: string;
  merchantName: string;
  category: string;
  categoryLabel: string;
  cardId: string;
  cardName: string;
  cardIssuer: string;
  timestamp: number;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
  }, [recentSearches]);

  const addSearch = useCallback((search: Omit<RecentSearch, 'id' | 'timestamp'>) => {
    setRecentSearches(prev => {
      // Check if same URL already exists
      const filtered = prev.filter(s => s.url !== search.url);
      
      const newSearch: RecentSearch = {
        ...search,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      
      // Add to front, keep max 5
      return [newSearch, ...filtered].slice(0, MAX_SEARCHES);
    });
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    recentSearches,
    addSearch,
    clearSearches,
  };
}
