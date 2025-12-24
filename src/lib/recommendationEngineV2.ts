// CardClutch Recommendation Engine V2
// Uses Supabase as single source of truth
// All card data from database, not local static arrays

import { CreditCardDB } from '@/hooks/useCreditCards';
import { CardRewardRule } from '@/hooks/useCardRewardRules';
import { MerchantExclusion } from '@/hooks/useMerchantExclusions';
import { validateUrl, extractDomainSafe } from '@/lib/urlSafety';

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

export interface MerchantMapping {
  domain: string;
  name: string;
  category: MerchantCategory;
  excludedFromGrocery?: boolean;
  isWarehouse?: boolean;
}

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

// Known merchants for high confidence recommendations
export const merchantMappings: MerchantMapping[] = [
  // Dining
  { domain: 'doordash.com', name: 'DoorDash', category: 'dining' },
  { domain: 'ubereats.com', name: 'Uber Eats', category: 'dining' },
  { domain: 'grubhub.com', name: 'Grubhub', category: 'dining' },
  { domain: 'chipotle.com', name: 'Chipotle', category: 'dining' },
  { domain: 'starbucks.com', name: 'Starbucks', category: 'dining' },
  { domain: 'mcdonalds.com', name: "McDonald's", category: 'dining' },
  
  // Groceries
  { domain: 'instacart.com', name: 'Instacart', category: 'groceries' },
  { domain: 'wholefoodsmarket.com', name: 'Whole Foods', category: 'groceries' },
  { domain: 'kroger.com', name: 'Kroger', category: 'groceries' },
  { domain: 'safeway.com', name: 'Safeway', category: 'groceries' },
  { domain: 'traderjoes.com', name: "Trader Joe's", category: 'groceries' },
  { domain: 'aldi.us', name: 'Aldi', category: 'groceries' },
  
  // Warehouse/Excluded from grocery
  { domain: 'costco.com', name: 'Costco', category: 'groceries', excludedFromGrocery: true, isWarehouse: true },
  { domain: 'samsclub.com', name: "Sam's Club", category: 'groceries', excludedFromGrocery: true, isWarehouse: true },
  { domain: 'bjs.com', name: "BJ's Wholesale", category: 'groceries', excludedFromGrocery: true, isWarehouse: true },
  
  // Big box (excluded from grocery for most cards)
  { domain: 'walmart.com', name: 'Walmart', category: 'general', excludedFromGrocery: true },
  { domain: 'target.com', name: 'Target', category: 'general', excludedFromGrocery: true },
  
  // Travel
  { domain: 'expedia.com', name: 'Expedia', category: 'travel' },
  { domain: 'booking.com', name: 'Booking.com', category: 'hotels' },
  { domain: 'airbnb.com', name: 'Airbnb', category: 'hotels' },
  { domain: 'hotels.com', name: 'Hotels.com', category: 'hotels' },
  { domain: 'marriott.com', name: 'Marriott', category: 'hotels' },
  { domain: 'hilton.com', name: 'Hilton', category: 'hotels' },
  
  // Airlines
  { domain: 'united.com', name: 'United Airlines', category: 'flights' },
  { domain: 'aa.com', name: 'American Airlines', category: 'flights' },
  { domain: 'delta.com', name: 'Delta Airlines', category: 'flights' },
  { domain: 'southwest.com', name: 'Southwest Airlines', category: 'flights' },
  { domain: 'jetblue.com', name: 'JetBlue', category: 'flights' },
  
  // Gas
  { domain: 'shell.com', name: 'Shell', category: 'gas' },
  { domain: 'chevron.com', name: 'Chevron', category: 'gas' },
  { domain: 'exxon.com', name: 'Exxon', category: 'gas' },
  
  // Streaming
  { domain: 'netflix.com', name: 'Netflix', category: 'streaming' },
  { domain: 'spotify.com', name: 'Spotify', category: 'streaming' },
  { domain: 'hulu.com', name: 'Hulu', category: 'streaming' },
  { domain: 'disneyplus.com', name: 'Disney+', category: 'streaming' },
  { domain: 'hbomax.com', name: 'HBO Max', category: 'streaming' },
  { domain: 'max.com', name: 'Max', category: 'streaming' },
  
  // Online Shopping
  { domain: 'amazon.com', name: 'Amazon', category: 'online' },
  { domain: 'ebay.com', name: 'eBay', category: 'online' },
  { domain: 'etsy.com', name: 'Etsy', category: 'online' },
  
  // Transit
  { domain: 'uber.com', name: 'Uber', category: 'transit' },
  { domain: 'lyft.com', name: 'Lyft', category: 'transit' },
  
  // Drugstores
  { domain: 'cvs.com', name: 'CVS', category: 'drugstores' },
  { domain: 'walgreens.com', name: 'Walgreens', category: 'drugstores' },
  { domain: 'riteaid.com', name: 'Rite Aid', category: 'drugstores' },
];

export interface CardAnalysis {
  card: CreditCardDB;
  effectiveMultiplier: number;
  reason: string;
  excluded: boolean;
  exclusionReason?: string;
}

export interface Recommendation {
  card: CreditCardDB;
  merchant: MerchantMapping | null;
  category: MerchantCategory;
  categoryLabel: string;
  multiplier: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives: CardAnalysis[];
}

/**
 * Safely extracts domain from URL using validation utilities
 * Returns null if URL is invalid or dangerous
 */
function extractDomain(url: string): string | null {
  const validation = validateUrl(url);
  if (!validation.ok || !validation.domain) {
    return null;
  }
  return validation.domain;
}

function inferCategoryFromDomain(domain: string): { category: MerchantCategory; merchantName: string } {
  const patterns: { pattern: RegExp; category: MerchantCategory }[] = [
    { pattern: /food|eat|dine|restaurant|pizza|burger|sushi|taco|thai|chinese|indian|mexican|cafe|coffee/i, category: 'dining' },
    { pattern: /grocery|market|fresh|organic|foods|supermarket/i, category: 'groceries' },
    { pattern: /stream|movie|music|game|play|entertainment/i, category: 'streaming' },
    { pattern: /travel|hotel|flight|air|vacation|trip|booking/i, category: 'travel' },
    { pattern: /pharmacy|drug|health|med|rx/i, category: 'drugstores' },
    { pattern: /gas|fuel|petro|station/i, category: 'gas' },
  ];

  for (const { pattern, category } of patterns) {
    if (pattern.test(domain)) {
      const baseName = domain.split('.')[0];
      const merchantName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      return { category, merchantName };
    }
  }

  const baseName = domain.split('.')[0];
  const merchantName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  return { category: 'general', merchantName };
}

function mapCategorySlugToMerchantCategory(slug: string): MerchantCategory {
  const mapping: Record<string, MerchantCategory> = {
    'dining': 'dining',
    'groceries': 'groceries',
    'travel': 'travel',
    'flights': 'flights',
    'hotels': 'hotels',
    'gas': 'gas',
    'transit': 'transit',
    'streaming': 'streaming',
    'drugstores': 'drugstores',
    'online': 'online',
    'general': 'general',
    'everything-else': 'general',
  };
  return mapping[slug] || 'general';
}

function getCardMultiplierFromRules(
  rules: CardRewardRule[],
  exclusions: MerchantExclusion[],
  category: MerchantCategory,
  merchant: MerchantMapping | null
): { multiplier: number; excluded: boolean; exclusionReason?: string } {
  
  // Check if merchant is in exclusions list
  if (merchant) {
    const merchantExclusion = exclusions.find(exc => 
      merchant.name.toLowerCase().includes(exc.merchant_pattern.toLowerCase()) ||
      exc.merchant_pattern.toLowerCase().includes(merchant.name.toLowerCase()) ||
      merchant.domain.includes(exc.merchant_pattern.toLowerCase())
    );
    
    if (merchantExclusion) {
      const generalRule = rules.find(r => mapCategorySlugToMerchantCategory(r.category_slug) === 'general');
      return {
        multiplier: generalRule?.multiplier || 1,
        excluded: true,
        exclusionReason: `${merchant.name} excluded — ${merchantExclusion.reason}`,
      };
    }
  }

  // Check warehouse/grocery exclusions from rules
  if (merchant?.excludedFromGrocery && category === 'groceries') {
    const groceryRule = rules.find(r => mapCategorySlugToMerchantCategory(r.category_slug) === 'groceries');
    if (groceryRule?.exclusions?.some(ex => 
      merchant.name.toLowerCase().includes(ex.toLowerCase()) ||
      ex.toLowerCase().includes(merchant.name.toLowerCase())
    )) {
      const generalRule = rules.find(r => mapCategorySlugToMerchantCategory(r.category_slug) === 'general');
      return {
        multiplier: generalRule?.multiplier || 1,
        excluded: true,
        exclusionReason: `${merchant.name} excluded from grocery bonus — falls to base rate`,
      };
    }
  }

  // Direct category match
  const directRule = rules.find(r => mapCategorySlugToMerchantCategory(r.category_slug) === category);
  if (directRule) {
    return { multiplier: directRule.multiplier, excluded: false };
  }

  // Category fallbacks
  const fallbacks: Record<string, string[]> = {
    flights: ['travel'],
    hotels: ['travel'],
    transit: ['travel'],
    streaming: ['general'],
    online: ['general'],
  };

  const categoryFallbacks = fallbacks[category] || [];
  for (const fallback of categoryFallbacks) {
    const fallbackRule = rules.find(r => mapCategorySlugToMerchantCategory(r.category_slug) === fallback);
    if (fallbackRule) {
      return { multiplier: fallbackRule.multiplier, excluded: false };
    }
  }

  // Fall back to general rate
  const generalRule = rules.find(r => mapCategorySlugToMerchantCategory(r.category_slug) === 'general');
  return { multiplier: generalRule?.multiplier || 1, excluded: false };
}

export function getRecommendationFromDB(
  url: string,
  selectedCards: CreditCardDB[],
  allRules: CardRewardRule[],
  allExclusions: MerchantExclusion[]
): Recommendation | null {
  if (!url || selectedCards.length === 0) {
    return null;
  }

  const domain = extractDomain(url);
  
  // Return null if URL validation failed (invalid scheme, etc.)
  if (!domain) {
    return null;
  }
  
  const knownMerchant = merchantMappings.find(
    m => domain.includes(m.domain) || m.domain.includes(domain)
  );
  
  let category: MerchantCategory;
  let merchantName: string;
  let confidence: 'high' | 'medium' | 'low';

  if (knownMerchant) {
    category = knownMerchant.category;
    merchantName = knownMerchant.name;
    confidence = 'high';
  } else {
    const inferred = inferCategoryFromDomain(domain);
    category = inferred.category;
    merchantName = inferred.merchantName;
    confidence = category === 'general' ? 'low' : 'medium';
  }

  // Analyze all cards
  const analyses: CardAnalysis[] = selectedCards.map(card => {
    const cardRules = allRules.filter(r => r.card_id === card.id);
    const cardExclusions = allExclusions.filter(e => e.card_id === card.id);
    
    const { multiplier, excluded, exclusionReason } = getCardMultiplierFromRules(
      cardRules, 
      cardExclusions, 
      category, 
      knownMerchant || null
    );
    
    let reason: string;
    if (excluded && exclusionReason) {
      reason = exclusionReason;
    } else if (multiplier > 1) {
      reason = `${multiplier}X on ${categoryLabels[category].toLowerCase()}`;
    } else {
      reason = `${multiplier}X base rate`;
    }

    return {
      card,
      effectiveMultiplier: multiplier,
      reason,
      excluded,
      exclusionReason,
    };
  });

  // Sort: non-excluded first, then by multiplier, then by annual fee
  analyses.sort((a, b) => {
    if (a.excluded !== b.excluded) {
      return a.excluded ? 1 : -1;
    }
    if (b.effectiveMultiplier !== a.effectiveMultiplier) {
      return b.effectiveMultiplier - a.effectiveMultiplier;
    }
    return a.card.annual_fee_cents - b.card.annual_fee_cents;
  });

  const bestCard = analyses[0];
  const alternatives = analyses.slice(1);

  // Generate clear reason
  let reason: string;
  const cardName = `${bestCard.card.issuer_name} ${bestCard.card.name}`;
  
  if (bestCard.excluded) {
    reason = `Other cards have exclusions for ${merchantName}. ${cardName} provides a consistent ${bestCard.effectiveMultiplier}X return here.`;
  } else if (bestCard.effectiveMultiplier >= 3) {
    reason = `${cardName} earns ${bestCard.effectiveMultiplier}X on ${categoryLabels[category].toLowerCase()}. This is your highest available rate for ${merchantName}.`;
  } else if (bestCard.effectiveMultiplier >= 1.5) {
    reason = `No category bonus applies at ${merchantName}. ${cardName} provides ${bestCard.effectiveMultiplier}X on all purchases — your best flat-rate option.`;
  } else {
    reason = `No category bonus applies at ${merchantName}. ${cardName} provides ${bestCard.effectiveMultiplier}X on general purchases.`;
  }

  return {
    card: bestCard.card,
    merchant: knownMerchant || { domain, name: merchantName, category },
    category,
    categoryLabel: categoryLabels[category],
    multiplier: bestCard.effectiveMultiplier,
    reason,
    confidence,
    alternatives,
  };
}
