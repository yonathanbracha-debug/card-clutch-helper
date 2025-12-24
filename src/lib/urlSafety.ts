/**
 * URL Safety Utilities
 * Validates and sanitizes user-provided URLs to prevent XSS and invalid data storage
 */

// Maximum URL length to prevent DoS
const MAX_URL_LENGTH = 2048;

// Allowed URL schemes
const ALLOWED_SCHEMES = ['http:', 'https:'];

// Dangerous schemes that should never be accepted
const DANGEROUS_SCHEMES = ['javascript:', 'data:', 'file:', 'chrome:', 'about:', 'vbscript:', 'blob:'];

export interface UrlValidationResult {
  ok: boolean;
  normalized: string | null;
  domain: string | null;
  error: string | null;
}

/**
 * Normalizes a URL by trimming, lowercasing the host, and ensuring https:// scheme
 */
export function normalizeUrl(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  let cleaned = input.trim();
  
  // Check length
  if (cleaned.length === 0 || cleaned.length > MAX_URL_LENGTH) {
    return null;
  }

  // Check for dangerous schemes (case-insensitive)
  const lowerInput = cleaned.toLowerCase();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lowerInput.startsWith(scheme)) {
      return null;
    }
  }

  // Add https:// if no scheme present
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const urlObj = new URL(cleaned);
    
    // Validate scheme
    if (!ALLOWED_SCHEMES.includes(urlObj.protocol)) {
      return null;
    }

    // Normalize the URL
    return urlObj.href;
  } catch {
    return null;
  }
}

/**
 * Extracts the registrable domain from a normalized URL
 * Removes www. prefix and returns lowercase hostname
 */
export function extractDomainSafe(normalizedUrl: string): string | null {
  if (!normalizedUrl) {
    return null;
  }

  try {
    const urlObj = new URL(normalizedUrl);
    
    // Validate scheme again
    if (!ALLOWED_SCHEMES.includes(urlObj.protocol)) {
      return null;
    }

    let hostname = urlObj.hostname.toLowerCase();
    
    // Remove www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Basic validation - must have at least one dot and no IP literals
    if (!hostname.includes('.')) {
      return null;
    }

    // Reject IP address literals (IPv4)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return null;
    }

    // Reject IPv6 literals
    if (hostname.startsWith('[') || hostname.includes(':')) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

/**
 * Validates a user-provided URL and returns normalized form + domain
 */
export function validateUrl(input: string): UrlValidationResult {
  // Check for empty input
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return {
      ok: false,
      normalized: null,
      domain: null,
      error: 'Please enter a URL'
    };
  }

  // Check length
  if (input.length > MAX_URL_LENGTH) {
    return {
      ok: false,
      normalized: null,
      domain: null,
      error: 'URL is too long (max 2048 characters)'
    };
  }

  // Check for dangerous schemes
  const lowerInput = input.trim().toLowerCase();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lowerInput.startsWith(scheme)) {
      return {
        ok: false,
        normalized: null,
        domain: null,
        error: 'Invalid URL scheme'
      };
    }
  }

  // Try to normalize
  const normalized = normalizeUrl(input);
  if (!normalized) {
    return {
      ok: false,
      normalized: null,
      domain: null,
      error: 'Invalid URL format'
    };
  }

  // Extract domain
  const domain = extractDomainSafe(normalized);
  if (!domain) {
    return {
      ok: false,
      normalized: null,
      domain: null,
      error: 'Could not extract domain from URL'
    };
  }

  return {
    ok: true,
    normalized,
    domain,
    error: null
  };
}

/**
 * Sanitizes a URL for safe display (returns domain only)
 * Use this when displaying user-provided URLs
 */
export function getDisplayDomain(url: string): string {
  const result = validateUrl(url);
  return result.domain || 'Unknown';
}
