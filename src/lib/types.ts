// CardClutch Shared Types
// Single source of truth for types used across the application

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover';

export type MerchantCategory =
  | 'dining'
  | 'groceries'
  | 'travel'
  | 'flights'
  | 'hotels'
  | 'gas'
  | 'transit'
  | 'streaming'
  | 'drugstores'
  | 'online'
  | 'general';

export const categoryLabels: Record<MerchantCategory, string> = {
  dining: 'Dining',
  groceries: 'Groceries',
  travel: 'Travel',
  flights: 'Flights',
  hotels: 'Hotels',
  gas: 'Gas Stations',
  transit: 'Transit',
  streaming: 'Streaming',
  drugstores: 'Drugstores',
  online: 'Online Shopping',
  general: 'General',
};

export interface MerchantMapping {
  domain: string;
  name: string;
  category: MerchantCategory;
  excludedFromGrocery?: boolean;
  isWarehouse?: boolean;
}

// Network display labels
export const networkLabels: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
};

// Format annual fee helper
export function formatAnnualFee(cents: number): string {
  if (cents === 0) return 'No annual fee';
  return `$${cents / 100}/year`;
}
