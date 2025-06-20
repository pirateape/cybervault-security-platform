import type { TriggerScanParams, ApiResponse } from '../types';

export async function triggerScan({
  orgId,
  userId,
  scanType,
  target,
  metadata,
}: TriggerScanParams): Promise<ApiResponse> {
  console.log('[API] triggerScan called', {
    orgId,
    userId,
    scanType,
    target,
    metadata,
  });
  const params = new URLSearchParams({
    org_id: orgId,
    user_id: userId,
    scan_type: scanType,
    status: 'pending',
  });
  if (target) params.append('target', target);
  if (metadata) params.append('metadata', JSON.stringify(metadata));
  try {
    const res = await fetch(`/scans/?${params.toString()}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API] triggerScan failed', errorText);
      throw new Error('Failed to trigger scan');
    }
    const json = await res.json();
    console.log('[API] triggerScan response', json);
    return json;
  } catch (err) {
    console.error('[API] triggerScan exception', err);
    throw err;
  }
}
