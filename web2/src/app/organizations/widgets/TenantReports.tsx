'use client';

// widgets/TenantReports.tsx
// Modular, accessible, extensible tenant report widget
// Uses Shadcn UI, Radix, Tailwind, DaisyUI, and best practices

import React, { useState } from 'react';
import { useTenantReports, Report } from '@data-access/reportApi';
import { Button, Input, Card } from 'libs/ui/primitives';

interface TenantReportsProps {
  orgId: string;
}

export function TenantReports({ orgId }: TenantReportsProps) {
  const { data: reports = [], isLoading, isError, error } = useTenantReports(orgId);
  const [filter, setFilter] = useState('');
  const filteredReports = reports.filter((r: Report) => r.name.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Reports</h2>
        <Input
          type="text"
          placeholder="Filter reports..."
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
          aria-label="Filter reports"
          uiSize="sm"
          style={{ minWidth: 180 }}
        />
      </div>
      {isLoading && <div aria-busy="true" aria-live="polite" style={{ marginBottom: 12 }}>Loading reports...</div>}
      {isError && <div role="alert" aria-live="assertive" style={{ color: '#dc2626', marginBottom: 12 }}>{(error as any)?.message || 'Failed to load reports.'}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filteredReports.map((report: Report) => (
          <li key={report.id} style={{ marginBottom: 12 }}>
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>{report.name}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{report.description}</span>
              </div>
              <div>
                <a
                  href={report.exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Export ${report.name}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="primary"
                  >
                    Export
                  </Button>
                </a>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {/* TODO: Add advanced filters, pagination, RBAC, and export options */}
    </Card>
  );
} 