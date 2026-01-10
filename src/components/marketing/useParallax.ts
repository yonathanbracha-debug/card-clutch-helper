/**
 * useParallax - Lightweight scroll parallax hook
 * Performance-safe with requestAnimationFrame throttling
 * Respects prefers-reduced-motion
 */
import { useEffect, useRef, useState } from 'react';

export function useParallax(intensity: number = 0.1) {
  const [offset, setOffset] = useState(0);
  const ticking = useRef(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches) setOffset(0);
    };

    mediaQuery.addEventListener('change', handleMotionChange);

    const handleScroll = () => {
      if (prefersReducedMotion.current) return;
      
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Clamp to reasonable range (0-16px travel)
          const maxTravel = 16;
          const parallaxOffset = Math.min(scrollY * intensity, maxTravel);
          setOffset(parallaxOffset);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [intensity]);

  return offset;
}
