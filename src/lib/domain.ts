/**
 * Domain Extraction and Normalization Utilities
 */

/**
 * Extracts the registrable domain from a URL or hostname
 * Handles www., subdomains, and invalid URLs gracefully
 * @returns normalized domain or null if invalid
 */
export function extractRegistrableDomain(urlOrHostname: string): string | null {
  if (!urlOrHostname || typeof urlOrHostname !== 'string') {
    return null;
  }

  let input = urlOrHostname.trim().toLowerCase();
  
  // Check for dangerous schemes
  const dangerousSchemes = ['javascript:', 'data:', 'file:', 'chrome:', 'about:', 'vbscript:', 'blob:'];
  for (const scheme of dangerousSchemes) {
    if (input.startsWith(scheme)) {
      return null;
    }
  }

  // Try parsing as URL first
  try {
    // Add protocol if missing
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      input = 'https://' + input;
    }
    
    const url = new URL(input);
    let hostname = url.hostname.toLowerCase();
    
    // Remove www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // Validate hostname has at least one dot
    if (!hostname.includes('.')) {
      return null;
    }
    
    // Reject IP address literals
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return null;
    }
    
    // Reject IPv6 literals
    if (hostname.startsWith('[') || hostname.includes(':')) {
      return null;
    }
    
    return hostname;
  } catch {
    // Try extracting without URL parsing for malformed inputs
    let hostname = input.replace(/^(https?:\/\/)?(www\.)?/i, '');
    hostname = hostname.split('/')[0].split('?')[0].split('#')[0];
    
    if (hostname.includes('.') && !hostname.includes(' ')) {
      return hostname;
    }
    
    return null;
  }
}

/**
 * Checks if two domains are the same (after normalization)
 */
export function domainMatches(domain1: string, domain2: string): boolean {
  const d1 = extractRegistrableDomain(domain1);
  const d2 = extractRegistrableDomain(domain2);
  
  if (!d1 || !d2) return false;
  
  // Exact match
  if (d1 === d2) return true;
  
  // Suffix match (sub.domain.com matches domain.com)
  if (d1.endsWith('.' + d2) || d2.endsWith('.' + d1)) return true;
  
  return false;
}

/**
 * Extracts the base domain (e.g., amazon.com from sub.amazon.com)
 */
export function getBaseDomain(hostname: string): string | null {
  const domain = extractRegistrableDomain(hostname);
  if (!domain) return null;
  
  const parts = domain.split('.');
  
  // Handle two-part TLDs like co.uk
  const twoPartTlds = ['co.uk', 'com.au', 'co.nz', 'co.jp', 'com.br', 'com.mx'];
  const lastTwo = parts.slice(-2).join('.');
  
  if (twoPartTlds.includes(lastTwo) && parts.length > 2) {
    return parts.slice(-3).join('.');
  }
  
  // Return last two parts for standard TLDs
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  
  return domain;
}
