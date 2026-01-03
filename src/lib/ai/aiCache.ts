/**
 * Simple in-memory + localStorage cache for AI classification results
 * Prevents repeated API calls for the same domains
 */

import { AIClassificationResult } from './merchantClassifier';

const CACHE_KEY = 'cc_ai_cache_v1';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry {
  result: AIClassificationResult;
  createdAt: number;
}

interface CacheStore {
  [domain: string]: CacheEntry;
}

// In-memory cache for fast access
let memoryCache: CacheStore = {};

// Load from localStorage on init
function loadFromStorage(): CacheStore {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load AI cache from storage:', error);
  }
  return {};
}

// Save to localStorage
function saveToStorage(cache: CacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save AI cache to storage:', error);
  }
}

// Initialize memory cache from storage
memoryCache = loadFromStorage();

/**
 * Get cached result for a domain
 */
export function getAICache(domain: string): AIClassificationResult | null {
  const normalizedDomain = domain.toLowerCase();
  const entry = memoryCache[normalizedDomain];
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() - entry.createdAt > TTL_MS) {
    delete memoryCache[normalizedDomain];
    saveToStorage(memoryCache);
    return null;
  }
  
  return entry.result;
}

/**
 * Cache an AI classification result
 */
export function setAICache(domain: string, result: AIClassificationResult): void {
  const normalizedDomain = domain.toLowerCase();
  
  memoryCache[normalizedDomain] = {
    result,
    createdAt: Date.now(),
  };
  
  saveToStorage(memoryCache);
}

/**
 * Clear the entire cache
 */
export function clearAICache(): void {
  memoryCache = {};
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear AI cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getAICacheStats(): { count: number; oldestEntry: Date | null } {
  const entries = Object.values(memoryCache);
  const count = entries.length;
  
  let oldest: number | null = null;
  for (const entry of entries) {
    if (oldest === null || entry.createdAt < oldest) {
      oldest = entry.createdAt;
    }
  }
  
  return {
    count,
    oldestEntry: oldest ? new Date(oldest) : null,
  };
}
