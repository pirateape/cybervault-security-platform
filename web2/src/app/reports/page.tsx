"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import * as React from "react";
import { ExportWidget } from "@ui/dashboard/components/ExportWidget";
import { CustomReportWidget } from "@ui/dashboard/components/CustomReportWidget";
import { NivoChartWidget } from "@ui/dashboard/components/NivoChartWidget";
import { ScorecardWidget } from "@ui/dashboard/components/ScorecardWidget";
import { WidgetContainer } from "@ui/dashboard/components/WidgetContainer";
import { WidgetLibraryPanel } from "@ui/dashboard/components/WidgetLibraryPanel";
import { WidgetFactory } from "@web2/components/dashboard/WidgetFactory";
import type { DashboardWidget, WidgetLayout } from "@ui/dashboard/types/widget";
import { FiBarChart2 } from "react-icons/fi";

// TODO: Replace with real Supabase data fetching
const fakeReportData = [
  { project: "Alpha", date: "2024-06-01", score: 92, status: "Good" },
  { project: "Beta", date: "2024-06-02", score: 88, status: "Fair" },
];

// Simple layout generator for demo
const defaultLayout: WidgetLayout = { x: 0, y: 0, w: 3, h: 2 };

export default function ReportsPage() {
  // State for export status, filters, etc.
  const [exportStatus, setExportStatus] = React.useState<"idle" | "exporting" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = React.useState<string | undefined>();
  const [exportError, setExportError] = React.useState<string | undefined>();
  const [filters, setFilters] = React.useState<Record<string, any>>({});
  const [reportData, setReportData] = React.useState<any[]>(fakeReportData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = React.useState(false);
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([
    {
      id: "custom-report-1",
      type: "custom_report",
      title: "Custom Report",
      layout: { ...defaultLayout, x: 0, y: 0 },
      data: { reportData, isLoading, error: exportError, onGenerate: handleGenerate },
    },
    {
      id: "export-1",
      type: "export",
      title: "Export Data",
      layout: { ...defaultLayout, x: 3, y: 0 },
      data: { onExport: handleExport, status: exportStatus, downloadUrl, error: exportError },
    },
    {
      id: "nivo-chart-1",
      type: "nivo_chart",
      title: "Trends Chart",
      layout: { ...defaultLayout, x: 0, y: 2 },
      data: { type: "bar", data: reportData },
    },
    {
      id: "scorecard-1",
      type: "scorecard",
      title: "Scorecard",
      layout: { ...defaultLayout, x: 3, y: 2 },
      data: { 
        score: 92, 
        label: "Compliance Score", 
        riskLevel: "low",
        icon: "📊"
      },
    },
  ]);

  // Export handler
  function handleExport(format: "pdf" | "csv" | "excel") {
    setExportStatus("exporting");
    setTimeout(() => {
      // TODO: Replace with real export logic (call /api/report-export)
      setExportStatus("done");
      setDownloadUrl("/static/fake-report." + format);
    }, 1200);
  }

  // Filter handler
  function handleGenerate(filters: Record<string, any>) {
    setIsLoading(true);
    setTimeout(() => {
      // TODO: Replace with real Supabase query
      setReportData(fakeReportData.filter((row) =>
        (!filters.project || row.project === filters.project) &&
        (!filters.date || row.date === filters.date)
      ));
      setIsLoading(false);
    }, 800);
  }

  // Widget add handler
  function handleAddWidget(type: string) {
    // Add a new widget with default fields
    const id = `${type}-${widgets.length + 1}`;
    const title = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setWidgets((prev) => [
      ...prev,
      {
        id,
        type: type as DashboardWidget["type"],
        title,
        layout: { ...defaultLayout, x: (prev.length % 3) * 3, y: Math.floor(prev.length / 3) * 2 },
        data: {}, // TODO: Add sensible defaults per widget type
      },
    ]);
    setShowWidgetLibrary(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 text-center flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" /> Reports & Export Dashboard
          </h1>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setShowWidgetLibrary(true)}
            aria-label="Add Widget"
          >
            + Add Widget
          </button>
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {widgets.map((widget) => (
            <WidgetContainer key={widget.id} widget={widget}>
              <WidgetFactory widget={widget} />
            </WidgetContainer>
          ))}
        </section>
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 mb-8">
          <CustomReportWidget
            onGenerate={handleGenerate}
            reportData={reportData}
            isLoading={isLoading}
            error={exportError}
          />
          <ExportWidget
            onExport={handleExport}
            status={exportStatus}
            downloadUrl={downloadUrl}
            error={exportError}
          />
        </section>
        {/* TODO: Add NivoChartWidget, ScorecardWidget, and more advanced widgets here */}
      </div>
      <WidgetLibraryPanel
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        onAddWidget={handleAddWidget}
      />
      {/* TODO: Add E2E and visual regression test hooks */}
      {/* TODO: Integrate with real Supabase data and export APIs */}
      {/* TODO: Add accessibility, ARIA, and keyboard navigation enhancements */}
      {/* TODO: Add user feedback, notifications, and error boundaries */}
    </main>
  );
} 