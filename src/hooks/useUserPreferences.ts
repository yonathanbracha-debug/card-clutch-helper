import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPreferences {
  mode: 'rewards' | 'conservative';
  onboarding_completed: boolean;
}

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
        .select('mode, onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        // If no preferences exist, they should have been created by trigger
        // Create them manually as fallback
        if (error.code === 'PGRST116') {
          const { data: insertData, error: insertError } = await supabase
            .from('user_preferences')
            .insert({ user_id: user.id })
            .select('mode, onboarding_completed')
            .single();
          
          if (!insertError && insertData) {
            setPreferences({
              mode: insertData.mode as 'rewards' | 'conservative',
              onboarding_completed: insertData.onboarding_completed
            });
          }
        }
      } else if (data) {
        setPreferences({
          mode: data.mode as 'rewards' | 'conservative',
          onboarding_completed: data.onboarding_completed
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
