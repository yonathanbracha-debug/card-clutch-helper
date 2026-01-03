/**
 * Merchant Overrides
 * Stores approved merchant mappings that override registry
 * Persists locally with planned Supabase migration
 */

import { MerchantCategory } from './merchantCategories';

export interface MerchantOverride {
  domain: string;
  displayName?: string;
  category: MerchantCategory;
  verified: true;
  approvedAt: string;
  approvedBy: string;
  rationale?: string;
}

const OVERRIDES_KEY = 'cc_merchant_overrides_v1';

// In-memory cache
let overridesCache: Map<string, MerchantOverride> | null = null;

/**
 * Load overrides from storage
 */
function loadOverrides(): Map<string, MerchantOverride> {
  if (overridesCache) {
    return overridesCache;
  }

  try {
    const stored = localStorage.getItem(OVERRIDES_KEY);
    if (stored) {
      const data: MerchantOverride[] = JSON.parse(stored);
      overridesCache = new Map(data.map(o => [o.domain.toLowerCase(), o]));
    } else {
      overridesCache = new Map();
    }
  } catch (error) {
    console.warn('Failed to load merchant overrides:', error);
    overridesCache = new Map();
  }

  return overridesCache;
}

/**
 * Save overrides to storage
 */
function saveOverrides(): void {
  if (!overridesCache) return;
  
  try {
    const data = Array.from(overridesCache.values());
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save merchant overrides:', error);
  }
}

/**
 * Get an override for a domain
 */
export function getOverride(domain: string): MerchantOverride | null {
  const overrides = loadOverrides();
  return overrides.get(domain.toLowerCase()) || null;
}

/**
 * Add or update an override
 */
export function setOverride(override: MerchantOverride): void {
  const overrides = loadOverrides();
  overrides.set(override.domain.toLowerCase(), override);
  saveOverrides();
}

/**
 * Remove an override
 */
export function removeOverride(domain: string): void {
  const overrides = loadOverrides();
  overrides.delete(domain.toLowerCase());
  saveOverrides();
}

/**
 * Get all overrides
 */
export function getAllOverrides(): MerchantOverride[] {
  const overrides = loadOverrides();
  return Array.from(overrides.values());
}

/**
 * Clear all overrides
 */
export function clearOverrides(): void {
  overridesCache = new Map();
  try {
    localStorage.removeItem(OVERRIDES_KEY);
  } catch (error) {
    console.warn('Failed to clear merchant overrides:', error);
  }
}

/**
 * Create an override from an approved suggestion
 */
export function createOverrideFromApproval(
  domain: string,
  displayName: string,
  category: MerchantCategory,
  rationale?: string
): MerchantOverride {
  const override: MerchantOverride = {
    domain: domain.toLowerCase(),
    displayName,
    category,
    verified: true,
    approvedAt: new Date().toISOString(),
    approvedBy: 'admin',
    rationale,
  };

  setOverride(override);
  return override;
}
