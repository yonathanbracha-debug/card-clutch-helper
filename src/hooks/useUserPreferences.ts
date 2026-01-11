import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type UserIntent = 'optimize_score' | 'maximize_rewards' | 'both';
export type UserMode = 'rewards' | 'conservative';

export interface CalibrationResponses {
  [questionId: string]: boolean;
}

export interface MythFlags {
  [mythId: string]: boolean;
}

export interface UserPreferences {
  mode: UserMode;
  onboarding_completed: boolean;
  experience_level: ExperienceLevel;
  calibration_completed: boolean;
  calibration_responses: CalibrationResponses;
  myth_flags: MythFlags;
  intent: UserIntent;
  carry_balance: boolean;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'mode' | 'onboarding_completed'> = {
  experience_level: 'beginner',
  calibration_completed: false,
  calibration_responses: {},
  myth_flags: {},
  intent: 'both',
  carry_balance: false,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('mode, onboarding_completed, experience_level, calibration_completed, calibration_responses, myth_flags, intent, carry_balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        // If no preferences exist, create them
        if (error.code === 'PGRST116') {
          const { data: insertData, error: insertError } = await supabase
            .from('user_preferences')
            .insert({ user_id: user.id })
            .select('mode, onboarding_completed, experience_level, calibration_completed, calibration_responses, myth_flags, intent, carry_balance')
            .single();
          
          if (!insertError && insertData) {
            setPreferences({
              mode: insertData.mode as UserMode,
              onboarding_completed: insertData.onboarding_completed,
              experience_level: (insertData.experience_level as ExperienceLevel) || 'beginner',
              calibration_completed: insertData.calibration_completed || false,
              calibration_responses: (insertData.calibration_responses as CalibrationResponses) || {},
              myth_flags: (insertData.myth_flags as MythFlags) || {},
              intent: (insertData.intent as UserIntent) || 'both',
              carry_balance: insertData.carry_balance || false,
            });
          }
        }
      } else if (data) {
        setPreferences({
          mode: data.mode as UserMode,
          onboarding_completed: data.onboarding_completed,
          experience_level: (data.experience_level as ExperienceLevel) || 'beginner',
          calibration_completed: data.calibration_completed || false,
          calibration_responses: (data.calibration_responses as CalibrationResponses) || {},
          myth_flags: (data.myth_flags as MythFlags) || {},
          intent: (data.intent as UserIntent) || 'both',
          carry_balance: data.carry_balance || false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      throw err;
    }
  };

  return { preferences, loading, updatePreferences, refetch: fetchPreferences };
}
