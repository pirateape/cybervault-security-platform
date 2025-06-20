import { useCallback } from 'react';
import { logAuditEvent } from '../data-access/auditLogApi';
// Optionally import useAuth if available for user context
// import { useAuth } from './authProvider';

interface AuditEventParams {
  event_type: string;
  resource?: string;
  resource_id?: string;
  outcome?: string;
  details?: any;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Modular audit logger hook for logging user actions to the audit log.
 * Usage:
 *   const { logEvent } = useAuditLogger();
 *   await logEvent({ event_type: 'login', resource: 'user', resource_id: userId, outcome: 'success', details: { ... } });
 */
export function useAuditLogger() {
  // const { user } = useAuth(); // Uncomment if you have an auth context

  /**
   * Log an audit event.
   * @param {Object} params - Event parameters
   * @param {string} params.event_type - Type of event (e.g., 'login', 'scan_trigger')
   * @param {string} [params.resource] - Resource affected (e.g., 'user', 'scan')
   * @param {string} [params.resource_id] - ID of the resource
   * @param {string} [params.outcome] - Outcome (e.g., 'success', 'failure')
   * @param {any} [params.details] - Additional details (JSON)
   * @param {string} [params.user_id] - Override user ID (default: from auth)
   * @param {string} [params.ip_address] - IP address (optional)
   * @param {string} [params.user_agent] - User agent (optional)
   * @returns {Promise<void>}
   */
  const logEvent = useCallback(
    async ({
      event_type,
      resource,
      resource_id,
      outcome,
      details,
      user_id,
      ip_address,
      user_agent,
    }: AuditEventParams) => {
      // const uid = user?.id || user_id || 'anonymous';
      const uid = user_id || 'anonymous'; // Replace with real user context if available
      await logAuditEvent({
        event_type,
        resource,
        resource_id,
        outcome,
        details,
        user_id: uid,
        ip_address,
        user_agent,
        created_at: new Date().toISOString(),
      });
    },
    []
  );

  return { logEvent };
}
