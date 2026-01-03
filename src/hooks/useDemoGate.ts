import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_STORAGE_KEY = 'cardclutch_demo_analyses';
const MAX_FREE_ANALYSES = 3;

interface DemoState {
  count: number;
  lastAnalysis: string | null;
}

export function useDemoGate() {
  const { user } = useAuth();
  const [state, setState] = useState<DemoState>({ count: 0, lastAnalysis: null });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (stored) {
          setState(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load demo state:', e);
      }
      setIsInitialized(true);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isInitialized]);

  // If user is logged in, they have unlimited analyses
  const isLoggedIn = !!user;

  // Remaining analyses for demo users
  const remaining = isLoggedIn ? Infinity : Math.max(0, MAX_FREE_ANALYSES - state.count);

  // Can analyze: logged in users always can, demo users check limit
  const canAnalyze = isLoggedIn || state.count < MAX_FREE_ANALYSES;

  // Has hit limit
  const hasHitLimit = !isLoggedIn && state.count >= MAX_FREE_ANALYSES;

  // Should show banner (after first analysis but before limit)
  const shouldShowBanner = !isLoggedIn && state.count > 0 && state.count < MAX_FREE_ANALYSES;

  // Increment successful analysis count
  const incrementSuccess = useCallback(() => {
    if (!isLoggedIn) {
      setState(prev => ({
        count: prev.count + 1,
        lastAnalysis: new Date().toISOString(),
      }));
    }
  }, [isLoggedIn]);

  // Reset for development only
  const resetDemoDevOnly = useCallback(() => {
    if (import.meta.env.DEV) {
      setState({ count: 0, lastAnalysis: null });
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  }, []);

  return {
    canAnalyze,
    remaining,
    hasHitLimit,
    shouldShowBanner,
    analysisCount: state.count,
    incrementSuccess,
    isLoggedIn,
    ...(import.meta.env.DEV ? { resetDemoDevOnly } : {}),
  };
}
