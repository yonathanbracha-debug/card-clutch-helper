/**
 * Benefit Rules - Card-specific perks and credits
 * Conservative, deterministic rules for missed benefit detection
 */

export type BenefitRule = {
  issuer: string;
  card_name: string;
  benefit_id: string;
  title: string;
  cadence: 'monthly' | 'annual';
  value_usd: number;
  triggers: {
    merchant_includes?: string[];
    category?: string[];
  };
  requires_enrollment?: boolean;
  notes: string;
};

export const BENEFIT_RULES: BenefitRule[] = [
  // Amex Gold
  {
    issuer: 'American Express',
    card_name: 'American Express Gold Card',
    benefit_id: 'amex-gold-dining-credit',
    title: 'Dining Credit',
    cadence: 'monthly',
    value_usd: 10,
    triggers: {
      merchant_includes: ['grubhub', 'seamless', 'cheesecake factory', 'goldbelly', 'milk bar', 'shake shack'],
    },
    requires_enrollment: true,
    notes: 'Up to $10/month at select dining partners. Requires enrollment.',
  },
  {
    issuer: 'American Express',
    card_name: 'American Express Gold Card',
    benefit_id: 'amex-gold-uber-credit',
    title: 'Uber Cash',
    cadence: 'monthly',
    value_usd: 10,
    triggers: {
      merchant_includes: ['uber', 'uber eats'],
    },
    requires_enrollment: false,
    notes: '$10/month Uber Cash for U.S. Uber Eats orders or Uber rides.',
  },

  // Amex Platinum
  {
    issuer: 'American Express',
    card_name: 'The Platinum Card from American Express',
    benefit_id: 'amex-plat-uber-credit',
    title: 'Uber Credit',
    cadence: 'monthly',
    value_usd: 15,
    triggers: {
      merchant_includes: ['uber', 'uber eats'],
    },
    requires_enrollment: false,
    notes: 'Up to $15/month in Uber Cash, $35 in December.',
  },
  {
    issuer: 'American Express',
    card_name: 'The Platinum Card from American Express',
    benefit_id: 'amex-plat-digital-credit',
    title: 'Digital Entertainment Credit',
    cadence: 'monthly',
    value_usd: 20,
    triggers: {
      merchant_includes: ['disney+', 'hulu', 'espn+', 'peacock', 'nytimes', 'new york times', 'audible', 'sirius', 'siriusxm'],
    },
    requires_enrollment: true,
    notes: 'Up to $20/month for select streaming services.',
  },
  {
    issuer: 'American Express',
    card_name: 'The Platinum Card from American Express',
    benefit_id: 'amex-plat-walmart-credit',
    title: 'Walmart+ Membership Credit',
    cadence: 'monthly',
    value_usd: 12.95,
    triggers: {
      merchant_includes: ['walmart+', 'walmart plus'],
    },
    requires_enrollment: true,
    notes: 'Covers Walmart+ monthly membership fee.',
  },

  // Chase Sapphire Reserve
  {
    issuer: 'Chase',
    card_name: 'Chase Sapphire Reserve',
    benefit_id: 'csr-travel-credit',
    title: 'Annual Travel Credit',
    cadence: 'annual',
    value_usd: 300,
    triggers: {
      category: ['travel'],
    },
    requires_enrollment: false,
    notes: '$300 annual travel credit applied automatically to travel purchases.',
  },
  {
    issuer: 'Chase',
    card_name: 'Chase Sapphire Reserve',
    benefit_id: 'csr-doordash-credit',
    title: 'DoorDash Credit',
    cadence: 'annual',
    value_usd: 60,
    triggers: {
      merchant_includes: ['doordash'],
    },
    requires_enrollment: true,
    notes: '$60 annual DoorDash credit. Requires DashPass enrollment.',
  },

  // Capital One Venture X
  {
    issuer: 'Capital One',
    card_name: 'Capital One Venture X',
    benefit_id: 'venturex-travel-credit',
    title: 'Annual Travel Credit',
    cadence: 'annual',
    value_usd: 300,
    triggers: {
      merchant_includes: ['capital one travel'],
      category: ['travel'],
    },
    requires_enrollment: false,
    notes: '$300 annual credit for bookings through Capital One Travel.',
  },
];

/**
 * Get all benefits for cards in user's wallet
 */
export function getBenefitsForCards(
  walletCards: Array<{ issuer: string; card_name: string }>
): BenefitRule[] {
  return BENEFIT_RULES.filter(rule =>
    walletCards.some(
      card =>
        card.issuer.toLowerCase().includes(rule.issuer.toLowerCase()) &&
        card.card_name.toLowerCase().includes(rule.card_name.toLowerCase())
    )
  );
}

/**
 * Check if a transaction triggers a benefit
 */
export function doesTransactionTriggerBenefit(
  merchantNormalized: string,
  category: string,
  benefit: BenefitRule
): boolean {
  const merchantMatch = benefit.triggers.merchant_includes?.some(m =>
    merchantNormalized.includes(m.toLowerCase())
  );
  
  const categoryMatch = benefit.triggers.category?.includes(category);
  
  return merchantMatch || categoryMatch || false;
}
