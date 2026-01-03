/**
 * AI-based Merchant Classification
 * Uses Lovable AI as fallback when registry and heuristics fail
 */

import { MerchantCategory, MERCHANT_CATEGORIES, Confidence, isValidCategory } from '../merchantCategories';
import { getAICache, setAICache } from './aiCache';

export interface AIClassificationResult {
  category: MerchantCategory;
  confidence: Confidence;
  rationale: string;
  suggestedMerchantName?: string;
}

/**
 * Classify a merchant using Lovable AI
 * Only called when registry and heuristics fail or have low confidence
 */
export async function classifyMerchantWithAI(input: {
  url: string;
  domain: string;
  title?: string;
}): Promise<AIClassificationResult> {
  const { url, domain, title } = input;
  
  // Check cache first
  const cached = getAICache(domain);
  if (cached) {
    return cached;
  }

  try {
    // Call the edge function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-merchant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ url, domain, title }),
      }
    );

    if (!response.ok) {
      console.error('AI classification failed:', response.status);
      return createFallbackResult(domain);
    }

    const data = await response.json();
    
    // Validate the response
    if (!data.category || !isValidCategory(data.category)) {
      console.warn('Invalid AI category response:', data.category);
      return createFallbackResult(domain);
    }

    const result: AIClassificationResult = {
      category: data.category,
      confidence: data.confidence || 'low',
      rationale: data.rationale || 'AI classification',
      suggestedMerchantName: data.merchantName,
    };

    // Cache the result
    setAICache(domain, result);

    return result;
  } catch (error) {
    console.error('AI classification error:', error);
    return createFallbackResult(domain);
  }
}

function createFallbackResult(domain: string): AIClassificationResult {
  // Extract a display name from domain
  const baseName = domain.split('.')[0];
  const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  
  return {
    category: 'other',
    confidence: 'low',
    rationale: 'Unable to classify - defaulting to general category',
    suggestedMerchantName: displayName,
  };
}

/**
 * Get available categories for AI prompt (exported for edge function)
 */
export function getAvailableCategories(): readonly string[] {
  return MERCHANT_CATEGORIES;
}
