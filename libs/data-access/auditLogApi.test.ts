// NOTE: If you see a module not found error for '@testing-library/react-hooks', run:
//   npm install --save-dev @testing-library/react-hooks
// or
//   yarn add --dev @testing-library/react-hooks

import {
  useAuditLogs,
  logAuditEvent,
  AuditLogEntry,
  AuditLogFilter,
} from './auditLogApi';
import { supabase } from './supabaseClient';
import { renderHook, act } from '@testing-library/react-hooks';

jest.mock('./supabaseClient');

const mockInsert = jest.fn();
const mockSelect = jest.fn();

(supabase.from as any) = jest.fn(() => ({
  insert: mockInsert,
  select: mockSelect,
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
}));

describe('auditLogApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a new audit log entry', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    const entry = {
      user_id: 'user-1',
      event_type: 'LOGIN',
      resource: 'auth',
      outcome: 'SUCCESS',
      metadata: { ip: '127.0.0.1' } as any,
    };
    await expect(logAuditEvent(entry)).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('audit.audit_log');
    expect(mockInsert).toHaveBeenCalledWith([entry]);
  });

  it('should throw on insert error', async () => {
    mockInsert.mockResolvedValueOnce({ error: new Error('Insert failed') });
    const entry = {
      user_id: 'user-1',
      event_type: 'LOGIN',
      resource: 'auth',
      outcome: 'FAIL',
      metadata: {} as any,
    };
    await expect(logAuditEvent(entry)).rejects.toThrow('Insert failed');
  });

  it('should query audit logs with filters', async () => {
    const logs: AuditLogEntry[] = [
      {
        id: '1',
        user_id: 'user-1',
        event_type: 'LOGIN',
        resource: 'auth',
        outcome: 'SUCCESS',
        metadata: { ip: '127.0.0.1' },
        created_at: '2024-06-01T00:00:00Z',
      },
    ];
    mockSelect.mockResolvedValueOnce({ data: logs, error: null });
    const filter: AuditLogFilter = { user_id: 'user-1', event_type: 'LOGIN' };
    const { result, waitFor } = renderHook(() => useAuditLogs(filter));
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(logs);
  });

  it('should handle query error', async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: new Error('Query failed'),
    });
    const { result, waitFor } = renderHook(() => useAuditLogs({}));
    await waitFor(() => result.current.isError);
    expect(result.current.error).toBeDefined();
  });
});
