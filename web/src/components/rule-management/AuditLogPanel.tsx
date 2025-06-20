import React, { useState, useMemo } from 'react';

/**
 * AuditLogPanel displays a filterable, accessible audit log for a rule.
 * @param auditLog Array of audit log entries
 * @param loading Loading state
 * @param error Error message
 */
export interface AuditLogEntry {
  id: number;
  user_id: string;
  event_type: string;
  resource: string;
  outcome: string;
  metadata: any;
  created_at: string;
}

interface AuditLogPanelProps {
  auditLog: AuditLogEntry[];
  loading?: boolean;
  error?: string | null;
}

const eventTypeIcon: Record<string, string> = {
  create: '🟢',
  update: '🟡',
  delete: '🔴',
  restore: '♻️',
};

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({
  auditLog,
  loading,
  error,
}) => {
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [userId, setUserId] = useState('');

  const filtered = useMemo(
    () =>
      auditLog.filter(
        (log) =>
          (!search ||
            JSON.stringify(log).toLowerCase().includes(search.toLowerCase())) &&
          (!eventType || log.event_type === eventType) &&
          (!userId || log.user_id === userId)
      ),
    [auditLog, search, eventType, userId]
  );

  return (
    <section className="mt-6" aria-label="Audit Log" tabIndex={0}>
      <h3 className="font-bold text-md mb-2">Audit Log</h3>
      <div className="flex gap-2 mb-2">
        <input
          className="input input-sm input-bordered"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search audit log"
        />
        <input
          className="input input-sm input-bordered"
          placeholder="Event Type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          aria-label="Filter by event type"
        />
        <input
          className="input input-sm input-bordered"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          aria-label="Filter by user ID"
        />
      </div>
      {loading && <div className="text-info">Loading...</div>}
      {error && <div className="text-error">{error}</div>}
      <ul className="space-y-1 text-xs" role="list" aria-live="polite">
        {filtered.length === 0 && !loading && (
          <li className="text-base-content/60">No audit log entries.</li>
        )}
        {filtered.map((log, i) => (
          <li
            key={log.id}
            className="border-b border-base-300 pb-1 mb-1 flex items-center gap-2"
          >
            <span className="font-mono text-base-content/70 min-w-[120px]">
              {new Date(log.created_at).toLocaleString()}
            </span>
            <span className="text-lg" title={log.event_type}>
              {eventTypeIcon[log.event_type] || '📝'}
            </span>
            <span className="ml-1 font-semibold">{log.event_type}</span>
            <span className="ml-2 flex items-center gap-1">
              <span
                className="avatar placeholder w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs"
                title={log.user_id}
                aria-label={`User ${log.user_id}`}
              >
                {log.user_id.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-base-content/60">
                {log.user_id.slice(0, 8)}
              </span>
            </span>
            <span
              className="ml-2 text-base-content/60 truncate max-w-[120px]"
              title={log.resource}
            >
              {log.resource}
            </span>
            <span
              className={`ml-2 badge badge-xs ${
                log.outcome === 'success' ? 'badge-success' : 'badge-error'
              }`}
            >
              {log.outcome}
            </span>
            {log.metadata && (
              <span
                className="ml-2 text-base-content/50 truncate max-w-[120px]"
                title={JSON.stringify(log.metadata)}
              >
                {JSON.stringify(log.metadata)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AuditLogPanel;
