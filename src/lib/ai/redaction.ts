// C6: Redaction utilities for PII removal before persistence

// Patterns for PII detection
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_PATTERN = /\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
const SSN_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;
const CARD_NUMBER_PATTERN = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
const ADDRESS_PATTERN = /\b\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)\b/gi;
const ZIP_PATTERN = /\b\d{5}(?:-\d{4})?\b/g;
const ACCOUNT_NUMBER_PATTERN = /\b(?:account|acct)\s*#?\s*\d{6,}\b/gi;

interface RedactionResult {
  text: string;
  redactedCount: number;
  types: string[];
}

/**
 * Redact PII from text
 * Returns redacted text with placeholders
 */
export function redactPII(text: string): RedactionResult {
  let result = text;
  const types: string[] = [];
  let redactedCount = 0;

  // Email
  const emails = result.match(EMAIL_PATTERN);
  if (emails) {
    redactedCount += emails.length;
    types.push('email');
    result = result.replace(EMAIL_PATTERN, '[EMAIL]');
  }

  // Phone
  const phones = result.match(PHONE_PATTERN);
  if (phones) {
    redactedCount += phones.length;
    types.push('phone');
    result = result.replace(PHONE_PATTERN, '[PHONE]');
  }

  // SSN
  const ssns = result.match(SSN_PATTERN);
  if (ssns) {
    redactedCount += ssns.length;
    types.push('ssn');
    result = result.replace(SSN_PATTERN, '[SSN]');
  }

  // Card numbers
  const cards = result.match(CARD_NUMBER_PATTERN);
  if (cards) {
    redactedCount += cards.length;
    types.push('card_number');
    result = result.replace(CARD_NUMBER_PATTERN, '[CARD_NUMBER]');
  }

  // Addresses
  const addresses = result.match(ADDRESS_PATTERN);
  if (addresses) {
    redactedCount += addresses.length;
    types.push('address');
    result = result.replace(ADDRESS_PATTERN, '[ADDRESS]');
  }

  // ZIP codes (only redact if other address info present)
  if (types.includes('address')) {
    const zips = result.match(ZIP_PATTERN);
    if (zips) {
      redactedCount += zips.length;
      types.push('zip');
      result = result.replace(ZIP_PATTERN, '[ZIP]');
    }
  }

  // Account numbers
  const accounts = result.match(ACCOUNT_NUMBER_PATTERN);
  if (accounts) {
    redactedCount += accounts.length;
    types.push('account_number');
    result = result.replace(ACCOUNT_NUMBER_PATTERN, '[ACCOUNT]');
  }

  return {
    text: result,
    redactedCount,
    types,
  };
}

/**
 * Redact PII from answer schema object
 * Deep clones and redacts string fields
 */
export function redactAnswerSchema(answer: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(answer)) {
    if (typeof value === 'string') {
      redacted[key] = redactPII(value).text;
    } else if (Array.isArray(value)) {
      redacted[key] = value.map(item => {
        if (typeof item === 'string') {
          return redactPII(item).text;
        } else if (typeof item === 'object' && item !== null) {
          return redactAnswerSchema(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactAnswerSchema(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
