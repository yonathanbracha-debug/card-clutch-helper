/**
 * Local card image assets mapping
 * Maps card names/slugs to their local image assets
 * 
 * Priority for CardImage component:
 * 1. Valid card.image_url from database
 * 2. Local asset from this mapping
 * 3. CardArtwork fallback
 */

// Import local card images
import amexGold from '@/assets/cards/amex-gold.webp';
import amexPlatinum from '@/assets/cards/amex-platinum.webp';
import chaseSapphirePreferred from '@/assets/cards/chase-sapphire-preferred.webp';
import chaseSapphireReserve from '@/assets/cards/chase-sapphire-reserve.webp';
import chaseFreedomUnlimited from '@/assets/cards/chase-freedom-unlimited.webp';
import chaseFreedomFlex from '@/assets/cards/chase-freedom-flex.webp';
import appleCard from '@/assets/cards/apple-card.webp';
import capitalOneVentureX from '@/assets/cards/capital-one-venture-x.webp';
import capitalOneSavorOne from '@/assets/cards/capital-one-savor-one.webp';
import citiDoubleCash from '@/assets/cards/citi-double-cash.webp';
import discoverIt from '@/assets/cards/discover-it.webp';
import bofaPremiumRewards from '@/assets/cards/bofa-premium-rewards.webp';

/**
 * Normalizes a card name to a consistent slug format
 */
export function normalizeCardSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '') // Remove trademark symbols
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/[^a-z0-9-]/g, '') // Remove special chars
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Trim dashes
}

/**
 * Card image mapping - maps slugs/patterns to local assets
 */
const cardImageMap: Record<string, string> = {
  // American Express
  'gold-card': amexGold,
  'amex-gold': amexGold,
  'american-express-gold': amexGold,
  'platinum-card': amexPlatinum,
  'amex-platinum': amexPlatinum,
  'american-express-platinum': amexPlatinum,
  'the-platinum-card': amexPlatinum,
  
  // Chase
  'sapphire-preferred': chaseSapphirePreferred,
  'chase-sapphire-preferred': chaseSapphirePreferred,
  'sapphire-reserve': chaseSapphireReserve,
  'chase-sapphire-reserve': chaseSapphireReserve,
  'freedom-unlimited': chaseFreedomUnlimited,
  'chase-freedom-unlimited': chaseFreedomUnlimited,
  'freedom-flex': chaseFreedomFlex,
  'chase-freedom-flex': chaseFreedomFlex,
  
  // Apple
  'apple-card': appleCard,
  
  // Capital One
  'venture-x': capitalOneVentureX,
  'capital-one-venture-x': capitalOneVentureX,
  'venture-x-rewards': capitalOneVentureX,
  'savorone': capitalOneSavorOne,
  'savor-one': capitalOneSavorOne,
  'capital-one-savorone': capitalOneSavorOne,
  
  // Citi
  'double-cash': citiDoubleCash,
  'citi-double-cash': citiDoubleCash,
  'double-cash-card': citiDoubleCash,
  
  // Discover
  'discover-it': discoverIt,
  'discover-it-cash-back': discoverIt,
  'it-cash-back': discoverIt,
  
  // Bank of America
  'premium-rewards': bofaPremiumRewards,
  'bofa-premium-rewards': bofaPremiumRewards,
  'bank-of-america-premium-rewards': bofaPremiumRewards,
};

/**
 * Gets the local asset URL for a card by name
 * Returns undefined if no local asset exists
 */
export function getLocalCardImage(cardName: string): string | undefined {
  const slug = normalizeCardSlug(cardName);
  
  // Direct match
  if (cardImageMap[slug]) {
    return cardImageMap[slug];
  }
  
  // Partial match - check if slug contains any key
  for (const [key, value] of Object.entries(cardImageMap)) {
    if (slug.includes(key) || key.includes(slug)) {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Validates if a URL is a valid image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}