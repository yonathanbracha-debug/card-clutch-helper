/**
 * Heuristic Category Inference
 * Non-AI fallback for inferring merchant categories from URLs and domains
 */

import { MerchantCategory, Confidence } from './merchantCategories';

export interface HeuristicResult {
  category: MerchantCategory;
  confidence: Confidence;
  reason: string;
}

// Keyword patterns for category inference
const CATEGORY_PATTERNS: Array<{
  pattern: RegExp;
  category: MerchantCategory;
  confidence: Confidence;
  reason: string;
}> = [
  // Dining
  { pattern: /\b(restaurant|dine|dining|cafe|coffee|bistro|eatery|food\s*delivery|takeout|order\s*food)\b/i, category: 'dining', confidence: 'medium', reason: 'Dining keyword detected in URL' },
  { pattern: /\b(pizza|burger|sushi|taco|thai|chinese|indian|mexican|italian|korean|japanese|vietnamese|mediterranean)\b/i, category: 'dining', confidence: 'medium', reason: 'Restaurant cuisine type in URL' },
  { pattern: /\b(grubhub|doordash|ubereats|postmates|seamless|caviar)\b/i, category: 'dining', confidence: 'high', reason: 'Known food delivery platform' },
  
  // Groceries
  { pattern: /\b(grocery|groceries|supermarket|market|organic|fresh|produce|meat|seafood|deli)\b/i, category: 'groceries', confidence: 'medium', reason: 'Grocery keyword detected' },
  { pattern: /\b(instacart|shipt|freshdirect|peapod)\b/i, category: 'groceries', confidence: 'high', reason: 'Known grocery delivery service' },
  
  // Travel
  { pattern: /\b(flight|flights|airline|airfare|booking|hotel|hotels|reservation|vacation|trip|travel|resort)\b/i, category: 'travel', confidence: 'medium', reason: 'Travel keyword detected' },
  { pattern: /\b(expedia|kayak|priceline|orbitz|travelocity|tripadvisor|airbnb|vrbo|booking\.com)\b/i, category: 'travel', confidence: 'high', reason: 'Known travel platform' },
  
  // Gas
  { pattern: /\b(gas|gasoline|fuel|petro|petroleum|filling\s*station)\b/i, category: 'gas', confidence: 'medium', reason: 'Gas/fuel keyword detected' },
  { pattern: /\b(shell|chevron|exxon|mobil|bp|texaco|speedway|wawa|sheetz)\b/i, category: 'gas', confidence: 'high', reason: 'Known gas station brand' },
  
  // Transit
  { pattern: /\b(rideshare|ride\s*share|taxi|cab|uber|lyft|scooter|bike\s*share)\b/i, category: 'transit', confidence: 'medium', reason: 'Transit/rideshare keyword detected' },
  
  // Streaming
  { pattern: /\b(stream|streaming|subscription|watch|listen|podcast|audiobook)\b/i, category: 'streaming', confidence: 'low', reason: 'Streaming-related keyword' },
  { pattern: /\b(netflix|hulu|disney|hbo|max|spotify|pandora|apple\s*music|youtube\s*premium|peacock|paramount)\b/i, category: 'streaming', confidence: 'high', reason: 'Known streaming service' },
  
  // Entertainment
  { pattern: /\b(ticket|tickets|concert|show|event|movie|cinema|theatre|theater|performance)\b/i, category: 'entertainment', confidence: 'medium', reason: 'Entertainment/ticket keyword' },
  { pattern: /\b(ticketmaster|stubhub|seatgeek|fandango|amc|regal)\b/i, category: 'entertainment', confidence: 'high', reason: 'Known entertainment platform' },
  
  // Drugstores
  { pattern: /\b(pharmacy|drug|prescription|rx|medicine|health)\b/i, category: 'drugstores', confidence: 'medium', reason: 'Pharmacy/drugstore keyword' },
  { pattern: /\b(cvs|walgreens|rite\s*aid|duane\s*reade)\b/i, category: 'drugstores', confidence: 'high', reason: 'Known drugstore chain' },
  
  // Electronics
  { pattern: /\b(electronics|computer|laptop|phone|smartphone|tech|gadget|device)\b/i, category: 'electronics', confidence: 'low', reason: 'Electronics keyword detected' },
  { pattern: /\b(bestbuy|newegg|bhphoto|microcenter)\b/i, category: 'electronics', confidence: 'high', reason: 'Known electronics retailer' },
  
  // Home Improvement
  { pattern: /\b(home\s*improvement|hardware|furniture|decor|appliance|kitchen|bath|bedroom)\b/i, category: 'home_improvement', confidence: 'medium', reason: 'Home improvement keyword' },
  { pattern: /\b(homedepot|home\s*depot|lowes|lowe\'s|ikea|wayfair|pottery\s*barn)\b/i, category: 'home_improvement', confidence: 'high', reason: 'Known home improvement retailer' },
  
  // Apparel
  { pattern: /\b(fashion|clothing|clothes|apparel|wear|shoes|footwear|sneaker|dress|suit)\b/i, category: 'apparel', confidence: 'medium', reason: 'Apparel keyword detected' },
  { pattern: /\b(nike|adidas|zara|hm|h&m|gap|uniqlo|nordstrom|macy)\b/i, category: 'apparel', confidence: 'high', reason: 'Known apparel brand' },
  
  // Beauty
  { pattern: /\b(beauty|cosmetic|makeup|skincare|fragrance|perfume|salon|spa)\b/i, category: 'beauty', confidence: 'medium', reason: 'Beauty keyword detected' },
  { pattern: /\b(sephora|ulta|bath\s*and\s*body)\b/i, category: 'beauty', confidence: 'high', reason: 'Known beauty retailer' },
  
  // Warehouse
  { pattern: /\b(warehouse|wholesale|bulk|membership\s*club)\b/i, category: 'warehouse_club', confidence: 'medium', reason: 'Warehouse/wholesale keyword' },
  { pattern: /\b(costco|sam\'s\s*club|bj\'s)\b/i, category: 'warehouse_club', confidence: 'high', reason: 'Known warehouse club' },
  
  // Department Store
  { pattern: /\b(department\s*store)\b/i, category: 'department_store', confidence: 'medium', reason: 'Department store keyword' },
  { pattern: /\b(target|walmart|kohl|jcpenney|sears)\b/i, category: 'department_store', confidence: 'high', reason: 'Known department store' },
  
  // Pet
  { pattern: /\b(pet|pets|dog|cat|animal|veterinary|vet)\b/i, category: 'pet', confidence: 'medium', reason: 'Pet-related keyword' },
  { pattern: /\b(petco|petsmart|chewy)\b/i, category: 'pet', confidence: 'high', reason: 'Known pet retailer' },
  
  // Office
  { pattern: /\b(office|supplies|stationary|printer|ink|paper)\b/i, category: 'office', confidence: 'low', reason: 'Office supplies keyword' },
  { pattern: /\b(staples|office\s*depot|office\s*max)\b/i, category: 'office', confidence: 'high', reason: 'Known office retailer' },
  
  // Utilities/Telecom
  { pattern: /\b(utility|utilities|electric|power|water|gas\s*bill)\b/i, category: 'utilities', confidence: 'medium', reason: 'Utility keyword' },
  { pattern: /\b(mobile|wireless|phone\s*plan|cell\s*phone|internet|broadband|cable)\b/i, category: 'telecom', confidence: 'medium', reason: 'Telecom keyword' },
  { pattern: /\b(verizon|att|at&t|tmobile|t\-mobile|sprint|xfinity|spectrum|comcast)\b/i, category: 'telecom', confidence: 'high', reason: 'Known telecom provider' },
  
  // Online Retail (broad fallback)
  { pattern: /\b(shop|store|buy|cart|checkout|order|purchase)\b/i, category: 'online_retail', confidence: 'low', reason: 'Generic shopping keyword' },
];

/**
 * Infer category from URL using pattern matching
 */
export function inferCategoryFromUrl(url: string): HeuristicResult | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const lowerUrl = url.toLowerCase();

  // Check each pattern
  for (const { pattern, category, confidence, reason } of CATEGORY_PATTERNS) {
    if (pattern.test(lowerUrl)) {
      return { category, confidence, reason };
    }
  }

  return null;
}

/**
 * Infer category from page title
 */
export function inferCategoryFromTitle(title: string): HeuristicResult | null {
  if (!title || typeof title !== 'string') {
    return null;
  }

  // Use same patterns but with lower confidence for titles
  const lowerTitle = title.toLowerCase();

  for (const { pattern, category, reason } of CATEGORY_PATTERNS) {
    if (pattern.test(lowerTitle)) {
      return { 
        category, 
        confidence: 'low', 
        reason: `${reason} (from page title)` 
      };
    }
  }

  return null;
}

/**
 * Combine multiple heuristic signals
 */
export function combineHeuristics(
  urlResult: HeuristicResult | null,
  titleResult: HeuristicResult | null
): HeuristicResult | null {
  // If both agree, boost confidence
  if (urlResult && titleResult && urlResult.category === titleResult.category) {
    return {
      category: urlResult.category,
      confidence: urlResult.confidence === 'high' || titleResult.confidence === 'high' ? 'high' : 'medium',
      reason: `${urlResult.reason}; confirmed by page title`,
    };
  }

  // Prefer URL result over title
  return urlResult || titleResult;
}
