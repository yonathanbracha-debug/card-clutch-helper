/**
 * BNPL Risk Hook
 * Manages BNPL risk detection and event persistence
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  analyzeBNPLRisk, 
  BNPLRiskResponse, 
  UserCreditContext,
  PurchaseClassification 
} from '@/lib/opportunityCostEngine';

interface UseBNPLRiskOptions {
  userContext?: UserCreditContext;
  userCards?: Array<{ name: string; issuer: string }>;
}

export function useBNPLRisk(options: UseBNPLRiskOptions = {}) {
  const { user } = useAuth();
  const [lastResponse, setLastResponse] = useState<BNPLRiskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeRisk = useCallback(async (
    merchantName: string,
    amountCents: number,
    additionalOptions: {
      transactionText?: string;
      category?: string;
      userOptedOut?: boolean;
      isZeroAPR?: boolean;
    } = {}
  ): Promise<BNPLRiskResponse> => {
    setLoading(true);
    
    try {
      const response = analyzeBNPLRisk(
        merchantName,
        amountCents,
        options.userContext || {},
        {
          ...additionalOptions,
          userCards: options.userCards,
        }
      );
      
      setLastResponse(response);
      
      // Persist event if user is logged in and BNPL was detected
      if (user && response.bnpl_detected) {
        await persistRiskEvent(merchantName, amountCents, response);
      }
      
      return response;
    } finally {
      setLoading(false);
    }
  }, [user, options.userContext, options.userCards]);

  const persistRiskEvent = async (
    merchantName: string,
    amountCents: number,
    response: BNPLRiskResponse
  ) => {
    if (!user) return;
    
    try {
      await supabase
        .from('purchase_risk_events')
        .insert({
          user_id: user.id,
          merchant: merchantName,
          amount: amountCents,
          bnpl_detected: response.bnpl_detected,
          bnpl_provider: response.bnpl_provider,
          risk_level: response.risk_level,
          risk_score: response.risk_score,
          explanation: response.explanation,
          alternatives: response.alternatives,
          user_prompt_shown: response.user_prompt_shown,
          suppressed: response.suppressed,
          suppression_reason: response.suppression_reason,
        });
    } catch (err) {
      console.error('Error persisting risk event:', err);
    }
  };

  const classifyPurchase = useCallback(async (
    eventId: string,
    classification: PurchaseClassification
  ) => {
    if (!user) return;
    
    try {
      await supabase
        .from('purchase_risk_events')
        .update({ user_classification: classification })
        .eq('id', eventId)
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error classifying purchase:', err);
    }
  }, [user]);

  const getRiskHistory = useCallback(async (limit = 20) => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('purchase_risk_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching risk history:', err);
      return [];
    }
  }, [user]);

  const getBNPLSummary = useCallback(async () => {
    if (!user) return { count: 0, totalAmount: 0, highRiskCount: 0 };
    
    try {
      const { data, error } = await supabase
        .from('purchase_risk_events')
        .select('amount, risk_level')
        .eq('user_id', user.id)
        .eq('bnpl_detected', true)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      return {
        count: data?.length || 0,
        totalAmount: data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        highRiskCount: data?.filter(e => e.risk_level === 'high').length || 0,
      };
    } catch (err) {
      console.error('Error fetching BNPL summary:', err);
      return { count: 0, totalAmount: 0, highRiskCount: 0 };
    }
  }, [user]);

  return {
    analyzeRisk,
    classifyPurchase,
    getRiskHistory,
    getBNPLSummary,
    lastResponse,
    loading,
  };
}

export default useBNPLRisk;
