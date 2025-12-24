export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  color: string;
  rewards: CardReward[];
  annualFee: number;
  image?: string;
}

export interface CardReward {
  category: string;
  multiplier: number;
  description: string;
  exclusions?: string[];
}

export const creditCards: CreditCard[] = [
  {
    id: 'amex-gold',
    name: 'Gold Card',
    issuer: 'American Express',
    color: 'from-amber-400 to-amber-600',
    annualFee: 250,
    rewards: [
      {
        category: 'dining',
        multiplier: 4,
        description: '4X points at restaurants worldwide',
      },
      {
        category: 'groceries',
        multiplier: 4,
        description: '4X points at U.S. supermarkets',
        exclusions: ['costco', 'samsclub', 'walmart', 'target'],
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X points on other purchases',
      },
    ],
  },
  {
    id: 'capital-one-savor',
    name: 'SavorOne',
    issuer: 'Capital One',
    color: 'from-red-500 to-red-700',
    annualFee: 0,
    rewards: [
      {
        category: 'dining',
        multiplier: 3,
        description: '3% cash back on dining',
      },
      {
        category: 'groceries',
        multiplier: 3,
        description: '3% cash back at grocery stores',
      },
      {
        category: 'entertainment',
        multiplier: 3,
        description: '3% cash back on entertainment',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% cash back on other purchases',
      },
    ],
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Freedom Unlimited',
    issuer: 'Chase',
    color: 'from-blue-500 to-blue-700',
    annualFee: 0,
    rewards: [
      {
        category: 'dining',
        multiplier: 3,
        description: '3% cash back on dining',
      },
      {
        category: 'drugstores',
        multiplier: 3,
        description: '3% cash back at drugstores',
      },
      {
        category: 'general',
        multiplier: 1.5,
        description: '1.5% cash back on everything else',
      },
    ],
  },
  {
    id: 'discover-it',
    name: 'Discover it',
    issuer: 'Discover',
    color: 'from-orange-400 to-orange-600',
    annualFee: 0,
    rewards: [
      {
        category: 'rotating',
        multiplier: 5,
        description: '5% cash back on rotating categories (quarterly)',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% cash back on other purchases',
      },
    ],
  },
];

export type MerchantCategory = 
  | 'dining'
  | 'groceries'
  | 'warehouse'
  | 'apparel'
  | 'general'
  | 'entertainment'
  | 'travel'
  | 'gas'
  | 'drugstores';

export interface MerchantMapping {
  domain: string;
  name: string;
  category: MerchantCategory;
  isWarehouse?: boolean;
}

export const merchantMappings: MerchantMapping[] = [
  // Groceries
  { domain: 'instacart.com', name: 'Instacart', category: 'groceries' },
  { domain: 'publix.com', name: 'Publix', category: 'groceries' },
  { domain: 'kroger.com', name: 'Kroger', category: 'groceries' },
  { domain: 'safeway.com', name: 'Safeway', category: 'groceries' },
  { domain: 'wholefoods.com', name: 'Whole Foods', category: 'groceries' },
  { domain: 'traderjoes.com', name: "Trader Joe's", category: 'groceries' },
  { domain: 'wegmans.com', name: 'Wegmans', category: 'groceries' },
  { domain: 'albertsons.com', name: 'Albertsons', category: 'groceries' },
  { domain: 'heb.com', name: 'H-E-B', category: 'groceries' },
  { domain: 'aldi.us', name: 'Aldi', category: 'groceries' },
  
  // Warehouse clubs (excluded from Amex grocery bonus)
  { domain: 'costco.com', name: 'Costco', category: 'warehouse', isWarehouse: true },
  { domain: 'samsclub.com', name: "Sam's Club", category: 'warehouse', isWarehouse: true },
  { domain: 'bjs.com', name: "BJ's", category: 'warehouse', isWarehouse: true },
  
  // Big box retail
  { domain: 'walmart.com', name: 'Walmart', category: 'general', isWarehouse: true },
  { domain: 'target.com', name: 'Target', category: 'general', isWarehouse: true },
  
  // Dining
  { domain: 'doordash.com', name: 'DoorDash', category: 'dining' },
  { domain: 'ubereats.com', name: 'Uber Eats', category: 'dining' },
  { domain: 'grubhub.com', name: 'Grubhub', category: 'dining' },
  { domain: 'postmates.com', name: 'Postmates', category: 'dining' },
  { domain: 'seamless.com', name: 'Seamless', category: 'dining' },
  { domain: 'chipotle.com', name: 'Chipotle', category: 'dining' },
  { domain: 'starbucks.com', name: 'Starbucks', category: 'dining' },
  { domain: 'dominos.com', name: "Domino's", category: 'dining' },
  { domain: 'pizzahut.com', name: 'Pizza Hut', category: 'dining' },
  { domain: 'mcdonalds.com', name: "McDonald's", category: 'dining' },
  { domain: 'chick-fil-a.com', name: 'Chick-fil-A', category: 'dining' },
  
  // Apparel
  { domain: 'nike.com', name: 'Nike', category: 'apparel' },
  { domain: 'adidas.com', name: 'Adidas', category: 'apparel' },
  { domain: 'skims.com', name: 'SKIMS', category: 'apparel' },
  { domain: 'zara.com', name: 'Zara', category: 'apparel' },
  { domain: 'hm.com', name: 'H&M', category: 'apparel' },
  { domain: 'uniqlo.com', name: 'Uniqlo', category: 'apparel' },
  { domain: 'gap.com', name: 'Gap', category: 'apparel' },
  { domain: 'oldnavy.com', name: 'Old Navy', category: 'apparel' },
  { domain: 'nordstrom.com', name: 'Nordstrom', category: 'apparel' },
  { domain: 'macys.com', name: "Macy's", category: 'apparel' },
  { domain: 'lululemon.com', name: 'Lululemon', category: 'apparel' },
  
  // General retail
  { domain: 'amazon.com', name: 'Amazon', category: 'general' },
  { domain: 'bestbuy.com', name: 'Best Buy', category: 'general' },
  { domain: 'homedepot.com', name: 'Home Depot', category: 'general' },
  { domain: 'lowes.com', name: "Lowe's", category: 'general' },
  { domain: 'etsy.com', name: 'Etsy', category: 'general' },
  { domain: 'ebay.com', name: 'eBay', category: 'general' },
  { domain: 'wayfair.com', name: 'Wayfair', category: 'general' },
  { domain: 'ikea.com', name: 'IKEA', category: 'general' },
  
  // Entertainment
  { domain: 'netflix.com', name: 'Netflix', category: 'entertainment' },
  { domain: 'spotify.com', name: 'Spotify', category: 'entertainment' },
  { domain: 'hulu.com', name: 'Hulu', category: 'entertainment' },
  { domain: 'disneyplus.com', name: 'Disney+', category: 'entertainment' },
  { domain: 'hbomax.com', name: 'Max', category: 'entertainment' },
  { domain: 'max.com', name: 'Max', category: 'entertainment' },
  
  // Travel
  { domain: 'airbnb.com', name: 'Airbnb', category: 'travel' },
  { domain: 'booking.com', name: 'Booking.com', category: 'travel' },
  { domain: 'expedia.com', name: 'Expedia', category: 'travel' },
  { domain: 'hotels.com', name: 'Hotels.com', category: 'travel' },
  { domain: 'united.com', name: 'United Airlines', category: 'travel' },
  { domain: 'delta.com', name: 'Delta Airlines', category: 'travel' },
  { domain: 'southwest.com', name: 'Southwest Airlines', category: 'travel' },
  { domain: 'aa.com', name: 'American Airlines', category: 'travel' },
  
  // Drugstores
  { domain: 'cvs.com', name: 'CVS', category: 'drugstores' },
  { domain: 'walgreens.com', name: 'Walgreens', category: 'drugstores' },
  { domain: 'riteaid.com', name: 'Rite Aid', category: 'drugstores' },
  
  // Gas
  { domain: 'shell.com', name: 'Shell', category: 'gas' },
  { domain: 'exxon.com', name: 'Exxon', category: 'gas' },
  { domain: 'chevron.com', name: 'Chevron', category: 'gas' },
];

export const categoryLabels: Record<MerchantCategory, string> = {
  dining: 'Dining & Restaurants',
  groceries: 'Groceries',
  warehouse: 'Warehouse Club',
  apparel: 'Apparel & Fashion',
  general: 'General Purchase',
  entertainment: 'Entertainment',
  travel: 'Travel',
  gas: 'Gas Station',
  drugstores: 'Pharmacy & Drugstore',
};
