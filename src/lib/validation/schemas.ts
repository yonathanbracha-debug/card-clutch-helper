/**
 * Input Validation Schemas
 * Zod-based schemas for all user inputs with strict validation
 * Used client-side AND server-side (Edge Functions)
 */
import { z } from 'zod';

// Maximum lengths for security
export const MAX_URL_LENGTH = 2048;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_TEXT_LENGTH = 500;

// Dangerous URL schemes that must be rejected
const DANGEROUS_SCHEMES = ['javascript:', 'data:', 'file:', 'chrome:', 'about:', 'vbscript:', 'blob:', 'ftp:'];

/**
 * Email schema with strict validation
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(MAX_EMAIL_LENGTH, `Email must be less than ${MAX_EMAIL_LENGTH} characters`)
  .email('Invalid email address')
  .transform((email) => email.toLowerCase());

/**
 * URL schema with security validation
 */
export const urlSchema = z
  .string()
  .trim()
  .min(1, 'URL is required')
  .max(MAX_URL_LENGTH, `URL must be less than ${MAX_URL_LENGTH} characters`)
  .refine(
    (url) => {
      const lower = url.toLowerCase();
      return !DANGEROUS_SCHEMES.some((scheme) => lower.startsWith(scheme));
    },
    { message: 'Invalid URL scheme' }
  )
  .refine(
    (url) => {
      // Must not contain embedded credentials
      return !url.includes('@') || url.startsWith('mailto:');
    },
    { message: 'URLs with credentials are not allowed' }
  )
  .transform((url) => {
    // Normalize: add https:// if no scheme
    if (!url.match(/^https?:\/\//i)) {
      return `https://${url}`;
    }
    return url;
  });

/**
 * Domain extraction from URL
 */
export const domainSchema = z.string().transform((url) => {
  try {
    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = `https://${normalized}`;
    }
    const urlObj = new URL(normalized);
    let hostname = urlObj.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch {
    return null;
  }
});

/**
 * Waitlist signup payload schema
 */
export const waitlistSignupSchema = z.object({
  email: emailSchema,
  utm_source: z.string().max(100).nullish().transform(v => v || null),
  utm_campaign: z.string().max(100).nullish().transform(v => v || null),
  referrer: z.string().max(500).nullish().transform(v => v || null),
  // Honeypot field - should be empty
  website: z.string().max(0).optional(),
}).strict();

/**
 * Event log payload schema
 */
export const eventLogSchema = z.object({
  event_name: z.string().min(1).max(50),
  context: z.record(z.unknown()).default({}),
  url: z.string().max(MAX_URL_LENGTH).nullish(),
  domain: z.string().max(255).nullish(),
}).strict();

/**
 * URL analysis request schema
 */
export const analyzeUrlSchema = z.object({
  url: urlSchema,
  card_ids: z.array(z.string().uuid()).optional(),
}).strict();

/**
 * Admin card update schema
 */
export const adminCardUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  reward_summary: z.string().max(1000).optional(),
  annual_fee_cents: z.number().int().min(0).max(100000000).optional(),
  is_active: z.boolean().optional(),
  source_url: z.string().url().max(MAX_URL_LENGTH).optional(),
  terms_url: z.string().url().max(MAX_URL_LENGTH).nullish(),
}).strict();

/**
 * Admin merchant update schema
 */
export const adminMerchantUpdateSchema = z.object({
  id: z.string().uuid().optional(), // Optional for create
  name: z.string().min(1).max(200),
  domain: z.string().min(1).max(253), // Max DNS label length
  category_id: z.string().uuid().nullish(),
  is_warehouse: z.boolean().optional(),
  excluded_from_grocery: z.boolean().optional(),
  verification_status: z.enum(['verified', 'pending', 'stale']).optional(),
}).strict();

/**
 * Rate limit configuration per endpoint
 */
export const RATE_LIMITS = {
  waitlist_submit: {
    ip: { max: 5, windowMs: 60_000 },      // 5 per minute per IP
    ipDaily: { max: 20, windowMs: 86_400_000 }, // 20 per day per IP
  },
  event_log: {
    ip: { max: 60, windowMs: 60_000 },     // 60 per minute per IP
    user: { max: 120, windowMs: 60_000 },  // 120 per minute per user
  },
  admin_mutation: {
    user: { max: 30, windowMs: 60_000 },   // 30 per minute per user
  },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMITS;

/**
 * Validate and sanitize string for safe display
 */
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
