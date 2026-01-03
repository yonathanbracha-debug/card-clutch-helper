/**
 * Card URL Validation Utilities
 * Bank-grade validation for outbound credit card links (Learn More / Apply)
 * 
 * EXTENDING ALLOWLISTS:
 * 1. Add new issuer to ISSUER_DOMAIN_ALLOWLISTS with their official domains
 * 2. Use exact domain or parent domain (subdomains auto-allowed)
 * 3. Test with validateCardOutboundUrl() before deployment
 * 4. Document the source of each domain addition
 * 
 * SECURITY NOTES:
 * - Only https:// is accepted
 * - Lookalike domains (chase.com.evil.com) are blocked
 * - All links render with rel="noopener noreferrer" target="_blank"
 */

// Issuer domain allowlists - official domains only
export const ISSUER_DOMAIN_ALLOWLISTS: Record<string, string[]> = {
  'American Express': [
    'americanexpress.com',
    'amex.com',
  ],
  'Chase': [
    'chase.com',
  ],
  'Capital One': [
    'capitalone.com',
  ],
  'Citi': [
    'citi.com',
    'citicards.com',
  ],
  'Discover': [
    'discover.com',
  ],
  'Bank of America': [
    'bankofamerica.com',
  ],
  'Wells Fargo': [
    'wellsfargo.com',
  ],
  'U.S. Bank': [
    'usbank.com',
  ],
  'Barclays': [
    'barclays.com',
    'barclaycardus.com',
    'barclaycards.com',
  ],
  'Apple': [
    'apple.com',
  ],
  'Bilt': [
    'bilt.com',
  ],
  'Synchrony': [
    'synchrony.com',
    'synchronybank.com',
  ],
  'USAA': [
    'usaa.com',
  ],
  'Navy Federal': [
    'navyfederal.org',
  ],
  'PNC': [
    'pnc.com',
  ],
  'TD Bank': [
    'td.com',
    'tdbank.com',
  ],
};

// Dangerous URL schemes that must be blocked
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

export interface UrlStatus {
  isValid: boolean;
  reason?: string;
  normalizedUrl?: string;
  displayHost?: string;
  blocked: boolean;
}

/**
 * Normalizes a URL to https with lowercase hostname
 * Returns null if URL is invalid or uses http (not https)
 */
export function normalizeHttpsUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) {
    return null;
  }

  // Check for dangerous schemes (case-insensitive)
  const lowerUrl = trimmed.toLowerCase();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lowerUrl.startsWith(scheme)) {
      return null;
    }
  }

  // Reject http:// - only https allowed for card links
  if (lowerUrl.startsWith('http://')) {
    return null;
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
      return null;
    }

    // Normalize: lowercase hostname, remove default port, keep path/query
    parsed.hostname = parsed.hostname.toLowerCase();
    
    // Remove trailing slash from path if it's just "/"
    if (parsed.pathname === '/') {
      return parsed.origin;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Checks if a hostname is allowed by the issuer's domain allowlist
 * Supports exact match and subdomain matching
 * Blocks lookalike domains (e.g., chase.com.evil.com)
 */
export function isHostnameAllowed(hostname: string, allowlist: string[]): boolean {
  if (!hostname || !allowlist || allowlist.length === 0) {
    return false;
  }

  const normalizedHost = hostname.toLowerCase().trim();
  
  // Remove www. prefix for comparison
  const hostWithoutWww = normalizedHost.startsWith('www.') 
    ? normalizedHost.substring(4) 
    : normalizedHost;

  for (const allowed of allowlist) {
    const normalizedAllowed = allowed.toLowerCase().trim();
    
    // Exact match
    if (hostWithoutWww === normalizedAllowed) {
      return true;
    }
    
    // Subdomain match: hostname must end with .allowedDomain
    // This prevents lookalikes: chase.com.evil.com would NOT match chase.com
    // Because we check for ".chase.com" at the end, not just "chase.com" anywhere
    if (hostWithoutWww.endsWith('.' + normalizedAllowed)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates an outbound card URL against security rules and issuer allowlist
 */
export function validateCardOutboundUrl(
  url: string | null | undefined,
  allowlist: string[]
): UrlStatus {
  // Null/undefined URL is valid (just means no link available)
  if (!url) {
    return {
      isValid: true,
      blocked: false,
      reason: 'No URL provided',
    };
  }

  // Normalize the URL
  const normalized = normalizeHttpsUrl(url);
  if (!normalized) {
    return {
      isValid: false,
      blocked: true,
      reason: 'Invalid URL format or insecure scheme (requires https)',
    };
  }

  // Extract hostname
  let hostname: string;
  try {
    const parsed = new URL(normalized);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return {
      isValid: false,
      blocked: true,
      reason: 'Could not parse URL',
    };
  }

  // Check allowlist
  if (!isHostnameAllowed(hostname, allowlist)) {
    return {
      isValid: false,
      blocked: true,
      reason: `Domain "${hostname}" not in issuer allowlist`,
      displayHost: hostname,
    };
  }

  // Valid URL
  return {
    isValid: true,
    blocked: false,
    normalizedUrl: normalized,
    displayHost: hostname.replace(/^www\./, ''),
  };
}

/**
 * Gets the domain allowlist for an issuer
 */
export function getIssuerAllowlist(issuer: string): string[] {
  return ISSUER_DOMAIN_ALLOWLISTS[issuer] || [];
}

/**
 * Validates both learn more and apply URLs for a card
 */
export function validateCardUrls(
  issuer: string,
  learnMoreUrl?: string | null,
  applyUrl?: string | null,
  customAllowlist?: string[]
): { learnMore: UrlStatus; apply: UrlStatus } {
  const allowlist = customAllowlist || getIssuerAllowlist(issuer);
  
  return {
    learnMore: validateCardOutboundUrl(learnMoreUrl, allowlist),
    apply: validateCardOutboundUrl(applyUrl, allowlist),
  };
}
