import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Credit profile types - matches database schema
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type CreditIntent = 'score' | 'rewards' | 'both';
export type BnplUsage = 'never' | 'sometimes' | 'often';
export type AgeBucket = '<18' | '18-20' | '21-24' | '25-34' | '35-44' | '45-54' | '55+';
export type IncomeBucket = '<25k' | '25-50k' | '50-100k' | '100-200k' | '200k+';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface CreditProfile {
  user_id: string;
  experience_level: ExperienceLevel;
  intent: CreditIntent;
  carry_balance: boolean;
  bnpl_usage: BnplUsage | null;
  age_bucket: AgeBucket | null;
  income_bucket: IncomeBucket | null;
  confidence_level: ConfidenceLevel | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Derived credit state - computed deterministically from profile
export type CreditStage = 'starter' | 'builder' | 'optimizer' | 'advanced_optimizer';
export type EducationMode = 'strict' | 'standard' | 'light';

export interface CreditState {
  stage: CreditStage;
  max_allowed_card_tier: number;
  education_mode: EducationMode;
  risk_ceiling: 'low' | 'medium' | 'high';
  suppression_flags: string[];
}

// Deterministic derivation function - NO ML, NO VIBES
export function deriveCreditState(profile: Partial<CreditProfile>): CreditState {
  const flags: string[] = [];
  
  // Start with defaults - conservative approach
  let stage: CreditStage = 'builder';
  let maxTier = 2;
  let educationMode: EducationMode = 'standard';
  let riskCeiling: 'low' | 'medium' | 'high' = 'medium';

  // Age restrictions - sets initial stage
  if (profile.age_bucket === '<18') {
    stage = 'starter';
    maxTier = 1;
    flags.push('age_restriction');
  } else if (profile.age_bucket === '18-20') {
    stage = 'starter';
    maxTier = 1;
    flags.push('limited_credit_history');
  }

  // Balance carrying is a critical risk flag - CANNOT progress past builder
  if (profile.carry_balance) {
    // Force to builder or starter (cannot be optimizer/advanced_optimizer)
    if (stage !== 'starter') {
      stage = 'builder';
    }
    maxTier = Math.min(maxTier, 2);
    flags.push('balance_carrier');
    flags.push('suppress_rewards_optimization');
    riskCeiling = 'low';
  }

  // BNPL usage indicates risk
  if (profile.bnpl_usage === 'often') {
    flags.push('high_bnpl_usage');
    flags.push('suppress_premium_cards');
    riskCeiling = 'low';
  } else if (profile.bnpl_usage === 'sometimes') {
    flags.push('moderate_bnpl_usage');
  }

  // Experience level affects education mode
  if (profile.experience_level === 'beginner') {
    educationMode = 'strict';
    // Beginners cannot be optimizer or above
    if (stage !== 'starter') {
      stage = 'builder';
    }
  } else if (profile.experience_level === 'advanced') {
    educationMode = 'light';
    // Allow progression only if no risk flags
    if (!profile.carry_balance && profile.bnpl_usage !== 'often' && stage !== 'starter') {
      stage = 'optimizer';
      maxTier = 4;
    }
  }

  // Income-based tier restrictions
  if (profile.income_bucket === '<25k' || profile.income_bucket === '25-50k') {
    maxTier = Math.min(maxTier, 2);
    flags.push('suppress_high_fee_cards');
  }

  // Intent-based adjustments
  if (profile.intent === 'score') {
    flags.push('score_focused');
    // Score-focused users should not be in advanced_optimizer
    // (already constrained by logic above, but explicit for clarity)
  }

  return {
    stage,
    max_allowed_card_tier: maxTier,
    education_mode: educationMode,
    risk_ceiling: riskCeiling,
    suppression_flags: flags,
  };
}

// Default profile for new users
const DEFAULT_PROFILE: Omit<CreditProfile, 'user_id' | 'created_at' | 'updated_at'> = {
  experience_level: 'beginner',
  intent: 'both',
  carry_balance: false,
  bnpl_usage: null,
  age_bucket: null,
  income_bucket: null,
  confidence_level: null,
  onboarding_completed: false,
};

export function useCreditProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreditProfile | null>(null);
  const [creditState, setCreditState] = useState<CreditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setCreditState(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Use type assertion for the new table not yet in generated types
      const { data, error: fetchError } = await supabase
        .from('user_credit_profile' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching credit profile:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data) {
        const typedData = data as unknown as CreditProfile;
        setProfile(typedData);
        setCreditState(deriveCreditState(typedData));
      } else {
        // No profile exists yet
        setProfile(null);
        setCreditState(null);
      }
    } catch (err) {
      console.error('Failed to fetch credit profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const createProfile = async (
    profileData: Partial<Omit<CreditProfile, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<CreditProfile | null> => {
    if (!user) return null;

    try {
      setError(null);
      
      const insertData = {
        user_id: user.id,
        ...DEFAULT_PROFILE,
        ...profileData,
      };

      const { data, error: insertError } = await supabase
        .from('user_credit_profile' as any)
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating credit profile:', insertError);
        setError(insertError.message);
        return null;
      }

      const typedData = data as unknown as CreditProfile;
      setProfile(typedData);
      setCreditState(deriveCreditState(typedData));
      return typedData;
    } catch (err) {
      console.error('Failed to create credit profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const updateProfile = async (
    updates: Partial<Omit<CreditProfile, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('user_credit_profile' as any)
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating credit profile:', updateError);
        setError(updateError.message);
        return false;
      }

      // Optimistically update local state
      setProfile(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        setCreditState(deriveCreditState(updated));
        return updated;
      });
      
      return true;
    } catch (err) {
      console.error('Failed to update credit profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const completeOnboarding = async (
    profileData: Partial<Omit<CreditProfile, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    const finalData = {
      ...profileData,
      onboarding_completed: true,
    };

    // Create or update based on existence
    if (profile) {
      return updateProfile(finalData);
    } else {
      const result = await createProfile(finalData);
      return result !== null;
    }
  };

  // Check if user has completed credit onboarding
  const isOnboardingComplete = profile?.onboarding_completed ?? false;

  // Check if user should be blocked from features
  const requiresOnboarding = !loading && user && !isOnboardingComplete;

  return {
    profile,
    creditState,
    loading,
    error,
    isOnboardingComplete,
    requiresOnboarding,
    createProfile,
    updateProfile,
    completeOnboarding,
    refetch: fetchProfile,
  };
}
