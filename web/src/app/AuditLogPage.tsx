import React, { useState } from 'react';
import { Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import { AuditLogWidget } from '../../libs/ui/dashboard/components/AuditLogWidget';
import { useAuditLogs } from '../../libs/data-access/auditLogApi';
import { FiFilter, FiRefreshCw, FiDownload, FiBarChart2 } from 'react-icons/fi';

export default function AuditLogPage() {
  // Advanced filter/search state
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState<'table' | 'timeline'>('table');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useAuditLogs({
    event_type: eventType || undefined,
    user_id: userId || undefined,
    from: from || undefined,
    to: to || undefined,
    search: search || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  // CSV export logic (reuse from AuditLogWidget)
  function handleExportCSV() {
    if (!logs || logs.length === 0) return;
    const columns = [
      'timestamp',
      'event_type',
      'user_id',
      'resource',
      'resource_id',
      'outcome',
      'ip_address',
    ];
    const csv = [columns.join(',')]
      .concat(
        logs.map((log: any) =>
          columns.map((col) => JSON.stringify(log[col] ?? '')).join(',')
        )
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 p-4 md:p-8">
      <Box className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 md:p-10">
        <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={2}>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="zinc.800"
            _dark={{ color: 'zinc.100' }}
          >
            Audit Log
          </Text>
          <Flex gap={2} align="center">
            <Button
              onClick={handleExportCSV}
              size="sm"
              variant="outline"
              aria-label="Export CSV"
            >
              <FiDownload className="mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => refetch()}
              size="sm"
              variant="ghost"
              aria-label="Refresh logs"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="Analytics (coming soon)"
              disabled
            >
              <FiBarChart2 className="mr-2" />
              Analytics
            </Button>
          </Flex>
        </Flex>
        <Flex gap={2} mb={4} wrap="wrap" align="center">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
            maxW="180px"
            aria-label="Search audit logs"
          />
          <Input
            placeholder="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            size="sm"
            maxW="140px"
            aria-label="Filter by event type"
          />
          <Input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            size="sm"
            maxW="140px"
            aria-label="Filter by user ID"
          />
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            size="sm"
            maxW="140px"
            aria-label="From date"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            size="sm"
            maxW="140px"
            aria-label="To date"
          />
          <Button
            size="sm"
            onClick={() => setPage(1)}
            aria-label="Apply filters"
          >
            <FiFilter className="mr-2" />
            Filter
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setView((v) => (v === 'table' ? 'timeline' : 'table'))
            }
            aria-label="Toggle timeline view"
          >
            {view === 'table' ? 'Timeline View' : 'Table View'}
          </Button>
        </Flex>
        <Box mt={6}>
          <AuditLogWidget
            data={{
              columns: [
                'timestamp',
                'event_type',
                'user_id',
                'resource',
                'resource_id',
                'outcome',
                'ip_address',
              ],
              filters: { event_type: eventType, user_id: userId, from, to },
              view,
              pageSize,
            }}
            className="mb-8"
          />
        </Box>
      </Box>
    </main>
  );
}
