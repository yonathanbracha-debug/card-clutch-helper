import { useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';

/**
 * Hook to track page views on route changes.
 * Should be used in the App component or a layout wrapper.
 */
export function usePageView() {
  const location = useLocation();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Track page view on route change
    trackEvent('page_view' as any, {
      path: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location.pathname, trackEvent]);
}

interface PageViewTrackerProps {
  children: ReactNode;
}

/**
 * Component wrapper that tracks page views.
 * Use this in App.tsx inside BrowserRouter.
 */
export function PageViewTracker({ children }: PageViewTrackerProps) {
  usePageView();
  return children;
}
