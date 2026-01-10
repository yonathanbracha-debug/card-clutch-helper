import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Local storage keys for guest calibration data
const GUEST_EXPERIENCE_KEY = 'cardclutch_guest_experience';
const GUEST_CALIBRATION_KEY = 'cardclutch_guest_calibration';
const GUEST_MYTH_FLAGS_KEY = 'cardclutch_guest_myth_flags';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  deviceUserId: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate or retrieve device user ID for anonymous users
function getDeviceUserId(): string {
  const stored = localStorage.getItem('cardclutch-device-id');
  if (stored) return stored;
  
  const newId = crypto.randomUUID();
  localStorage.setItem('cardclutch-device-id', newId);
  return newId;
}

// Migrate guest calibration data to database on signup/login
async function migrateGuestCalibrationData(userId: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const guestCalibration = localStorage.getItem(GUEST_CALIBRATION_KEY);
    const guestExperience = localStorage.getItem(GUEST_EXPERIENCE_KEY);
    const guestMythFlags = localStorage.getItem(GUEST_MYTH_FLAGS_KEY);
    
    // Only migrate if guest has completed calibration
    if (guestCalibration !== 'true') return;
    
    // Check if user already has calibration data
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('calibration_completed')
      .eq('user_id', userId)
      .maybeSingle();
    
    // Don't overwrite existing calibration
    if (existing?.calibration_completed) {
      // Clear guest data since user already has calibration
      localStorage.removeItem(GUEST_CALIBRATION_KEY);
      localStorage.removeItem(GUEST_EXPERIENCE_KEY);
      localStorage.removeItem(GUEST_MYTH_FLAGS_KEY);
      return;
    }
    
    // Parse guest data
    const experienceLevel = guestExperience && ['beginner', 'intermediate', 'advanced'].includes(guestExperience)
      ? guestExperience
      : 'beginner';
    
    let mythFlagsObj: Record<string, boolean> = {};
    if (guestMythFlags) {
      try {
        const parsed = JSON.parse(guestMythFlags);
        if (Array.isArray(parsed)) {
          parsed.forEach(flag => { mythFlagsObj[flag] = true; });
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Migrate to database
    const { error } = await supabase
      .from('user_preferences')
      .update({
        calibration_completed: true,
        experience_level: experienceLevel,
        myth_flags: mythFlagsObj,
      })
      .eq('user_id', userId);
    
    if (!error) {
      // Clear guest data after successful migration
      localStorage.removeItem(GUEST_CALIBRATION_KEY);
      localStorage.removeItem(GUEST_EXPERIENCE_KEY);
      localStorage.removeItem(GUEST_MYTH_FLAGS_KEY);
      console.log('Guest calibration data migrated successfully');
    }
  } catch (err) {
    console.error('Failed to migrate guest calibration data:', err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceUserId] = useState(getDeviceUserId);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Migrate guest data on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to avoid blocking the auth flow
          setTimeout(() => {
            migrateGuestCalibrationData(session.user.id);
          }, 100);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, deviceUserId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}