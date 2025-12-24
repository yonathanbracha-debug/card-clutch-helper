import { 
  CreditCard, 
  creditCards, 
  merchantMappings, 
  MerchantMapping,
  MerchantCategory,
  categoryLabels 
} from './cardData';

export interface Recommendation {
  card: CreditCard;
  merchant: MerchantMapping | null;
  category: MerchantCategory;
  categoryLabel: string;
  multiplier: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

function extractDomain(url: string): string {
  try {
    // Clean up the input
    let cleanUrl = url.trim().toLowerCase();
    
    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const urlObj = new URL(cleanUrl);
    let hostname = urlObj.hostname;
    
    // Remove www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch {
    // If URL parsing fails, try to extract domain manually
    let domain = url.trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    domain = domain.split('/')[0];
    return domain;
  }
}

function inferCategoryFromDomain(domain: string): { category: MerchantCategory; merchantName: string } {
  // Common domain patterns for category inference
  const patterns: { pattern: RegExp; category: MerchantCategory }[] = [
    { pattern: /food|eat|dine|restaurant|pizza|burger|sushi|taco|thai|chinese|indian|mexican/i, category: 'dining' },
    { pattern: /grocery|market|fresh|organic|foods/i, category: 'groceries' },
    { pattern: /fashion|cloth|wear|style|apparel|shoes|sneaker/i, category: 'apparel' },
    { pattern: /stream|movie|music|game|play|entertainment/i, category: 'entertainment' },
    { pattern: /travel|hotel|flight|air|vacation|trip/i, category: 'travel' },
    { pattern: /pharmacy|drug|health|med|rx/i, category: 'drugstores' },
    { pattern: /gas|fuel|petro/i, category: 'gas' },
  ];

  for (const { pattern, category } of patterns) {
    if (pattern.test(domain)) {
      // Create a readable merchant name from domain
      const baseName = domain.split('.')[0];
      const merchantName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      return { category, merchantName };
    }
  }

  // Default to general
  const baseName = domain.split('.')[0];
  const merchantName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  return { category: 'general', merchantName };
}

function getCardMultiplier(card: CreditCard, category: MerchantCategory, isWarehouse: boolean): number {
  // Special handling for Amex Gold - no grocery bonus at warehouse/big box
  if (card.id === 'amex-gold' && category === 'groceries' && isWarehouse) {
    return 1; // Falls back to base rate
  }
  
  // Find the reward for this category
  const reward = card.rewards.find(r => r.category === category);
  if (reward) {
    return reward.multiplier;
  }
  
  // Fall back to general rate
  const generalReward = card.rewards.find(r => r.category === 'general');
  return generalReward?.multiplier || 1;
}

export function getRecommendation(
  url: string,
  selectedCardIds: string[]
): Recommendation | null {
  if (!url || selectedCardIds.length === 0) {
    return null;
  }

  const domain = extractDomain(url);
  
  // Find known merchant
  const knownMerchant = merchantMappings.find(m => domain.includes(m.domain) || m.domain.includes(domain));
  
  let category: MerchantCategory;
  let merchantName: string;
  let confidence: 'high' | 'medium' | 'low';
  let isWarehouse = false;

  if (knownMerchant) {
    category = knownMerchant.category;
    merchantName = knownMerchant.name;
    isWarehouse = knownMerchant.isWarehouse || false;
    confidence = 'high';
  } else {
    // Infer category from domain
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

  // Calculate best card
  let bestCard = availableCards[0];
  let bestMultiplier = getCardMultiplier(bestCard, category, isWarehouse);

  for (const card of availableCards) {
    const multiplier = getCardMultiplier(card, category, isWarehouse);
    if (multiplier > bestMultiplier) {
      bestMultiplier = multiplier;
      bestCard = card;
    }
  }

  // If all cards have the same multiplier, prefer Chase Freedom Unlimited as fallback
  const cfu = availableCards.find(c => c.id === 'chase-freedom-unlimited');
  if (cfu && bestMultiplier === getCardMultiplier(cfu, category, isWarehouse)) {
    bestCard = cfu;
    bestMultiplier = getCardMultiplier(cfu, category, isWarehouse);
  }

  // Generate reason
  let reason: string;
  
  if (bestMultiplier >= 3) {
    reason = `Earn ${bestMultiplier}X on ${categoryLabels[category].toLowerCase()} purchases at ${merchantName}.`;
  } else if (bestMultiplier >= 1.5) {
    reason = `Earn ${bestMultiplier}X on this purchase. This is your best rate for ${merchantName}.`;
  } else {
    reason = `Earn ${bestMultiplier}X base rate. No category bonus applies to this merchant.`;
  }

  // Add warehouse exclusion note if applicable
  if (isWarehouse && bestCard.id !== 'amex-gold') {
    // Check if Amex Gold was in the selection
    const hasAmexGold = selectedCardIds.includes('amex-gold');
    if (hasAmexGold && category !== 'warehouse') {
      reason += ` Note: Amex Gold grocery bonus doesn't apply at ${merchantName}.`;
    }
  }

  return {
    card: bestCard,
    merchant: knownMerchant || null,
    category,
    categoryLabel: categoryLabels[category],
    multiplier: bestMultiplier,
    reason,
    confidence,
  };
}
