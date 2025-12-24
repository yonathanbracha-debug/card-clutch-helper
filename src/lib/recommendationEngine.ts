import { 
  CreditCard, 
  creditCards, 
  merchantMappings, 
  MerchantMapping,
  MerchantCategory,
  categoryLabels 
} from './cardData';

export interface CardAnalysis {
  card: CreditCard;
  effectiveMultiplier: number;
  reason: string;
  excluded: boolean;
  exclusionReason?: string;
}

export interface Recommendation {
  card: CreditCard;
  merchant: MerchantMapping | null;
  category: MerchantCategory;
  categoryLabel: string;
  multiplier: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives: CardAnalysis[];
}

function extractDomain(url: string): string {
  try {
    let cleanUrl = url.trim().toLowerCase();
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const urlObj = new URL(cleanUrl);
    let hostname = urlObj.hostname;
    
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch {
    let domain = url.trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    domain = domain.split('/')[0];
    return domain;
  }
}

function inferCategoryFromDomain(domain: string): { category: MerchantCategory; merchantName: string } {
  const patterns: { pattern: RegExp; category: MerchantCategory }[] = [
    { pattern: /food|eat|dine|restaurant|pizza|burger|sushi|taco|thai|chinese|indian|mexican|cafe|coffee/i, category: 'dining' },
    { pattern: /grocery|market|fresh|organic|foods|supermarket/i, category: 'groceries' },
    { pattern: /fashion|cloth|wear|style|apparel|shoes|sneaker|boutique/i, category: 'apparel' },
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

function getCardMultiplier(
  card: CreditCard, 
  category: MerchantCategory, 
  merchant: MerchantMapping | null
): { multiplier: number; excluded: boolean; exclusionReason?: string } {
  
  // Check for warehouse/grocery exclusions
  if (merchant?.excludedFromGrocery && category === 'groceries') {
    // Check if this card has grocery exclusions that apply
    const groceryReward = card.rewards.find(r => r.category === 'groceries');
    if (groceryReward?.exclusions) {
      const isExcluded = groceryReward.exclusions.some(
        ex => merchant.name.toLowerCase().includes(ex.toLowerCase()) ||
              ex.toLowerCase().includes(merchant.name.toLowerCase())
      );
      if (isExcluded) {
        const generalReward = card.rewards.find(r => r.category === 'general');
        return {
          multiplier: generalReward?.multiplier || 1,
          excluded: true,
          exclusionReason: `${merchant.name} is excluded from grocery bonus`,
        };
      }
    }
  }

  // Check if warehouse clubs are excluded from grocery
  if (merchant?.isWarehouse) {
    const groceryReward = card.rewards.find(r => r.category === 'groceries');
    if (groceryReward?.exclusions?.some(ex => 
      ['costco', 'sam\'s club', 'bj\'s', 'warehouse'].some(w => ex.toLowerCase().includes(w))
    )) {
      const generalReward = card.rewards.find(r => r.category === 'general');
      return {
        multiplier: generalReward?.multiplier || 1,
        excluded: true,
        exclusionReason: 'Warehouse clubs excluded from grocery bonus',
      };
    }
  }

  // Direct category match
  const directReward = card.rewards.find(r => r.category === category);
  if (directReward) {
    return { multiplier: directReward.multiplier, excluded: false };
  }

  // Category fallbacks
  const fallbacks: Record<string, string[]> = {
    flights: ['travel'],
    hotels: ['travel'],
    transit: ['travel'],
    streaming: ['entertainment'],
    online: ['general'],
    warehouse: ['groceries', 'general'],
    apparel: ['general'],
  };

  const categoryFallbacks = fallbacks[category] || [];
  for (const fallback of categoryFallbacks) {
    const fallbackReward = card.rewards.find(r => r.category === fallback);
    if (fallbackReward) {
      return { multiplier: fallbackReward.multiplier, excluded: false };
    }
  }

  // Fall back to general rate
  const generalReward = card.rewards.find(r => r.category === 'general');
  return { multiplier: generalReward?.multiplier || 1, excluded: false };
}

function analyzeCard(
  card: CreditCard, 
  category: MerchantCategory, 
  merchant: MerchantMapping | null
): CardAnalysis {
  const { multiplier, excluded, exclusionReason } = getCardMultiplier(card, category, merchant);
  
  let reason: string;
  if (excluded && exclusionReason) {
    reason = exclusionReason;
  } else {
    const reward = card.rewards.find(r => r.category === category);
    reason = reward?.description || `${multiplier}X on this purchase`;
  }

  return {
    card,
    effectiveMultiplier: multiplier,
    reason,
    excluded,
    exclusionReason,
  };
}

export function getRecommendation(
  url: string,
  selectedCardIds: string[]
): Recommendation | null {
  if (!url || selectedCardIds.length === 0) {
    return null;
  }

  const domain = extractDomain(url);
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

  // Get available cards
  const availableCards = creditCards.filter(c => selectedCardIds.includes(c.id));
  
  if (availableCards.length === 0) {
    return null;
  }

  // Analyze all cards
  const analyses: CardAnalysis[] = availableCards.map(card => 
    analyzeCard(card, category, knownMerchant || null)
  );

  // Sort by multiplier (highest first), preferring non-excluded cards
  analyses.sort((a, b) => {
    // Non-excluded cards first
    if (a.excluded !== b.excluded) {
      return a.excluded ? 1 : -1;
    }
    // Then by multiplier
    if (b.effectiveMultiplier !== a.effectiveMultiplier) {
      return b.effectiveMultiplier - a.effectiveMultiplier;
    }
    // Prefer lower annual fee cards as tiebreaker
    const aFee = a.card.annualFee || 0;
    const bFee = b.card.annualFee || 0;
    return aFee - bFee;
  });

  const bestCard = analyses[0];
  const alternatives = analyses.slice(1);

  // Generate reason
  let reason: string;
  if (bestCard.excluded) {
    reason = `Safe fallback: ${bestCard.exclusionReason}. Using ${bestCard.effectiveMultiplier}X base rate.`;
  } else if (bestCard.effectiveMultiplier >= 3) {
    reason = `Best rate for ${categoryLabels[category].toLowerCase()}: ${bestCard.effectiveMultiplier}X.`;
  } else if (bestCard.effectiveMultiplier >= 1.5) {
    reason = `${bestCard.effectiveMultiplier}X is your best available rate for this merchant.`;
  } else {
    reason = `No category bonus applies. Using ${bestCard.effectiveMultiplier}X base rate.`;
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