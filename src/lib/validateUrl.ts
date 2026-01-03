/**
 * URL Validation Utility
 * Validates URLs for security and correctness
 */

const DANGEROUS_SCHEMES = [
  'javascript:',
  'data:',
  'file:',
  'chrome:',
  'chrome-extension:',
  'about:',
  'vbscript:',
  'blob:',
  'ftp:',
];

export interface ValidateUrlResult {
  ok: boolean;
  reason?: string;
  normalized?: string;
  hostname?: string;
}

/**
 * Validates a URL for security and correctness
 * 
 * Rules:
 * - Must be parseable by URL()
 * - Must use https: scheme
 * - Must have a hostname
 * - Must not use dangerous schemes
 * 
 * @param url - The URL string to validate
 * @returns Validation result with normalized URL if valid
 */
export function validateUrl(url: string | null | undefined): ValidateUrlResult {
  // Null/undefined is considered "no URL" - not an error
  if (!url || url.trim() === '') {
    return { ok: false, reason: 'No URL provided' };
  }

  const trimmed = url.trim();

  // Check for dangerous schemes (case-insensitive)
  const lowerUrl = trimmed.toLowerCase();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lowerUrl.startsWith(scheme)) {
      return { ok: false, reason: `Dangerous scheme: ${scheme}` };
    }
  }

  // Reject http:// - only https allowed
  if (lowerUrl.startsWith('http://')) {
    return { ok: false, reason: 'HTTP not allowed (requires HTTPS)' };
  }

  // Add https:// if no scheme
  let urlToProcess = trimmed;
  if (!lowerUrl.startsWith('https://')) {
    urlToProcess = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(urlToProcess);

    // Only allow https
    if (parsed.protocol !== 'https:') {
      return { ok: false, reason: 'Must use HTTPS protocol' };
    }

    // Must have hostname
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return { ok: false, reason: 'Missing hostname' };
    }

    // Check for reasonable URL length
    if (parsed.href.length > 2048) {
      return { ok: false, reason: 'URL too long (max 2048 chars)' };
    }

    // Normalize hostname
    const normalized = parsed.href;
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    return {
      ok: true,
      normalized,
      hostname,
    };
  } catch (err) {
    return { ok: false, reason: 'Invalid URL format' };
  }
}

/**
 * Quick validation check (boolean only)
 */
export function isValidUrl(url: string | null | undefined): boolean {
  return validateUrl(url).ok;
}

/**
 * Validates multiple URLs and returns all results
 */
export function validateUrls(urls: (string | null | undefined)[]): ValidateUrlResult[] {
  return urls.map(validateUrl);
}
