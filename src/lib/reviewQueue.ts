/**
 * Merchant Review Queue
 * Stores AI/heuristic suggestions pending admin review
 */

import { MerchantCategory, Confidence } from './merchantCategories';
import { supabase } from '@/integrations/supabase/client';

export interface PendingMerchantSuggestion {
  id: string;
  url: string;
  domain: string;
  inferredCategory: MerchantCategory;
  confidence: Confidence;
  rationale: string;
  source: 'ai' | 'heuristic' | 'user_report';
  suggestedMerchantName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

const QUEUE_KEY = 'cc_review_queue_v1';

// Storage adapter interface for future Supabase migration
interface ReviewQueueStore {
  list(): Promise<PendingMerchantSuggestion[]>;
  add(suggestion: Omit<PendingMerchantSuggestion, 'id' | 'createdAt' | 'status'>): Promise<PendingMerchantSuggestion>;
  update(id: string, updates: Partial<PendingMerchantSuggestion>): Promise<void>;
  approve(id: string, notes?: string): Promise<void>;
  reject(id: string, notes?: string): Promise<void>;
  getByDomain(domain: string): Promise<PendingMerchantSuggestion | null>;
}

// LocalStorage implementation
class LocalStorageQueueStore implements ReviewQueueStore {
  private getQueue(): PendingMerchantSuggestion[] {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: PendingMerchantSuggestion[]): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to save review queue:', error);
    }
  }

  async list(): Promise<PendingMerchantSuggestion[]> {
    return this.getQueue();
  }

  async add(suggestion: Omit<PendingMerchantSuggestion, 'id' | 'createdAt' | 'status'>): Promise<PendingMerchantSuggestion> {
    const queue = this.getQueue();
    
    // Check for duplicate domain
    const existing = queue.find(s => s.domain === suggestion.domain && s.status === 'pending');
    if (existing) {
      return existing;
    }

    const newSuggestion: PendingMerchantSuggestion = {
      ...suggestion,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    queue.push(newSuggestion);
    this.saveQueue(queue);
    
    return newSuggestion;
  }

  async update(id: string, updates: Partial<PendingMerchantSuggestion>): Promise<void> {
    const queue = this.getQueue();
    const index = queue.findIndex(s => s.id === id);
    
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      this.saveQueue(queue);
    }
  }

  async approve(id: string, notes?: string): Promise<void> {
    await this.update(id, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewerNotes: notes,
    });
  }

  async reject(id: string, notes?: string): Promise<void> {
    await this.update(id, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewerNotes: notes,
    });
  }

  async getByDomain(domain: string): Promise<PendingMerchantSuggestion | null> {
    const queue = this.getQueue();
    return queue.find(s => s.domain === domain && s.status === 'pending') || null;
  }
}

// Export singleton instance
export const reviewQueueStore: ReviewQueueStore = new LocalStorageQueueStore();

/**
 * Add a suggestion to the review queue
 */
export async function addToReviewQueue(
  suggestion: Omit<PendingMerchantSuggestion, 'id' | 'createdAt' | 'status'>
): Promise<PendingMerchantSuggestion> {
  return reviewQueueStore.add(suggestion);
}

/**
 * Get all pending suggestions
 */
export async function getPendingSuggestions(): Promise<PendingMerchantSuggestion[]> {
  const all = await reviewQueueStore.list();
  return all.filter(s => s.status === 'pending');
}

/**
 * Get all suggestions (for admin review)
 */
export async function getAllSuggestions(): Promise<PendingMerchantSuggestion[]> {
  return reviewQueueStore.list();
}

/**
 * Approve a suggestion
 */
export async function approveSuggestion(id: string, notes?: string): Promise<void> {
  return reviewQueueStore.approve(id, notes);
}

/**
 * Reject a suggestion
 */
export async function rejectSuggestion(id: string, notes?: string): Promise<void> {
  return reviewQueueStore.reject(id, notes);
}

/**
 * Check if domain has a pending suggestion
 */
export async function hasPendingSuggestion(domain: string): Promise<boolean> {
  const suggestion = await reviewQueueStore.getByDomain(domain);
  return suggestion !== null;
}
