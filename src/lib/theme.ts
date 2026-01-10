/**
 * CardClutch Design System - Theme Constants
 * Infrastructure-grade, calm, premium fintech aesthetic
 * 
 * USAGE: Import and use these constants throughout the app
 * for consistent spacing, typography, and timing.
 */

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
} as const;

export const radii = {
  none: '0',
  sm: '0.5rem',      // 8px
  md: '0.75rem',     // 12px - default
  DEFAULT: '1rem',   // 16px
  lg: '1.25rem',     // 20px
  xl: '1.5rem',      // 24px
  '2xl': '2rem',     // 32px
  '3xl': '2.5rem',   // 40px
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  xs: '0 1px 2px hsl(230 25% 12% / 0.02)',
  sm: '0 2px 8px hsl(230 25% 12% / 0.04)',
  md: '0 4px 16px hsl(230 25% 12% / 0.06)',
  lg: '0 12px 32px hsl(230 25% 12% / 0.08)',
  xl: '0 24px 48px hsl(230 25% 12% / 0.1)',
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'SF Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '2rem',     // 32px
    '4xl': '2.5rem',   // 40px
    '5xl': '3.25rem',  // 52px
    '6xl': '4rem',     // 64px
  },
  lineHeight: {
    none: '1',
    tight: '1.15',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.65',
    loose: '1.75',
  },
  letterSpacing: {
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '-0.01em',
    wide: '0.01em',
    wider: '0.05em',
    widest: '0.08em',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation timing - SLOW and deliberate (30-40% slower than typical)
export const transitions = {
  fastest: '150ms',
  fast: '250ms',
  normal: '350ms',
  slow: '500ms',
  slower: '700ms',
  slowest: '1000ms',
} as const;

export const easing = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',    // ease-in-out
  in: 'cubic-bezier(0.4, 0, 1, 1)',           // ease-in
  out: 'cubic-bezier(0, 0, 0.2, 1)',          // ease-out
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',      // ease-in-out
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // bounce
} as const;

export const zIndex = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  fixed: 150,
  overlay: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const;

// Hero animation config
export const animations = {
  wordRotateInterval: 5000,  // 5 seconds between word changes (slow)
  wordRotateDuration: 600,   // 600ms for transition (slow, deliberate)
  heroFloatDuration: 8000,   // 8 seconds float cycle
  parallaxFactor: 0.15,      // Subtle parallax movement
} as const;

// Color palette reference (for documentation)
export const colors = {
  // Primary: Cool indigo
  primary: {
    hue: 245,
    saturation: 58,
    lightness: { light: 51, dark: 60 },
  },
  // Background: Deep charcoal
  background: {
    hue: 230,
    saturation: 20,
    lightness: { light: 96, dark: 7 },
  },
  // Foreground: Near-black / Near-white
  foreground: {
    hue: 230,
    saturation: 25,
    lightness: { light: 12, dark: 92 },
  },
} as const;

export default {
  spacing,
  radii,
  shadows,
  typography,
  breakpoints,
  transitions,
  easing,
  zIndex,
  animations,
  colors,
};