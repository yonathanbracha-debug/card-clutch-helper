/**
 * Merchant Intelligence Engine
 * Single orchestrator for merchant resolution
 * Combines: Overrides > Registry > Heuristics > AI
 */

import { MerchantCategory, Confidence, CATEGORY_LABELS, mapToEngineCategory } from './merchantCategories';
import { extractRegistrableDomain } from './domain';
import { findMerchantByDomain, MerchantRecord } from './merchantRegistry';
import { inferCategoryFromUrl, inferCategoryFromTitle, combineHeuristics, HeuristicResult } from './merchantHeuristics';
import { getOverride, MerchantOverride } from './merchantOverrides';
import { addToReviewQueue, hasPendingSuggestion, PendingMerchantSuggestion } from './reviewQueue';
import { classifyMerchantWithAI, AIClassificationResult } from './ai/merchantClassifier';

export interface DecisionStep {
  step: string;
  detail: string;
}

export interface MerchantExplanation {
  summary: string;
  decisionPath: DecisionStep[];
}

export interface MerchantContext {
  domain: string | null;
  merchantName: string;
  category: MerchantCategory;
  engineCategory: string; // For backwards compatibility
  confidence: Confidence;
  source: 'override' | 'registry' | 'heuristic' | 'ai' | 'unknown';
  explanation: MerchantExplanation;
  aiSuggestion?: {
    category: MerchantCategory;
    confidence: Confidence;
    rationale: string;
    queuedForReview?: boolean;
  };
  registryRecord?: MerchantRecord;
  overrideRecord?: MerchantOverride;
  exclusions?: string[];
  isWarehouse?: boolean;
  excludedFromGrocery?: boolean;
}

/**
 * Main entry point: Resolve merchant context from a URL
 */
export async function resolveMerchantContext(
  url: string,
  pageTitle?: string,
  options: { skipAI?: boolean; forceAI?: boolean } = {}
): Promise<MerchantContext> {
  const decisionPath: DecisionStep[] = [];
  
  // Step 1: Extract domain
  const domain = extractRegistrableDomain(url);
  
  if (!domain) {
    return createUnknownResult(url, 'Could not extract valid domain from URL', decisionPath);
  }
  
  decisionPath.push({ step: 'Domain extracted', detail: domain });
  
  // Step 2: Check overrides (highest priority)
  const override = getOverride(domain);
  if (override) {
    decisionPath.push({ step: 'Override found', detail: `Admin-approved: ${override.displayName} → ${override.category}` });
    return {
      domain,
      merchantName: override.displayName || capitalize(domain.split('.')[0]),
      category: override.category,
      engineCategory: mapToEngineCategory(override.category),
      confidence: 'high',
      source: 'override',
      explanation: {
        summary: `Using admin-approved mapping for ${override.displayName || domain}`,
        decisionPath,
      },
      overrideRecord: override,
    };
  }
  decisionPath.push({ step: 'Override check', detail: 'No admin override found' });
  
  // Step 3: Check registry
  const registryMatch = findMerchantByDomain(domain);
  if (registryMatch) {
    decisionPath.push({ 
      step: 'Registry match', 
      detail: `Found: ${registryMatch.displayName} (${registryMatch.defaultCategory})${registryMatch.verified ? ' ✓' : ''}` 
    });
    
    // Check for category overrides based on URL path
    let category = registryMatch.defaultCategory;
    let confidence: Confidence = registryMatch.verified ? 'high' : 'medium';
    
    if (registryMatch.categoryOverrides) {
      for (const override of registryMatch.categoryOverrides) {
        if (override.match.pathIncludes?.some(p => url.toLowerCase().includes(p))) {
          category = override.category;
          confidence = override.confidence;
          decisionPath.push({ step: 'Path override', detail: override.reason });
          break;
        }
      }
    }
    
    return {
      domain,
      merchantName: registryMatch.displayName,
      category,
      engineCategory: mapToEngineCategory(category),
      confidence,
      source: 'registry',
      explanation: {
        summary: `${registryMatch.displayName} is a known ${CATEGORY_LABELS[category].toLowerCase()} merchant`,
        decisionPath,
      },
      registryRecord: registryMatch,
      exclusions: registryMatch.exclusions,
      isWarehouse: registryMatch.tags?.includes('warehouse'),
      excludedFromGrocery: registryMatch.exclusions?.includes('grocery-excluded') || 
                          registryMatch.exclusions?.includes('grocery-excluded-by-most-cards'),
    };
  }
  decisionPath.push({ step: 'Registry check', detail: 'Not found in merchant registry' });
  
  // Step 4: Try heuristics
  const urlHeuristic = inferCategoryFromUrl(url);
  const titleHeuristic = pageTitle ? inferCategoryFromTitle(pageTitle) : null;
  const heuristicResult = combineHeuristics(urlHeuristic, titleHeuristic);
  
  if (heuristicResult && (heuristicResult.confidence === 'high' || heuristicResult.confidence === 'medium')) {
    decisionPath.push({ 
      step: 'Heuristic match', 
      detail: `${heuristicResult.reason} (${heuristicResult.confidence} confidence)` 
    });
    
    return {
      domain,
      merchantName: capitalize(domain.split('.')[0]),
      category: heuristicResult.category,
      engineCategory: mapToEngineCategory(heuristicResult.category),
      confidence: heuristicResult.confidence,
      source: 'heuristic',
      explanation: {
        summary: `Detected as ${CATEGORY_LABELS[heuristicResult.category].toLowerCase()} based on URL patterns`,
        decisionPath,
      },
    };
  }
  
  if (heuristicResult) {
    decisionPath.push({ step: 'Heuristic', detail: `Low confidence: ${heuristicResult.reason}` });
  } else {
    decisionPath.push({ step: 'Heuristic check', detail: 'No pattern match found' });
  }
  
  // Step 5: AI fallback (if enabled and needed)
  if (!options.skipAI && (options.forceAI || !heuristicResult || heuristicResult.confidence === 'low')) {
    try {
      decisionPath.push({ step: 'AI classification', detail: 'Requesting AI analysis...' });
      
      const aiResult = await classifyMerchantWithAI({ url, domain, title: pageTitle });
      
      decisionPath.push({ 
        step: 'AI result', 
        detail: `${aiResult.category} (${aiResult.confidence}) - ${aiResult.rationale}` 
      });
      
      // Queue for review if AI was used
      let queuedForReview = false;
      const alreadyPending = await hasPendingSuggestion(domain);
      
      if (!alreadyPending) {
        await addToReviewQueue({
          url,
          domain,
          inferredCategory: aiResult.category,
          confidence: aiResult.confidence,
          rationale: aiResult.rationale,
          source: 'ai',
          suggestedMerchantName: aiResult.suggestedMerchantName,
        });
        queuedForReview = true;
        decisionPath.push({ step: 'Review queue', detail: 'Added to admin review queue' });
      }
      
      return {
        domain,
        merchantName: aiResult.suggestedMerchantName || capitalize(domain.split('.')[0]),
        category: aiResult.category,
        engineCategory: mapToEngineCategory(aiResult.category),
        confidence: aiResult.confidence,
        source: 'ai',
        explanation: {
          summary: `AI classified as ${CATEGORY_LABELS[aiResult.category].toLowerCase()} (pending review)`,
          decisionPath,
        },
        aiSuggestion: {
          category: aiResult.category,
          confidence: aiResult.confidence,
          rationale: aiResult.rationale,
          queuedForReview,
        },
      };
    } catch (error) {
      decisionPath.push({ step: 'AI error', detail: 'AI classification failed, using fallback' });
    }
  }
  
  // Step 6: Use heuristic if we have one (even low confidence)
  if (heuristicResult) {
    return {
      domain,
      merchantName: capitalize(domain.split('.')[0]),
      category: heuristicResult.category,
      engineCategory: mapToEngineCategory(heuristicResult.category),
      confidence: 'low',
      source: 'heuristic',
      explanation: {
        summary: `Best guess: ${CATEGORY_LABELS[heuristicResult.category].toLowerCase()} (low confidence)`,
        decisionPath,
      },
    };
  }
  
  // Step 7: Complete unknown
  return createUnknownResult(domain, 'Could not determine merchant category', decisionPath);
}

function createUnknownResult(
  domainOrUrl: string,
  reason: string,
  decisionPath: DecisionStep[]
): MerchantContext {
  decisionPath.push({ step: 'Fallback', detail: reason });
  
  const displayName = domainOrUrl.includes('.') 
    ? capitalize(domainOrUrl.split('.')[0])
    : 'Unknown Merchant';
  
  return {
    domain: domainOrUrl.includes('.') ? domainOrUrl : null,
    merchantName: displayName,
    category: 'other',
    engineCategory: 'general',
    confidence: 'low',
    source: 'unknown',
    explanation: {
      summary: 'Unable to determine merchant category - using general rate',
      decisionPath,
    },
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Quick sync check (no AI) for UI responsiveness
 */
export function resolveMerchantContextSync(
  url: string,
  pageTitle?: string
): Omit<MerchantContext, 'aiSuggestion'> {
  const decisionPath: DecisionStep[] = [];
  
  const domain = extractRegistrableDomain(url);
  if (!domain) {
    return createUnknownResult(url, 'Invalid domain', decisionPath) as Omit<MerchantContext, 'aiSuggestion'>;
  }
  
  // Check override
  const override = getOverride(domain);
  if (override) {
    return {
      domain,
      merchantName: override.displayName || capitalize(domain.split('.')[0]),
      category: override.category,
      engineCategory: mapToEngineCategory(override.category),
      confidence: 'high',
      source: 'override',
      explanation: {
        summary: `Admin-approved: ${override.displayName || domain}`,
        decisionPath: [{ step: 'Override', detail: 'Admin-approved mapping' }],
      },
      overrideRecord: override,
    };
  }
  
  // Check registry
  const registryMatch = findMerchantByDomain(domain);
  if (registryMatch) {
    return {
      domain,
      merchantName: registryMatch.displayName,
      category: registryMatch.defaultCategory,
      engineCategory: mapToEngineCategory(registryMatch.defaultCategory),
      confidence: registryMatch.verified ? 'high' : 'medium',
      source: 'registry',
      explanation: {
        summary: `Known merchant: ${registryMatch.displayName}`,
        decisionPath: [{ step: 'Registry', detail: `Found: ${registryMatch.displayName}` }],
      },
      registryRecord: registryMatch,
      exclusions: registryMatch.exclusions,
      isWarehouse: registryMatch.tags?.includes('warehouse'),
      excludedFromGrocery: registryMatch.exclusions?.includes('grocery-excluded') || 
                          registryMatch.exclusions?.includes('grocery-excluded-by-most-cards'),
    };
  }
  
  // Try heuristics
  const urlHeuristic = inferCategoryFromUrl(url);
  const titleHeuristic = pageTitle ? inferCategoryFromTitle(pageTitle) : null;
  const heuristicResult = combineHeuristics(urlHeuristic, titleHeuristic);
  
  if (heuristicResult) {
    return {
      domain,
      merchantName: capitalize(domain.split('.')[0]),
      category: heuristicResult.category,
      engineCategory: mapToEngineCategory(heuristicResult.category),
      confidence: heuristicResult.confidence,
      source: 'heuristic',
      explanation: {
        summary: `Pattern detected: ${CATEGORY_LABELS[heuristicResult.category].toLowerCase()}`,
        decisionPath: [{ step: 'Heuristic', detail: heuristicResult.reason }],
      },
    };
  }
  
  return createUnknownResult(domain, 'Unknown merchant', decisionPath) as Omit<MerchantContext, 'aiSuggestion'>;
}
