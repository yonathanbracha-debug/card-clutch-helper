// CardClutch Credit Card Data Model (V1 Production)
// All data verified against official issuer terms
// Last audit: December 2024

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover';

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  network: CardNetwork;
  annualFee: number;
  rewards: CardReward[];
  rewardSummary: string; // One-line summary for display
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
    network: 'amex',
    annualFee: 250,
    rewardSummary: '4X Dining, 4X U.S. Groceries (excludes Costco, Walmart, Target)',
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
        exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target', 'Amazon Fresh', 'Wholesale clubs'],
        cap: 'Up to $25,000/year in purchases, then 1X',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on all other purchases',
      },
    ],
    notes: [
      '$120 Uber Cash credit annually',
      '$120 dining credit annually',
      'No foreign transaction fees',
    ],
  },
  {
    id: 'amex-platinum',
    name: 'Platinum Card',
    issuer: 'American Express',
    network: 'amex',
    annualFee: 695,
    rewardSummary: '5X Flights direct, 5X Hotels via Amex Travel',
    rewards: [
      {
        category: 'flights',
        multiplier: 5,
        description: '5X on flights booked directly with airlines or via Amex Travel',
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
        description: '1X on all other purchases',
      },
    ],
    notes: [
      '$200 airline fee credit annually',
      '$200 hotel credit annually',
      '$240 digital entertainment credit',
      'Priority Pass lounge access',
    ],
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred',
    issuer: 'American Express',
    network: 'amex',
    annualFee: 95,
    rewardSummary: '6% Groceries (capped), 6% Streaming, 3% Gas/Transit',
    rewards: [
      {
        category: 'groceries',
        multiplier: 6,
        description: '6% cash back at U.S. supermarkets',
        exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target', 'Wholesale clubs'],
        cap: 'Up to $6,000/year, then 1%',
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
        description: '1% on all other purchases',
      },
    ],
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday',
    issuer: 'American Express',
    network: 'amex',
    annualFee: 0,
    rewardSummary: '3% Groceries (capped), 3% Gas, 3% Online retail',
    rewards: [
      {
        category: 'groceries',
        multiplier: 3,
        description: '3% at U.S. supermarkets',
        exclusions: ['Costco', 'Sam\'s Club', 'Walmart', 'Target'],
        cap: 'Up to $6,000/year, then 1%',
      },
      {
        category: 'gas',
        multiplier: 3,
        description: '3% at U.S. gas stations',
      },
      {
        category: 'online',
        multiplier: 3,
        description: '3% on U.S. online retail purchases',
        cap: 'Up to $6,000/year, then 1%',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% on all other purchases',
      },
    ],
    notes: ['No annual fee'],
  },

  // === CHASE ===
  {
    id: 'chase-sapphire-preferred',
    name: 'Sapphire Preferred',
    issuer: 'Chase',
    network: 'visa',
    annualFee: 95,
    rewardSummary: '5X Travel via Chase, 3X Dining, 3X Streaming',
    rewards: [
      {
        category: 'travel',
        multiplier: 5,
        description: '5X on travel via Chase Travel',
        conditions: 'Must book through Chase Ultimate Rewards portal',
      },
      {
        category: 'dining',
        multiplier: 3,
        description: '3X on dining at restaurants',
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
    notes: [
      'Points worth 25% more via Chase Travel',
      'No foreign transaction fees',
      'Transfer to airline/hotel partners',
    ],
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Sapphire Reserve',
    issuer: 'Chase',
    network: 'visa',
    annualFee: 550,
    rewardSummary: '10X Hotels via Chase, 5X Flights via Chase, 3X Dining',
    rewards: [
      {
        category: 'hotels',
        multiplier: 10,
        description: '10X on hotels and car rentals via Chase Travel',
        conditions: 'Must book through Chase Ultimate Rewards portal',
      },
      {
        category: 'flights',
        multiplier: 5,
        description: '5X on flights via Chase Travel',
        conditions: 'Must book through Chase Ultimate Rewards portal',
      },
      {
        category: 'dining',
        multiplier: 3,
        description: '3X on dining at restaurants',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1X on all other purchases',
      },
    ],
    notes: [
      '$300 annual travel credit',
      'Points worth 50% more via Chase Travel',
      'Priority Pass lounge access',
      'No foreign transaction fees',
    ],
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Freedom Unlimited',
    issuer: 'Chase',
    network: 'visa',
    annualFee: 0,
    rewardSummary: '5X Travel via Chase, 3X Dining, 3X Drugstores, 1.5% Everything else',
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
        description: '3% on dining at restaurants',
      },
      {
        category: 'drugstores',
        multiplier: 3,
        description: '3% on drugstore purchases',
      },
      {
        category: 'general',
        multiplier: 1.5,
        description: '1.5% cash back on all other purchases',
      },
    ],
    notes: ['No annual fee', 'Good base card for Chase ecosystem'],
  },
  {
    id: 'chase-freedom-flex',
    name: 'Freedom Flex',
    issuer: 'Chase',
    network: 'mastercard',
    annualFee: 0,
    rewardSummary: '5% Rotating quarterly (activation required), 3X Dining, 3X Drugstores',
    rewards: [
      {
        category: 'dining',
        multiplier: 3,
        description: '3% on dining at restaurants',
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
    notes: [
      '5% on rotating quarterly categories (requires activation)',
      'Up to $1,500 in quarterly bonus category purchases',
      'No annual fee',
    ],
  },

  // === CITI ===
  {
    id: 'citi-double-cash',
    name: 'Double Cash',
    issuer: 'Citi',
    network: 'mastercard',
    annualFee: 0,
    rewardSummary: '2% flat on everything (1% when you buy, 1% when you pay)',
    rewards: [
      {
        category: 'general',
        multiplier: 2,
        description: '2% on all purchases (1% when you buy, 1% when you pay)',
      },
    ],
    notes: [
      'Must pay your bill to earn the second 1%',
      'No annual fee',
      'Best flat-rate no-fee card',
    ],
  },
  {
    id: 'citi-premier',
    name: 'Premier',
    issuer: 'Citi',
    network: 'mastercard',
    annualFee: 95,
    rewardSummary: '3X Flights, Hotels, Dining, Groceries, Gas',
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
    notes: [
      'No foreign transaction fees',
      'Points transfer to airline partners',
    ],
  },
  {
    id: 'citi-custom-cash',
    name: 'Custom Cash',
    issuer: 'Citi',
    network: 'mastercard',
    annualFee: 0,
    rewardSummary: '5% on top spend category each cycle (auto-selected, capped at $500)',
    rewards: [
      {
        category: 'general',
        multiplier: 5,
        description: '5% on your top eligible spend category each billing cycle',
        cap: 'Up to $500/billing cycle, then 1%',
        conditions: 'Automatically applied to highest spend category (restaurants, gas, groceries, etc.)',
      },
    ],
    notes: [
      'Category auto-selects based on your spending',
      'Good for focused spending patterns',
      'No annual fee',
    ],
  },

  // === CAPITAL ONE ===
  {
    id: 'capital-one-savor-one',
    name: 'SavorOne',
    issuer: 'Capital One',
    network: 'mastercard',
    annualFee: 0,
    rewardSummary: '3X Dining, Groceries, Streaming, Entertainment',
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
        exclusions: ['Costco', 'Sam\'s Club', 'Wholesale clubs'],
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
    network: 'visa',
    annualFee: 95,
    rewardSummary: '2X miles on every purchase',
    rewards: [
      {
        category: 'general',
        multiplier: 2,
        description: '2X miles on every purchase',
      },
    ],
    notes: [
      'Miles transfer to travel partners',
      'No foreign transaction fees',
    ],
  },
  {
    id: 'capital-one-venture-x',
    name: 'Venture X',
    issuer: 'Capital One',
    network: 'visa',
    annualFee: 395,
    rewardSummary: '10X Hotels via Capital One, 5X Flights via Capital One, 2X Everything else',
    rewards: [
      {
        category: 'hotels',
        multiplier: 10,
        description: '10X on hotels via Capital One Travel',
        conditions: 'Must book through Capital One Travel portal',
      },
      {
        category: 'flights',
        multiplier: 5,
        description: '5X on flights via Capital One Travel',
        conditions: 'Must book through Capital One Travel portal',
      },
      {
        category: 'general',
        multiplier: 2,
        description: '2X miles on all other purchases',
      },
    ],
    notes: [
      '$300 annual travel credit',
      '10,000 bonus miles annually',
      'Priority Pass lounge access',
    ],
  },
  {
    id: 'capital-one-quicksilver',
    name: 'Quicksilver',
    issuer: 'Capital One',
    network: 'mastercard',
    annualFee: 0,
    rewardSummary: '1.5% flat cash back on all purchases',
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
    network: 'mastercard',
    annualFee: 0,
    rewardSummary: '3% Apple/partners (Apple Pay), 2% All Apple Pay, 1% Physical card',
    rewards: [
      {
        category: 'general',
        multiplier: 3,
        description: '3% at Apple and select partners (Uber, Walgreens, T-Mobile, Nike)',
        conditions: 'Must use Apple Pay',
      },
      {
        category: 'general',
        multiplier: 2,
        description: '2% on all purchases when using Apple Pay',
        conditions: 'Apple Pay transactions only',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% when using physical card',
      },
    ],
    notes: [
      'Daily Cash paid immediately',
      'No fees whatsoever',
      'Best if you always use Apple Pay',
    ],
  },

  // === DISCOVER ===
  {
    id: 'discover-it',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    network: 'discover',
    annualFee: 0,
    rewardSummary: '5% Rotating quarterly (activation required), 1% Everything else',
    rewards: [
      {
        category: 'general',
        multiplier: 1,
        description: '1% on all purchases',
      },
    ],
    notes: [
      '5% on rotating quarterly categories (requires activation)',
      'Up to $1,500 in quarterly bonus purchases',
      'Cashback Match first year (effectively doubles rewards)',
      'No annual fee',
    ],
  },
  {
    id: 'discover-it-miles',
    name: 'Discover it Miles',
    issuer: 'Discover',
    network: 'discover',
    annualFee: 0,
    rewardSummary: '1.5X miles on all purchases (matched first year = 3X)',
    rewards: [
      {
        category: 'general',
        multiplier: 1.5,
        description: '1.5X miles on all purchases',
      },
    ],
    notes: [
      'Miles Match first year (effectively 3X)',
      'No annual fee',
    ],
  },

  // === WELLS FARGO ===
  {
    id: 'wells-fargo-active-cash',
    name: 'Active Cash',
    issuer: 'Wells Fargo',
    network: 'visa',
    annualFee: 0,
    rewardSummary: '2% flat cash back on all purchases',
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
    network: 'visa',
    annualFee: 0,
    rewardSummary: '3X Dining, Travel, Gas, Transit, Streaming',
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
    network: 'visa',
    annualFee: 0,
    rewardSummary: '3% Choice category (capped), 2% Groceries (capped), 1% Everything else',
    rewards: [
      {
        category: 'general',
        multiplier: 3,
        description: '3% in category of your choice',
        cap: 'Up to $2,500/quarter, then 1%',
        conditions: 'Choose from: gas, online shopping, dining, travel, drug stores, or home improvement',
      },
      {
        category: 'groceries',
        multiplier: 2,
        description: '2% at grocery stores and wholesale clubs',
        cap: 'Up to $2,500/quarter, then 1%',
      },
      {
        category: 'general',
        multiplier: 1,
        description: '1% on all other purchases',
      },
    ],
    notes: [
      'Bonus increased with Preferred Rewards status',
      'No annual fee',
    ],
  },
  {
    id: 'bofa-premium-rewards',
    name: 'Premium Rewards',
    issuer: 'Bank of America',
    network: 'visa',
    annualFee: 95,
    rewardSummary: '2X Travel & Dining, 1.5X Everything else',
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
    notes: [
      '$100 airline incidental credit',
      'TSA PreCheck/Global Entry credit',
    ],
  },

  // === U.S. BANK ===
  {
    id: 'usbank-altitude-go',
    name: 'Altitude Go',
    issuer: 'U.S. Bank',
    network: 'visa',
    annualFee: 0,
    rewardSummary: '4X Dining, 2X Groceries/Gas/Streaming, 1X Everything else',
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
    notes: ['No annual fee', 'Excellent no-fee dining card'],
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
  { domain: 'bjs.com', name: "BJ's Wholesale", category: 'warehouse', isWarehouse: true, excludedFromGrocery: true },
  
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

export const networkLabels: Record<CardNetwork, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
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
