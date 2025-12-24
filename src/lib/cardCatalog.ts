// CardClutch Canonical Card Catalog
// Single source of truth for all card data
// Last updated: 2024-12-24

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover';

export interface CardReward {
  category: string;
  multiplier: number;
  notes?: string;
  caps?: string;
}

export interface CardArtwork {
  kind: 'gradient';
  primary: string;
  secondary: string;
  accent?: string;
  pattern?: 'metallic' | 'minimal' | 'premium' | 'standard';
}

export interface Card {
  id: string;
  name: string;
  issuer: string;
  network: CardNetwork;
  annual_fee_cents: number;
  last_verified: string;
  rewards: CardReward[];
  exclusions: string[];
  highlights: string[];
  artwork: CardArtwork;
  foreign_tx_fee_percent: number | null;
  credits_summary?: string;
}

export const cardCatalog: Card[] = [
  // === AMERICAN EXPRESS ===
  {
    id: 'amex-gold',
    name: 'Gold Card',
    issuer: 'American Express',
    network: 'amex',
    annual_fee_cents: 32500,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Dining', multiplier: 4, notes: 'Restaurants worldwide' },
      { category: 'U.S. Supermarkets', multiplier: 4, notes: 'Excludes warehouse clubs', caps: 'Up to $25,000/year' },
      { category: 'Flights', multiplier: 3, notes: 'Booked directly with airlines or Amex Travel' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target', 'Amazon Fresh', 'Wholesale clubs'],
    highlights: [
      '$120 Uber Cash credit annually',
      '$120 dining credit at select restaurants',
      '$100 airline fee credit',
      'No foreign transaction fees',
    ],
    artwork: { kind: 'gradient', primary: '#B8860B', secondary: '#DAA520', accent: '#FFD700', pattern: 'metallic' },
    foreign_tx_fee_percent: 0,
    credits_summary: '$120 Uber + $120 dining + $100 airline fee credits',
  },
  {
    id: 'amex-platinum',
    name: 'Platinum Card',
    issuer: 'American Express',
    network: 'amex',
    annual_fee_cents: 69500,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Flights (Amex Travel)', multiplier: 5, notes: 'Booked through Amex Travel portal' },
      { category: 'Flights (Direct)', multiplier: 5, notes: 'Booked directly with airlines' },
      { category: 'Hotels (Amex Travel)', multiplier: 5, notes: 'Prepaid through Amex Travel' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      '$200 airline fee credit',
      '$200 hotel credit (Fine Hotels + Resorts)',
      '$240 digital entertainment credit',
      'Priority Pass & Centurion lounge access',
    ],
    artwork: { kind: 'gradient', primary: '#C0C0C0', secondary: '#E8E8E8', accent: '#A9A9A9', pattern: 'metallic' },
    foreign_tx_fee_percent: 0,
    credits_summary: '$200 airline + $200 hotel + $240 digital entertainment',
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred',
    issuer: 'American Express',
    network: 'amex',
    annual_fee_cents: 9500,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'U.S. Supermarkets', multiplier: 6, notes: 'At U.S. supermarkets', caps: 'Up to $6,000/year, then 1%' },
      { category: 'Streaming', multiplier: 6, notes: 'Select U.S. streaming subscriptions' },
      { category: 'Transit', multiplier: 3, notes: 'Including rideshare' },
      { category: 'Gas Stations', multiplier: 3, notes: 'U.S. gas stations' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target', 'Wholesale clubs'],
    highlights: [
      'Best for grocery spending',
      'Strong streaming cashback',
      'Transit bonus category',
    ],
    artwork: { kind: 'gradient', primary: '#1E3A5F', secondary: '#2E5A8F', accent: '#4A90D9', pattern: 'standard' },
    foreign_tx_fee_percent: 2.7,
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday',
    issuer: 'American Express',
    network: 'amex',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'U.S. Supermarkets', multiplier: 3, caps: 'Up to $6,000/year, then 1%' },
      { category: 'Gas Stations', multiplier: 3, notes: 'U.S. gas stations' },
      { category: 'Online Retail', multiplier: 3, caps: 'Up to $6,000/year, then 1%' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target'],
    highlights: [
      'No annual fee',
      'Good everyday earner',
      'Online shopping bonus',
    ],
    artwork: { kind: 'gradient', primary: '#4169E1', secondary: '#6495ED', accent: '#87CEEB', pattern: 'standard' },
    foreign_tx_fee_percent: 2.7,
  },

  // === CHASE ===
  {
    id: 'chase-sapphire-preferred',
    name: 'Sapphire Preferred',
    issuer: 'Chase',
    network: 'visa',
    annual_fee_cents: 9500,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Travel (Chase Portal)', multiplier: 5, notes: 'Booked through Chase Travel' },
      { category: 'Dining', multiplier: 3 },
      { category: 'Streaming Services', multiplier: 3 },
      { category: 'Online Grocery', multiplier: 3, notes: 'Excludes Target, Walmart' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: ['Target', 'Walmart'],
    highlights: [
      'Points worth 25% more via Chase Travel',
      'Transfer to airline/hotel partners',
      'No foreign transaction fees',
    ],
    artwork: { kind: 'gradient', primary: '#1A1F71', secondary: '#2E3A8C', accent: '#4169E1', pattern: 'premium' },
    foreign_tx_fee_percent: 0,
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Sapphire Reserve',
    issuer: 'Chase',
    network: 'visa',
    annual_fee_cents: 55000,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Hotels (Chase Travel)', multiplier: 10, notes: 'Hotels & car rentals via Chase Travel' },
      { category: 'Flights (Chase Travel)', multiplier: 5, notes: 'Via Chase Travel' },
      { category: 'Dining', multiplier: 3 },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      '$300 annual travel credit',
      'Points worth 50% more via Chase Travel',
      'Priority Pass lounge access',
      'No foreign transaction fees',
    ],
    artwork: { kind: 'gradient', primary: '#0D1B2A', secondary: '#1B263B', accent: '#415A77', pattern: 'premium' },
    foreign_tx_fee_percent: 0,
    credits_summary: '$300 annual travel credit',
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Freedom Unlimited',
    issuer: 'Chase',
    network: 'visa',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Travel (Chase Portal)', multiplier: 5, notes: 'Via Chase portal' },
      { category: 'Dining', multiplier: 3 },
      { category: 'Drugstores', multiplier: 3 },
      { category: 'All Other Purchases', multiplier: 1.5 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      '1.5% base rate on everything',
      'Good base card for Chase ecosystem',
    ],
    artwork: { kind: 'gradient', primary: '#1E3A5F', secondary: '#3D5A80', accent: '#98C1D9', pattern: 'standard' },
    foreign_tx_fee_percent: 3,
  },
  {
    id: 'chase-freedom-flex',
    name: 'Freedom Flex',
    issuer: 'Chase',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Quarterly Categories', multiplier: 5, notes: 'Rotating categories, activation required', caps: 'Up to $1,500/quarter' },
      { category: 'Travel (Chase Portal)', multiplier: 5, notes: 'Via Chase portal' },
      { category: 'Dining', multiplier: 3 },
      { category: 'Drugstores', multiplier: 3 },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      '5% rotating quarterly categories',
      'Must activate categories each quarter',
    ],
    artwork: { kind: 'gradient', primary: '#2E4057', secondary: '#4F6D7A', accent: '#88A0A8', pattern: 'standard' },
    foreign_tx_fee_percent: 3,
  },

  // === CITI ===
  {
    id: 'citi-double-cash',
    name: 'Double Cash',
    issuer: 'Citi',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'All Purchases', multiplier: 2, notes: '1% when you buy, 1% when you pay' },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Simple 2% on everything',
      'Must pay bill to earn full 2%',
    ],
    artwork: { kind: 'gradient', primary: '#003366', secondary: '#0055A5', accent: '#0077CC', pattern: 'standard' },
    foreign_tx_fee_percent: 3,
  },
  {
    id: 'citi-custom-cash',
    name: 'Custom Cash',
    issuer: 'Citi',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Top Eligible Category', multiplier: 5, notes: 'Auto-selected based on spending', caps: 'Up to $500/billing cycle' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Automatic category selection',
      'Great for focused spending',
    ],
    artwork: { kind: 'gradient', primary: '#1A365D', secondary: '#2C5282', accent: '#4299E1', pattern: 'standard' },
    foreign_tx_fee_percent: 3,
  },

  // === CAPITAL ONE ===
  {
    id: 'capital-one-savor-one',
    name: 'SavorOne',
    issuer: 'Capital One',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Dining', multiplier: 3 },
      { category: 'Entertainment', multiplier: 3 },
      { category: 'Streaming', multiplier: 3 },
      { category: 'Grocery Stores', multiplier: 3, notes: 'Excludes wholesale clubs' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: ['Costco', 'Sam\'s Club', 'Wholesale clubs'],
    highlights: [
      'No annual fee',
      'No foreign transaction fees',
      'Great for dining and entertainment',
    ],
    artwork: { kind: 'gradient', primary: '#1A1A2E', secondary: '#16213E', accent: '#0F3460', pattern: 'standard' },
    foreign_tx_fee_percent: 0,
  },
  {
    id: 'capital-one-venture',
    name: 'Venture',
    issuer: 'Capital One',
    network: 'visa',
    annual_fee_cents: 9500,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'All Purchases', multiplier: 2, notes: '2X miles on every purchase' },
    ],
    exclusions: [],
    highlights: [
      'Simple 2X on everything',
      'Miles transfer to 15+ partners',
      'No foreign transaction fees',
    ],
    artwork: { kind: 'gradient', primary: '#2D3436', secondary: '#636E72', accent: '#B2BEC3', pattern: 'standard' },
    foreign_tx_fee_percent: 0,
  },
  {
    id: 'capital-one-venture-x',
    name: 'Venture X',
    issuer: 'Capital One',
    network: 'visa',
    annual_fee_cents: 39500,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Hotels (C1 Travel)', multiplier: 10, notes: 'Via Capital One Travel' },
      { category: 'Flights (C1 Travel)', multiplier: 5, notes: 'Via Capital One Travel' },
      { category: 'All Other Purchases', multiplier: 2 },
    ],
    exclusions: [],
    highlights: [
      '$300 annual travel credit',
      '10,000 bonus miles annually',
      'Priority Pass & Capital One lounges',
    ],
    artwork: { kind: 'gradient', primary: '#1A1A1A', secondary: '#333333', accent: '#4A4A4A', pattern: 'premium' },
    foreign_tx_fee_percent: 0,
    credits_summary: '$300 annual travel credit + 10,000 bonus miles',
  },
  {
    id: 'capital-one-quicksilver',
    name: 'Quicksilver',
    issuer: 'Capital One',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'All Purchases', multiplier: 1.5, notes: 'Flat 1.5% cash back' },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Simple 1.5% on everything',
      'No foreign transaction fees',
    ],
    artwork: { kind: 'gradient', primary: '#3D3D3D', secondary: '#5C5C5C', accent: '#7B7B7B', pattern: 'standard' },
    foreign_tx_fee_percent: 0,
  },

  // === DISCOVER ===
  {
    id: 'discover-it',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    network: 'discover',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Quarterly Categories', multiplier: 5, notes: 'Rotating categories, activation required', caps: 'Up to $1,500/quarter' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Cashback Match first year',
      '5% rotating quarterly categories',
    ],
    artwork: { kind: 'gradient', primary: '#FF6600', secondary: '#FF8533', accent: '#FFA366', pattern: 'standard' },
    foreign_tx_fee_percent: 0,
  },
  {
    id: 'discover-it-student',
    name: 'Discover it Student',
    issuer: 'Discover',
    network: 'discover',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Quarterly Categories', multiplier: 5, notes: 'Rotating categories, activation required', caps: 'Up to $1,500/quarter' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Good grades reward',
      'Cashback Match first year',
    ],
    artwork: { kind: 'gradient', primary: '#E65C00', secondary: '#F08030', accent: '#FFA060', pattern: 'standard' },
    foreign_tx_fee_percent: 0,
  },

  // === WELLS FARGO ===
  {
    id: 'wells-fargo-active-cash',
    name: 'Active Cash',
    issuer: 'Wells Fargo',
    network: 'visa',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'All Purchases', multiplier: 2, notes: 'Flat 2% cash back' },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Simple 2% on everything',
      'No activation required',
    ],
    artwork: { kind: 'gradient', primary: '#C41230', secondary: '#D32F2F', accent: '#FFEB3B', pattern: 'standard' },
    foreign_tx_fee_percent: 3,
  },

  // === APPLE ===
  {
    id: 'apple-card',
    name: 'Apple Card',
    issuer: 'Apple',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Apple Purchases', multiplier: 3, notes: 'Apple Pay at Apple' },
      { category: 'Apple Pay Purchases', multiplier: 2, notes: 'Using Apple Pay anywhere' },
      { category: 'Physical Card', multiplier: 1, notes: 'Using the titanium card' },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'No foreign transaction fees',
      'Daily Cash rewards',
      'Clean titanium design',
    ],
    artwork: { kind: 'gradient', primary: '#F5F5F7', secondary: '#FFFFFF', accent: '#E8E8ED', pattern: 'minimal' },
    foreign_tx_fee_percent: 0,
  },

  // === BILT ===
  {
    id: 'bilt-mastercard',
    name: 'Bilt Mastercard',
    issuer: 'Bilt',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Rent Payments', multiplier: 1, notes: 'No fee to pay rent with card' },
      { category: 'Dining', multiplier: 3 },
      { category: 'Travel', multiplier: 2 },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Earn points on rent',
      'Transfer to airline/hotel partners',
      'Must make 5 transactions/month to earn',
    ],
    artwork: { kind: 'gradient', primary: '#1A1A1A', secondary: '#2D2D2D', accent: '#404040', pattern: 'minimal' },
    foreign_tx_fee_percent: 0,
  },

  // === BANK OF AMERICA ===
  {
    id: 'bofa-customized-cash',
    name: 'Customized Cash Rewards',
    issuer: 'Bank of America',
    network: 'visa',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Choice Category', multiplier: 3, notes: 'Gas, online shopping, dining, travel, drug stores, or home improvement', caps: 'Up to $2,500/quarter' },
      { category: 'Grocery Stores', multiplier: 2, notes: 'And wholesale clubs', caps: 'Up to $2,500/quarter' },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Choose your 3% category',
      'Preferred Rewards bonus up to 75%',
    ],
    artwork: { kind: 'gradient', primary: '#012169', secondary: '#0033A0', accent: '#E31837', pattern: 'standard' },
    foreign_tx_fee_percent: 3,
  },

  // === US BANK ===
  {
    id: 'usbank-altitude-go',
    name: 'Altitude Go',
    issuer: 'U.S. Bank',
    network: 'visa',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Dining', multiplier: 4 },
      { category: 'Grocery Stores', multiplier: 2 },
      { category: 'Streaming Services', multiplier: 2 },
      { category: 'Gas Stations', multiplier: 2 },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      '4X dining is competitive',
      'No foreign transaction fees',
    ],
    artwork: { kind: 'gradient', primary: '#002868', secondary: '#0046AD', accent: '#BF0A30', pattern: 'standard' },
    foreign_tx_fee_percent: 0,
  },
  {
    id: 'usbank-cash-plus',
    name: 'Cash+',
    issuer: 'U.S. Bank',
    network: 'visa',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'Two Choice Categories', multiplier: 5, notes: 'Select 2 categories each quarter', caps: 'Up to $2,000/quarter combined' },
      { category: 'Grocery & Gas', multiplier: 2 },
      { category: 'All Other Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'Choose your 5% categories',
      'Utilities can be a 5% category',
    ],
    artwork: { kind: 'gradient', primary: '#003B70', secondary: '#005CAA', accent: '#7EC8E3', pattern: 'standard' },
    foreign_tx_fee_percent: 3,
  },

  // === BARCLAYS ===
  {
    id: 'barclays-view',
    name: 'Barclays View',
    issuer: 'Barclays',
    network: 'mastercard',
    annual_fee_cents: 0,
    last_verified: '2024-12-24',
    rewards: [
      { category: 'All Purchases', multiplier: 1 },
    ],
    exclusions: [],
    highlights: [
      'No annual fee',
      'View your FICO score',
      'Cell phone protection',
    ],
    artwork: { kind: 'gradient', primary: '#00AEEF', secondary: '#0082C8', accent: '#005691', pattern: 'standard' },
    foreign_tx_fee_percent: 0,
  },
];

// Network display labels
export const networkLabels: Record<CardNetwork, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
};

// Get card by ID
export function getCardById(id: string): Card | undefined {
  return cardCatalog.find(card => card.id === id);
}

// Get cards by issuer
export function getCardsByIssuer(issuer: string): Card[] {
  return cardCatalog.filter(card => card.issuer === issuer);
}

// Get all unique issuers
export function getAllIssuers(): string[] {
  return [...new Set(cardCatalog.map(card => card.issuer))].sort();
}

// Format annual fee
export function formatAnnualFee(cents: number | null): string {
  if (cents === null) return 'Verify';
  if (cents === 0) return 'No annual fee';
  return `$${cents / 100}/year`;
}

// Format multiplier with category
export function formatReward(reward: CardReward): string {
  return `${reward.multiplier}x ${reward.category}`;
}

// Get reward summary string
export function getRewardSummary(rewards: CardReward[]): string {
  return rewards
    .filter(r => r.multiplier > 1)
    .slice(0, 3)
    .map(r => formatReward(r))
    .join(', ');
}
