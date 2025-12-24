import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

type AuditEventType = 
  | 'ROLE_CHANGE'
  | 'CARD_ADDED'
  | 'CARD_REMOVED'
  | 'PREFERENCE_UPDATE'
  | 'ADMIN_CARD_EDIT'
  | 'ADMIN_CARD_CREATE'
  | 'ADMIN_CARD_DELETE'
  | 'ADMIN_MERCHANT_EDIT'
  | 'ADMIN_MERCHANT_CREATE'
  | 'ADMIN_MERCHANT_DELETE'
  | 'ADMIN_RULE_EDIT'
  | 'ADMIN_RULE_CREATE'
  | 'ADMIN_RULE_DELETE';

export function useAuditLog() {
  const { user } = useAuth();

  const logEvent = async (
    eventType: AuditEventType,
    payload: Record<string, unknown> = {}
  ) => {
    if (!user) return;

    try {
      await supabase.from('security_audit_log').insert([{
        actor_user_id: user.id,
        event_type: eventType,
        event_payload: payload as Json,
      }]);
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  };

  return { logEvent };
}
