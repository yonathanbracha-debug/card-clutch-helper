// CardClutch Credit Card Data Model
// All data is conservative and based on publicly available card terms
// Last verified: 2024

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  annualFee: number | null;
  rewards: CardReward[];
  notes?: string[];
}

export interface CardReward {
  category: RewardCategory;
  multiplier: number;
  description: string;
  exclusions?: string[];
  cap?: string;
  conditions?: string;
}

export type RewardCategory = 
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

export const creditCards: CreditCard[] = [
  // === AMERICAN EXPRESS ===
  {
    id: 'amex-gold',
    name: 'Gold Card',
    issuer: 'American Express',
    annualFee: 250,
    rewards: [
      {
        category: 'dining',
        multiplier: 4,
        description: '4X Membership Rewards at restaurants worldwide',
      },
      {
        category: 'groceries',
        multiplier: 4,
        description: '4X at U.S. supermarkets',
        exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target', 'Amazon Fresh'],
        cap: 'On up to $25,000/year, then 1X',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on other purchases',
      },
    ],
    notes: ['Dining credit partially offsets fee', 'No foreign transaction fees'],
  },
  {
    id: 'amex-platinum',
    name: 'Platinum Card',
    issuer: 'American Express',
    annualFee: 695,
    rewards: [
      {
        category: 'flights',
        multiplier: 5,
        description: '5X on flights booked directly with airlines',
      },
      {
        category: 'hotels',
        multiplier: 5,
        description: '5X on prepaid hotels via Amex Travel',
        conditions: 'Must book through Amex Travel portal',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on other purchases',
      },
    ],
    notes: ['Best for frequent travelers with high spend', 'Multiple credits offset fee'],
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred',
    issuer: 'American Express',
    annualFee: 95,
    rewards: [
      {
        category: 'groceries',
        multiplier: 6,
        description: '6% cash back at U.S. supermarkets',
        exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target'],
        cap: 'On up to $6,000/year, then 1%',
      },
      {
        category: 'streaming',
        multiplier: 6,
        description: '6% on select U.S. streaming subscriptions',
      },
      {
        category: 'transit',
        multiplier: 3,
        description: '3% on transit including rideshare',
      },
      {
        category: 'gas',
        multiplier: 3,
        description: '3% at U.S. gas stations',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% on other purchases',
      },
    ],
  },

  // === CHASE ===
  {
    id: 'chase-sapphire-preferred',
    name: 'Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    rewards: [
      {
        category: 'travel',
        multiplier: 5,
        description: '5X on travel via Chase Travel',
        conditions: 'Must book through Chase portal',
      },
      {
        category: 'dining',
        multiplier: 3,
        description: '3X on dining',
      },
      {
        category: 'streaming',
        multiplier: 3,
        description: '3X on select streaming services',
      },
      {
        category: 'online',
        multiplier: 3,
        description: '3X on online grocery purchases',
        exclusions: ['Target', 'Walmart'],
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on all other purchases',
      },
    ],
    notes: ['Points worth 25% more via Chase Travel', 'No foreign transaction fees'],
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 550,
    rewards: [
      {
        category: 'travel',
        multiplier: 5,
        description: '5X on flights via Chase Travel',
        conditions: 'After earning $300 travel credit',
      },
      {
        category: 'hotels',
        multiplier: 10,
        description: '10X on hotels and car rentals via Chase Travel',
        conditions: 'Must book through Chase portal',
      },
      {
        category: 'dining',
        multiplier: 3,
        description: '3X on dining',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on all other purchases',
      },
    ],
    notes: ['$300 annual travel credit', 'Points worth 50% more via Chase Travel', 'Priority Pass lounge access'],
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    rewards: [
      {
        category: 'travel',
        multiplier: 5,
        description: '5% on travel via Chase Travel',
        conditions: 'Must book through Chase portal',
      },
      {
        category: 'dining',
        multiplier: 3,
        description: '3% on dining',
      },
      {
        category: 'drugstores',
        multiplier: 3,
        description: '3% on drugstore purchases',
      },
      {
        category: 'general',
        multiplier: 1.5,
        description: '1.5% on all other purchases',
      },
    ],
    notes: ['No annual fee', 'Good base card for Chase ecosystem'],
  },
  {
    id: 'chase-freedom-flex',
    name: 'Freedom Flex',
    issuer: 'Chase',
    annualFee: 0,
    rewards: [
      {
        category: 'dining',
        multiplier: 3,
        description: '3% on dining',
      },
      {
        category: 'drugstores',
        multiplier: 3,
        description: '3% on drugstore purchases',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% on all other purchases',
      },
    ],
    notes: ['5% rotating categories (quarterly activation required)', 'No annual fee'],
  },

  // === CITI ===
  {
    id: 'citi-double-cash',
    name: 'Double Cash',
    issuer: 'Citi',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 2,
        description: '2% on all purchases (1% when you buy, 1% when you pay)',
      },
    ],
    notes: ['Best flat-rate card with no annual fee', 'Must pay bill to earn full 2%'],
  },
  {
    id: 'citi-premier',
    name: 'Premier',
    issuer: 'Citi',
    annualFee: 95,
    rewards: [
      {
        category: 'flights',
        multiplier: 3,
        description: '3X on air travel',
      },
      {
        category: 'hotels',
        multiplier: 3,
        description: '3X on hotels',
      },
      {
        category: 'dining',
        multiplier: 3,
        description: '3X on restaurants',
      },
      {
        category: 'groceries',
        multiplier: 3,
        description: '3X at supermarkets',
      },
      {
        category: 'gas',
        multiplier: 3,
        description: '3X at gas stations',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on all other purchases',
      },
    ],
    notes: ['No foreign transaction fees', 'Points transfer to airline partners'],
  },
  {
    id: 'citi-custom-cash',
    name: 'Custom Cash',
    issuer: 'Citi',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 5,
        description: '5% on your top eligible spend category each billing cycle',
        cap: 'On up to $500/billing cycle, then 1%',
        conditions: 'Automatically applied to highest spend category',
      },
    ],
    notes: ['Category auto-selects based on spend', 'Good for focused spending'],
  },

  // === CAPITAL ONE ===
  {
    id: 'capital-one-savor-one',
    name: 'SavorOne',
    issuer: 'Capital One',
    annualFee: 0,
    rewards: [
      {
        category: 'dining',
        multiplier: 3,
        description: '3% on dining',
      },
      {
        category: 'groceries',
        multiplier: 3,
        description: '3% at grocery stores',
        exclusions: ['Costco', 'Sam\'s Club'],
      },
      {
        category: 'streaming',
        multiplier: 3,
        description: '3% on popular streaming services',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% on all other purchases',
      },
    ],
    notes: ['No annual fee', 'No foreign transaction fees'],
  },
  {
    id: 'capital-one-venture',
    name: 'Venture',
    issuer: 'Capital One',
    annualFee: 95,
    rewards: [
      {
        category: 'general',
        multiplier: 2,
        description: '2X miles on every purchase',
      },
    ],
    notes: ['Miles transfer to travel partners', 'No foreign transaction fees'],
  },
  {
    id: 'capital-one-venture-x',
    name: 'Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    rewards: [
      {
        category: 'flights',
        multiplier: 5,
        description: '5X on flights via Capital One Travel',
      },
      {
        category: 'hotels',
        multiplier: 10,
        description: '10X on hotels via Capital One Travel',
      },
      {
        category: 'general',
        multiplier: 2,
        description: '2X miles on all other purchases',
      },
    ],
    notes: ['$300 annual travel credit', 'Priority Pass lounge access', '10,000 bonus miles annually'],
  },
  {
    id: 'capital-one-quicksilver',
    name: 'Quicksilver',
    issuer: 'Capital One',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 1.5,
        description: '1.5% cash back on all purchases',
      },
    ],
    notes: ['No annual fee', 'Simple flat-rate rewards'],
  },

  // === APPLE ===
  {
    id: 'apple-card',
    name: 'Apple Card',
    issuer: 'Apple',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 3,
        description: '3% at Apple and select partners (Uber, Walgreens, T-Mobile, Nike)',
        conditions: 'When using Apple Pay',
      },
      {
        category: 'general',
        multiplier: 2,
        description: '2% everywhere when using Apple Pay',
        conditions: 'Must use Apple Pay',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% when using physical card',
      },
    ],
    notes: ['Daily Cash paid immediately', 'No fees whatsoever'],
  },

  // === DISCOVER ===
  {
    id: 'discover-it',
    name: 'Discover it',
    issuer: 'Discover',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 1,
        description: '1% on all purchases',
      },
    ],
    notes: ['5% rotating categories (quarterly activation required)', 'Cash back match first year', 'No annual fee'],
  },
  {
    id: 'discover-it-miles',
    name: 'Discover it Miles',
    issuer: 'Discover',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 1.5,
        description: '1.5X miles on all purchases',
      },
    ],
    notes: ['Miles match first year (effectively 3X)', 'No annual fee'],
  },

  // === WELLS FARGO ===
  {
    id: 'wells-fargo-active-cash',
    name: 'Active Cash',
    issuer: 'Wells Fargo',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 2,
        description: '2% cash rewards on all purchases',
      },
    ],
    notes: ['No annual fee', 'No categories to track'],
  },
  {
    id: 'wells-fargo-autograph',
    name: 'Autograph',
    issuer: 'Wells Fargo',
    annualFee: 0,
    rewards: [
      {
        category: 'dining',
        multiplier: 3,
        description: '3X on dining',
      },
      {
        category: 'travel',
        multiplier: 3,
        description: '3X on travel',
      },
      {
        category: 'gas',
        multiplier: 3,
        description: '3X on gas',
      },
      {
        category: 'transit',
        multiplier: 3,
        description: '3X on transit',
      },
      {
        category: 'streaming',
        multiplier: 3,
        description: '3X on streaming services',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on all other purchases',
      },
    ],
    notes: ['No annual fee', 'No foreign transaction fees'],
  },

  // === BANK OF AMERICA ===
  {
    id: 'bofa-customized-cash',
    name: 'Customized Cash Rewards',
    issuer: 'Bank of America',
    annualFee: 0,
    rewards: [
      {
        category: 'general',
        multiplier: 3,
        description: '3% in category of your choice',
        cap: 'On up to $2,500/quarter, then 1%',
        conditions: 'Choose from: gas, online shopping, dining, travel, drug stores, or home improvement',
      },
      {
        category: 'groceries',
        multiplier: 2,
        description: '2% at grocery stores and wholesale clubs',
        cap: 'On up to $2,500/quarter, then 1%',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% on all other purchases',
      },
    ],
    notes: ['Bonus increased with Preferred Rewards status', 'No annual fee'],
  },
  {
    id: 'bofa-premium-rewards',
    name: 'Premium Rewards',
    issuer: 'Bank of America',
    annualFee: 95,
    rewards: [
      {
        category: 'travel',
        multiplier: 2,
        description: '2X on travel and dining',
      },
      {
        category: 'dining',
        multiplier: 2,
        description: '2X on dining',
      },
      {
        category: 'general',
        multiplier: 1.5,
        description: '1.5X on all other purchases',
      },
    ],
    notes: ['$100 airline incidental credit', 'TSA PreCheck/Global Entry credit'],
  },

  // === US BANK ===
  {
    id: 'usbank-altitude-go',
    name: 'Altitude Go',
    issuer: 'U.S. Bank',
    annualFee: 0,
    rewards: [
      {
        category: 'dining',
        multiplier: 4,
        description: '4X on dining',
      },
      {
        category: 'groceries',
        multiplier: 2,
        description: '2X at grocery stores',
      },
      {
        category: 'streaming',
        multiplier: 2,
        description: '2X on streaming services',
      },
      {
        category: 'gas',
        multiplier: 2,
        description: '2X at gas stations',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on all other purchases',
      },
    ],
    notes: ['No annual fee', 'Good dining card for no fee'],
  },
];

// === MERCHANT CATEGORY MAPPINGS ===

export type MerchantCategory = 
  | 'dining'
  | 'groceries'
  | 'warehouse'
  | 'apparel'
  | 'general'
  | 'entertainment'
  | 'travel'
  | 'flights'
  | 'hotels'
  | 'gas'
  | 'transit'
  | 'drugstores'
  | 'streaming'
  | 'online';

export interface MerchantMapping {
  domain: string;
  name: string;
  category: MerchantCategory;
  isWarehouse?: boolean;
  excludedFromGrocery?: boolean;
}

export const merchantMappings: MerchantMapping[] = [
  // === GROCERIES ===
  { domain: 'instacart.com', name: 'Instacart', category: 'groceries' },
  { domain: 'publix.com', name: 'Publix', category: 'groceries' },
  { domain: 'kroger.com', name: 'Kroger', category: 'groceries' },
  { domain: 'safeway.com', name: 'Safeway', category: 'groceries' },
  { domain: 'wholefoods.com', name: 'Whole Foods', category: 'groceries' },
  { domain: 'wholefoodsmarket.com', name: 'Whole Foods', category: 'groceries' },
  { domain: 'traderjoes.com', name: "Trader Joe's", category: 'groceries' },
  { domain: 'wegmans.com', name: 'Wegmans', category: 'groceries' },
  { domain: 'albertsons.com', name: 'Albertsons', category: 'groceries' },
  { domain: 'heb.com', name: 'H-E-B', category: 'groceries' },
  { domain: 'aldi.us', name: 'Aldi', category: 'groceries' },
  { domain: 'shoprite.com', name: 'ShopRite', category: 'groceries' },
  { domain: 'giantfood.com', name: 'Giant', category: 'groceries' },
  { domain: 'stopandshop.com', name: 'Stop & Shop', category: 'groceries' },
  { domain: 'freshdirect.com', name: 'FreshDirect', category: 'groceries' },
  
  // === WAREHOUSE CLUBS (excluded from grocery bonuses) ===
  { domain: 'costco.com', name: 'Costco', category: 'warehouse', isWarehouse: true, excludedFromGrocery: true },
  { domain: 'samsclub.com', name: "Sam's Club", category: 'warehouse', isWarehouse: true, excludedFromGrocery: true },
  { domain: 'bjs.com', name: "BJ's", category: 'warehouse', isWarehouse: true, excludedFromGrocery: true },
  
  // === BIG BOX RETAIL (excluded from grocery bonuses) ===
  { domain: 'walmart.com', name: 'Walmart', category: 'general', excludedFromGrocery: true },
  { domain: 'target.com', name: 'Target', category: 'general', excludedFromGrocery: true },
  
  // === DINING ===
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
  { domain: 'tacobell.com', name: 'Taco Bell', category: 'dining' },
  { domain: 'wendys.com', name: "Wendy's", category: 'dining' },
  { domain: 'burgerking.com', name: 'Burger King', category: 'dining' },
  { domain: 'papajohns.com', name: "Papa John's", category: 'dining' },
  { domain: 'panerabread.com', name: 'Panera Bread', category: 'dining' },
  { domain: 'sweetgreen.com', name: 'Sweetgreen', category: 'dining' },
  { domain: 'caviar.com', name: 'Caviar', category: 'dining' },
  
  // === APPAREL ===
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
  { domain: 'asos.com', name: 'ASOS', category: 'apparel' },
  { domain: 'shein.com', name: 'SHEIN', category: 'apparel' },
  
  // === GENERAL RETAIL ===
  { domain: 'amazon.com', name: 'Amazon', category: 'online' },
  { domain: 'bestbuy.com', name: 'Best Buy', category: 'general' },
  { domain: 'homedepot.com', name: 'Home Depot', category: 'general' },
  { domain: 'lowes.com', name: "Lowe's", category: 'general' },
  { domain: 'etsy.com', name: 'Etsy', category: 'online' },
  { domain: 'ebay.com', name: 'eBay', category: 'online' },
  { domain: 'wayfair.com', name: 'Wayfair', category: 'online' },
  { domain: 'ikea.com', name: 'IKEA', category: 'general' },
  { domain: 'apple.com', name: 'Apple', category: 'general' },
  
  // === STREAMING ===
  { domain: 'netflix.com', name: 'Netflix', category: 'streaming' },
  { domain: 'spotify.com', name: 'Spotify', category: 'streaming' },
  { domain: 'hulu.com', name: 'Hulu', category: 'streaming' },
  { domain: 'disneyplus.com', name: 'Disney+', category: 'streaming' },
  { domain: 'hbomax.com', name: 'Max', category: 'streaming' },
  { domain: 'max.com', name: 'Max', category: 'streaming' },
  { domain: 'peacocktv.com', name: 'Peacock', category: 'streaming' },
  { domain: 'paramountplus.com', name: 'Paramount+', category: 'streaming' },
  { domain: 'youtube.com', name: 'YouTube', category: 'streaming' },
  { domain: 'appletv.com', name: 'Apple TV+', category: 'streaming' },
  
  // === AIRLINES ===
  { domain: 'united.com', name: 'United Airlines', category: 'flights' },
  { domain: 'delta.com', name: 'Delta Air Lines', category: 'flights' },
  { domain: 'aa.com', name: 'American Airlines', category: 'flights' },
  { domain: 'southwest.com', name: 'Southwest Airlines', category: 'flights' },
  { domain: 'jetblue.com', name: 'JetBlue', category: 'flights' },
  { domain: 'alaskaair.com', name: 'Alaska Airlines', category: 'flights' },
  { domain: 'spirit.com', name: 'Spirit Airlines', category: 'flights' },
  { domain: 'frontier.com', name: 'Frontier Airlines', category: 'flights' },
  
  // === HOTELS ===
  { domain: 'marriott.com', name: 'Marriott', category: 'hotels' },
  { domain: 'hilton.com', name: 'Hilton', category: 'hotels' },
  { domain: 'hyatt.com', name: 'Hyatt', category: 'hotels' },
  { domain: 'ihg.com', name: 'IHG', category: 'hotels' },
  { domain: 'wyndhamhotels.com', name: 'Wyndham', category: 'hotels' },
  { domain: 'airbnb.com', name: 'Airbnb', category: 'hotels' },
  { domain: 'vrbo.com', name: 'VRBO', category: 'hotels' },
  
  // === TRAVEL BOOKING ===
  { domain: 'booking.com', name: 'Booking.com', category: 'travel' },
  { domain: 'expedia.com', name: 'Expedia', category: 'travel' },
  { domain: 'hotels.com', name: 'Hotels.com', category: 'travel' },
  { domain: 'kayak.com', name: 'KAYAK', category: 'travel' },
  { domain: 'priceline.com', name: 'Priceline', category: 'travel' },
  
  // === TRANSIT / RIDESHARE ===
  { domain: 'uber.com', name: 'Uber', category: 'transit' },
  { domain: 'lyft.com', name: 'Lyft', category: 'transit' },
  
  // === GAS STATIONS ===
  { domain: 'shell.com', name: 'Shell', category: 'gas' },
  { domain: 'exxon.com', name: 'Exxon', category: 'gas' },
  { domain: 'chevron.com', name: 'Chevron', category: 'gas' },
  { domain: 'bp.com', name: 'BP', category: 'gas' },
  { domain: 'getupside.com', name: 'Upside (Gas)', category: 'gas' },
  
  // === DRUGSTORES ===
  { domain: 'cvs.com', name: 'CVS', category: 'drugstores' },
  { domain: 'walgreens.com', name: 'Walgreens', category: 'drugstores' },
  { domain: 'riteaid.com', name: 'Rite Aid', category: 'drugstores' },
];

export const categoryLabels: Record<MerchantCategory, string> = {
  dining: 'Dining',
  groceries: 'Groceries',
  warehouse: 'Warehouse Club',
  apparel: 'Apparel',
  general: 'General Purchase',
  entertainment: 'Entertainment',
  streaming: 'Streaming',
  travel: 'Travel',
  flights: 'Flights',
  hotels: 'Hotels',
  gas: 'Gas Station',
  transit: 'Transit / Rideshare',
  drugstores: 'Pharmacy',
  online: 'Online Shopping',
};

// Helper function to find if a card has exclusions for a merchant
export function getCardExclusions(cardId: string, category: MerchantCategory): string[] {
  const card = creditCards.find(c => c.id === cardId);
  if (!card) return [];
  
  const reward = card.rewards.find(r => r.category === category);
  return reward?.exclusions || [];
}

// Helper function to get card notes
export function getCardNotes(cardId: string): string[] {
  const card = creditCards.find(c => c.id === cardId);
  return card?.notes || [];
}