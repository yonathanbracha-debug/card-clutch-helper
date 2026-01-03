/**
 * Merchant Categories Taxonomy
 * Single source of truth for all merchant categorization
 */

export const MERCHANT_CATEGORIES = [
  'groceries',
  'dining',
  'travel',
  'gas',
  'transit',
  'entertainment',
  'streaming',
  'drugstores',
  'online_retail',
  'department_store',
  'warehouse_club',
  'utilities',
  'telecom',
  'apparel',
  'home_improvement',
  'electronics',
  'beauty',
  'sports',
  'pet',
  'office',
  'subscription',
  'insurance',
  'financial',
  'other',
] as const;

export type MerchantCategory = typeof MERCHANT_CATEGORIES[number];

export type Confidence = 'high' | 'medium' | 'low';

// Labels for display
export const CATEGORY_LABELS: Record<MerchantCategory, string> = {
  groceries: 'Groceries',
  dining: 'Dining',
  travel: 'Travel',
  gas: 'Gas Stations',
  transit: 'Transit',
  entertainment: 'Entertainment',
  streaming: 'Streaming',
  drugstores: 'Drugstores',
  online_retail: 'Online Retail',
  department_store: 'Department Store',
  warehouse_club: 'Warehouse Club',
  utilities: 'Utilities',
  telecom: 'Telecom',
  apparel: 'Apparel',
  home_improvement: 'Home Improvement',
  electronics: 'Electronics',
  beauty: 'Beauty',
  sports: 'Sports & Outdoors',
  pet: 'Pet Supplies',
  office: 'Office Supplies',
  subscription: 'Subscriptions',
  insurance: 'Insurance',
  financial: 'Financial Services',
  other: 'Other',
};

// Map new categories to old engine categories for compatibility
export function mapToEngineCategory(category: MerchantCategory): string {
  const mapping: Record<MerchantCategory, string> = {
    groceries: 'groceries',
    dining: 'dining',
    travel: 'travel',
    gas: 'gas',
    transit: 'transit',
    entertainment: 'streaming',
    streaming: 'streaming',
    drugstores: 'drugstores',
    online_retail: 'online',
    department_store: 'general',
    warehouse_club: 'groceries',
    utilities: 'general',
    telecom: 'general',
    apparel: 'general',
    home_improvement: 'general',
    electronics: 'online',
    beauty: 'general',
    sports: 'general',
    pet: 'general',
    office: 'general',
    subscription: 'streaming',
    insurance: 'general',
    financial: 'general',
    other: 'general',
  };
  return mapping[category] || 'general';
}

export function isValidCategory(category: string): category is MerchantCategory {
  return MERCHANT_CATEGORIES.includes(category as MerchantCategory);
}
