import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../../primitives';
import { useAuditLogs } from '../../../data-access/auditLogApi';
import type { AuditLogWidgetData } from '../types/widget';
import { FiFilter, FiRefreshCw } from 'react-icons/fi';
import { saveAs } from 'file-saver';
import { List as VirtualList, AutoSizer } from 'react-virtualized';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useHasPermission } from '../../../hooks/authProvider';

interface EventTypeRegistry {
  [eventType: string]: {
    icon?: React.ReactNode;
    color?: string;
    label?: string;
    renderCell?: (log: any) => React.ReactNode;
    renderTimeline?: (log: any) => React.ReactNode;
  };
}

interface AuditLogWidgetProps {
  data?: AuditLogWidgetData;
  className?: string;
  eventTypeRegistry?: EventTypeRegistry;
  filters?: React.ReactNode[];
  actions?: React.ReactNode[];
  viewMode?: 'timeline' | 'table';
  onViewModeChange?: (mode: 'timeline' | 'table') => void;
}

export const AuditLogWidget: React.FC<AuditLogWidgetProps> = ({
  data,
  className,
  eventTypeRegistry = {},
  filters,
  actions,
  viewMode,
  onViewModeChange,
}) => {
  const canViewAuditLogs = useHasPermission('view_audit_logs');
  if (!canViewAuditLogs) {
    return (
      <Card aria-label="Audit Log Widget - Access Denied" tabIndex={0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#fef2f2', border: '1px solid #fecaca' }}>
        <span style={{ color: '#dc2626', fontWeight: 600 }}>Access Denied: You do not have permission to view audit logs.</span>
      </Card>
    );
  }

  // Filters and pagination state
  const [eventType, setEventType] = useState(data?.filters?.event_type || '');
  const [userId, setUserId] = useState(data?.filters?.user_id || '');
  const [resource, setResource] = useState(data?.filters?.resource || '');
  const [outcome, setOutcome] = useState(String((data?.filters && 'outcome' in data.filters ? data.filters.outcome : '') || ''));
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = data?.pageSize || 20;
  const [detailsLog, setDetailsLog] = useState<any>(null);
  const [internalViewMode, setInternalViewMode] = useState<'timeline' | 'table'>(data?.view === 'timeline' ? 'timeline' : 'table');
  const showTimeline = viewMode ? viewMode === 'timeline' : internalViewMode === 'timeline';

  const handleViewModeChange = (mode: 'timeline' | 'table') => {
    if (onViewModeChange) onViewModeChange(mode);
    setInternalViewMode(mode);
  };

  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useAuditLogs({
    event_type: eventType || undefined,
    user_id: userId || undefined,
    resource: resource || undefined,
    outcome: outcome || undefined,
    from: from ? from.toISOString().split('T')[0] : undefined,
    to: to ? to.toISOString().split('T')[0] : undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  // Columns to display
  const columns = data?.columns || [
    'timestamp',
    'event_type',
    'user_id',
    'resource',
    'resource_id',
    'outcome',
    'ip_address',
  ];

  // Table header labels
  const columnLabels: Record<string, string> = {
    timestamp: 'Timestamp',
    event_type: 'Event Type',
    user_id: 'User',
    resource: 'Resource',
    resource_id: 'Resource ID',
    outcome: 'Outcome',
    ip_address: 'IP Address',
    user_agent: 'User Agent',
    details: 'Details',
    hash: 'Hash',
    prev_hash: 'Prev Hash',
  };

  // CSV export logic
  function handleExportCSV() {
    if (!logs || logs.length === 0) return;
    const csv = [columns.join(',')]
      .concat(
        logs.map((log) =>
          columns
            .map((col) => JSON.stringify((log as any)[col] ?? ''))
            .join(',')
        )
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'audit-log.csv');
  }

  // JSON export logic
  function handleExportJSON() {
    if (!logs || logs.length === 0) return;
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, 'audit-log.json');
  }

  // Virtualized row renderer
  function rowRenderer({ index, key, style }: any) {
    if (!logs || !logs[index]) return null;
    const log = logs[index];
    return (
      <tr
        key={key}
        style={style}
        tabIndex={0}
        aria-label={`Audit log entry ${log.id}`}
        className="hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {columns.map((col) => (
          <td
            key={col}
            className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800"
          >
            {col === 'event_type' && eventTypeRegistry[log.event_type]?.icon ? (
              <span style={{ color: eventTypeRegistry[log.event_type]?.color }}>
                {eventTypeRegistry[log.event_type].icon} {eventTypeRegistry[log.event_type].label || log.event_type}
              </span>
            ) : eventTypeRegistry[log.event_type]?.renderCell ? (
              eventTypeRegistry[log.event_type].renderCell!(log)
            ) : typeof (log as any)[col] === 'object' ? (
              JSON.stringify((log as any)[col])
            ) : (
              (log as any)[col] ?? ''
            )}
          </td>
        ))}
        <td>
          <Button
            size="xs"
            onClick={() => setDetailsLog(log)}
            aria-label="Show details"
          >
            Details
          </Button>
        </td>
      </tr>
    );
  }

  // Timeline rendering (vertical timeline, registry-based)
  function TimelineView() {
    return (
      <div className="flex flex-col gap-4 p-2" aria-label="Audit log timeline">
        {logs && logs.length > 0 ? (
          logs.map((log: any) => (
            <div key={log.id} className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-2"
                style={{ background: eventTypeRegistry[log.event_type]?.color || 'var(--chakra-colors-brand-500)' }}
                aria-hidden
              >
                {eventTypeRegistry[log.event_type]?.icon}
              </div>
              <div className="flex-1" style={{ background: 'var(--chakra-colors-bg-DEFAULT)', border: '1px solid var(--chakra-colors-border-DEFAULT)', borderRadius: '0.5rem', padding: '0.75rem', boxShadow: 'var(--chakra-shadows-lg)' }}>
                <div className="font-semibold text-sm mb-1">
                  {eventTypeRegistry[log.event_type]?.label || log.event_type}{' '}
                  <span style={{ color: 'var(--chakra-colors-fg-muted)' }} className="text-xs">
                    ({log.timestamp})
                  </span>
                </div>
                <div style={{ color: 'var(--chakra-colors-fg-muted)' }} className="text-xs">
                  User: {log.user_id} | Resource: {log.resource}
                </div>
                {eventTypeRegistry[log.event_type]?.renderTimeline ? (
                  eventTypeRegistry[log.event_type].renderTimeline!(log)
                ) : null}
                <button
                  style={{ color: 'var(--chakra-colors-brand-solid)', textDecoration: 'underline' }}
                  className="text-xs mt-1"
                  onClick={() => setDetailsLog(log)}
                  aria-label="Show details"
                >
                  Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--chakra-colors-fg-muted)' }} className="text-center">No audit logs found</div>
        )}
      </div>
    );
  }

  // Unique values for dropdowns (resource, outcome)
  const resourceOptions = Array.from(
    new Set((logs || []).map((l: any) => l.resource).filter(Boolean))
  );
  const outcomeOptions = Array.from(
    new Set((logs || []).map((l: any) => l.outcome).filter(Boolean))
  );

  return (
    <Card aria-label="Audit Log Widget" tabIndex={0} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#18181b' }}>Audit Log</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {actions && actions.length > 0 ? (
            actions.map((action, i) => <span key={i}>{action}</span>)
          ) : (
            <>
              <span title="Export CSV">
                <Button
                  onClick={handleExportCSV}
                  size="sm"
                  variant="outline"
                  aria-label="Export CSV"
                >
                  Export CSV
                </Button>
              </span>
              <span title="Export JSON">
                <Button
                  onClick={handleExportJSON}
                  size="sm"
                  variant="outline"
                  aria-label="Export JSON"
                >
                  Export JSON
                </Button>
              </span>
              <span title="Refresh logs">
                <Button
                  onClick={() => refetch()}
                  size="sm"
                  variant="ghost"
                  aria-label="Refresh logs"
                >
                  <FiRefreshCw />
                </Button>
              </span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {filters && filters.length > 0 ? (
          filters.map((filter, i) => <React.Fragment key={i}>{filter}</React.Fragment>)
        ) : (
          <>
            <Input
              placeholder="Event Type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              aria-label="Filter by event type"
              style={{ maxWidth: 140 }}
            />
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              aria-label="Filter by user ID"
              style={{ maxWidth: 140 }}
            />
            <select
              className="border rounded px-2 py-1 text-sm max-w-[140px]"
              value={resource ? String(resource) : ''}
              onChange={(e) => setResource(e.target.value)}
              aria-label="Filter by resource"
            >
              <option value="">All</option>
              {resourceOptions.map((r) => (
                <option key={String(r)} value={String(r)}>
                  {String(r)}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-2 py-1 text-sm max-w-[140px]"
              value={outcome ? String(outcome) : ''}
              onChange={(e) => setOutcome(e.target.value)}
              aria-label="Filter by outcome"
            >
              <option value="">All</option>
              {outcomeOptions.map((o) => (
                <option key={String(o)} value={String(o)}>
                  {String(o)}
                </option>
              ))}
            </select>
            <DatePicker
              selected={from}
              onChange={(date: Date | null) => setFrom(date)}
              selectsStart
              startDate={from}
              endDate={to}
              placeholderText="From date"
              className="border rounded px-2 py-1 text-sm max-w-[120px]"
            />
            <DatePicker
              selected={to}
              onChange={(date: Date | null) => setTo(date)}
              selectsEnd
              startDate={from}
              endDate={to}
              minDate={from || undefined}
              placeholderText="To date"
              className="border rounded px-2 py-1 text-sm max-w-[120px]"
            />
            <Button size="sm" onClick={() => setPage(1)} aria-label="Apply filters">
              <FiFilter style={{ marginRight: 4 }} /> Filter
            </Button>
            <Button
              size="sm"
              onClick={() => handleViewModeChange(showTimeline ? 'table' : 'timeline')}
              aria-label="Toggle timeline view"
            >
              {showTimeline ? 'Table View' : 'Timeline View'}
            </Button>
          </>
        )}
      </div>
      {/* ARIA live region for loading */}
      {isLoading && (
        <div role="status" aria-live="polite" style={{ minHeight: 80, width: '100%', marginTop: 8, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading audit logs...
        </div>
      )}
      {/* ARIA live region for error */}
      {error && (
        <Card variant="outline" colorScheme="danger" role="alert" aria-live="assertive" style={{ marginTop: 8, padding: 12 }}>
          Error loading audit logs
        </Card>
      )}
      {/* ARIA live region for empty state */}
      {!isLoading && !error && logs && logs.length === 0 && (
        <div role="status" aria-live="polite" style={{ minHeight: 80, width: '100%', marginTop: 8, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No audit logs found
        </div>
      )}
      {showTimeline ? (
        <TimelineView />
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <AutoSizer disableHeight>
            {({ width }) => (
              <table
                className="min-w-full text-sm"
                aria-label="Audit log table"
                style={{ width }}
              >
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-3 py-2 text-left font-semibold"
                        style={{ color: 'var(--chakra-colors-fg-DEFAULT)', borderBottom: '1px solid var(--chakra-colors-border-DEFAULT)' }}
                      >
                        {columnLabels[col] || col}
                      </th>
                    ))}
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="text-center py-4"
                        style={{ color: 'var(--chakra-colors-brand-solid)' }}
                      >
                        <span className="inline-block">
                          <svg
                            className="animate-spin h-5 w-5 text-blue-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>{' '}
                          Loading audit logs
                        </span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="text-center py-4"
                        style={{ color: 'var(--chakra-colors-red-500)' }}
                      >
                        Error loading audit logs
                      </td>
                    </tr>
                  ) : logs && logs.length > 0 ? (
                    <VirtualList
                      width={width}
                      height={400}
                      rowCount={logs.length}
                      rowHeight={48}
                      rowRenderer={rowRenderer}
                      overscanRowCount={10}
                    />
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="text-center py-4"
                        style={{ color: 'var(--chakra-colors-brand-solid)' }}
                      >
                        No audit logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </AutoSizer>
        </div>
      )}
      {/* Details Modal */}
      <Modal isOpen={!!detailsLog} onClose={() => setDetailsLog(null)} title="Audit Log Details">
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Audit Log Details</h3>
          <pre style={{ background: '#f3f4f6', borderRadius: 8, padding: 8, fontSize: 12, overflowX: 'auto', marginBottom: 16 }}>
            {detailsLog ? JSON.stringify(detailsLog, null, 2) : ''}
          </pre>
          <Button onClick={() => setDetailsLog(null)} size="sm">
            Close
          </Button>
        </Card>
      </Modal>
      {/* Pagination controls */}
      <div className="flex mt-4 items-center justify-end gap-2">
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <span className="text-sm px-2" aria-live="polite">
          Page {page}
        </span>
        <Button
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={logs && logs.length < pageSize}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </Card>
  );
};
