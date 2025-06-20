// ReportingDashboard: Modern, data-driven dashboard using useDashboardData and modular widgets
// Usage: <ReportingDashboard orgId={orgId} scanId={scanId} />
import React, { useState } from 'react';
import { DashboardLayout } from './dashboard/components/DashboardLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import type { DashboardWidget } from './dashboard/types/widget';
import { WidgetContainer } from './dashboard/components/WidgetContainer';
import { WidgetFactory } from '@web2/components/dashboard/WidgetFactory';

interface ReportingDashboardProps {
  orgId?: string;
  scanId?: string;
  userId?: string;
}

export function ReportingDashboard({ orgId, scanId, userId }: ReportingDashboardProps) {
  const {
    complianceReports,
    scanResults,
    heatMapData,
    isLoading,
    isError,
    error,
  } = useDashboardData(undefined, orgId, scanId);

  // ExportWidget state
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'exporting' | 'done' | 'error'
  >('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>();
  const [exportError, setExportError] = useState<string | undefined>();

  // CustomReportWidget state
  const [customReportData, setCustomReportData] = useState<any[]>([]);
  const [customReportLoading, setCustomReportLoading] = useState(false);
  const [customReportError, setCustomReportError] = useState<
    string | undefined
  >();

  // Export handler
  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    setExportStatus('exporting');
    setExportError(undefined);
    setDownloadUrl(undefined);
    try {
      const res = await fetch(
        `/api/report-export?type=compliance&format=${format}`
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setExportStatus('done');
    } catch (e: any) {
      setExportError(e.message || 'Export failed');
      setExportStatus('error');
    }
  };

  // Custom report handler
  const handleGenerateReport = async (filters: any) => {
    setCustomReportLoading(true);
    setCustomReportError(undefined);
    try {
      const res = await fetch('/api/custom-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setCustomReportData(data);
    } catch (e: any) {
      setCustomReportError(e.message || 'Failed to generate report');
      setCustomReportData([]);
    } finally {
      setCustomReportLoading(false);
    }
  };

  // Example: Compute KPIs from complianceReports and scanResults
  const complianceData = complianceReports.data || [];
  const scanData = scanResults.data || [];

  const totalCompliance =
    complianceData.length > 0
      ? complianceData.reduce((acc, r) => acc + (r.score || 0), 0) /
        complianceData.length
      : 0;
  const openRisks = scanData.filter(
    (r) => r.severity === 'high' || r.severity === 'critical'
  ).length;
  const totalFindings = scanData.length;
  const passRate =
    complianceData.length > 0
      ? (complianceData.filter((r) => r.status === 'compliant').length /
          complianceData.length) *
        100
      : 0;

  // Widgets
  const widgets: DashboardWidget[] = [
    {
      id: 'scorecard-compliance',
      type: 'scorecard',
      title: 'Compliance Scorecard',
      layout: { x: 0, y: 0, w: 1, h: 1 },
      data: {
        score: Math.round(totalCompliance),
        label: 'Compliance',
        riskLevel:
          totalCompliance > 90
            ? 'low'
            : totalCompliance > 75
            ? 'medium'
            : 'high',
        icon: '✅',
      },
    },
    {
      id: 'kpi-compliance',
      type: 'kpi',
      title: 'Compliance Score',
      layout: { x: 1, y: 0, w: 1, h: 1 },
      data: {
        label: 'Compliance',
        value: Math.round(totalCompliance),
        trend: 'up',
        icon: '✅',
      },
    },
    {
      id: 'kpi-passrate',
      type: 'kpi',
      title: 'Pass Rate',
      layout: { x: 2, y: 0, w: 1, h: 1 },
      data: {
        label: 'Pass Rate',
        value: `${Math.round(passRate)}%`,
        trend: passRate > 90 ? 'up' : 'down',
        icon: '📈',
      },
    },
    {
      id: 'kpi-risks',
      type: 'kpi',
      title: 'Open Risks',
      layout: { x: 3, y: 0, w: 1, h: 1 },
      data: {
        label: 'Open Risks',
        value: openRisks,
        trend: openRisks > 0 ? 'down' : 'up',
        icon: '⚠️',
      },
    },
    {
      id: 'chart-risk',
      type: 'chart',
      title: 'Risk Distribution',
      layout: { x: 0, y: 1, w: 2, h: 2 },
      data: {
        type: 'bar',
        data: ['low', 'medium', 'high', 'critical'].map((level) => ({
          name: level.charAt(0).toUpperCase() + level.slice(1),
          value: scanData.filter((r) => r.severity === level).length,
        })),
        options: {
          xKey: 'name',
          yKey: 'value',
          colors: ['#38a169', '#ecc94b', '#dd6b20', '#e53e3e'],
        },
      },
    },
    {
      id: 'chart-compliance',
      type: 'chart',
      title: 'Compliance Trend',
      layout: { x: 2, y: 1, w: 2, h: 2 },
      data: {
        type: 'line',
        data: complianceData.map((r) => ({
          name: r.title,
          value: r.score,
        })),
        options: { xKey: 'name', yKey: 'value', colors: ['#3182ce'] },
      },
    },
    {
      id: 'export-widget',
      type: 'export',
      title: 'Export Data',
      layout: { x: 0, y: 3, w: 1, h: 1 },
      data: {
        onExport: handleExport,
        status: exportStatus,
        downloadUrl,
        error: exportError,
      },
    },
    {
      id: 'custom-report-widget',
      type: 'custom_report',
      title: 'Custom Report',
      layout: { x: 1, y: 3, w: 3, h: 2 },
      data: {
        onGenerate: handleGenerateReport,
        reportData: customReportData,
        isLoading: customReportLoading,
        error: customReportError,
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="animate-spin text-3xl">⏳</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex items-center justify-center h-96 text-red-600">
        {error?.message || 'Error loading dashboard data.'}
      </div>
    );
  }

  return (
    <DashboardLayout layout={widgets.map(w => ({ ...w.layout, i: w.id }))}>
      {widgets.map(widget => (
        <div key={widget.id}>
          <WidgetContainer widget={widget}>
            <WidgetFactory widget={widget} />
          </WidgetContainer>
        </div>
      ))}
    </DashboardLayout>
  );
}
