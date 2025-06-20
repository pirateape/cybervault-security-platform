// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import * as React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Flex,
  Spacer,
  Button,
  Select,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import {
  DashboardLayoutProvider,
  useDashboardLayout,
  UserRole,
} from '../../../libs/hooks/DashboardLayoutProvider';
import {
  useComplianceReports,
  useHeatMapData,
} from '../../../libs/data-access/dashboardApi';
import {
  ReportingDashboard,
  ComplianceScoreWidget,
  HeatMapVisualization,
  AIFeedbackPanel,
  CodeAnalysisEditor,
} from '../../../libs/ui/index';
import { WidgetFactory } from '../../../libs/ui/dashboard/components/WidgetFactory';
import type { DashboardWidget } from '../../../libs/ui/dashboard/types/widget';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetLibraryPanel } from '../../../libs/ui/dashboard/components/WidgetLibraryPanel';
import { useAuth } from '../../../libs/hooks/authProvider';
import { FiTrash2, FiSettings, FiZap } from 'react-icons/fi';
import { WidgetConfigModal } from '../../../libs/ui/dashboard/components/WidgetConfigModal';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Placeholder Home and Dashboard components
function Home() {
  return (
    <Container maxW="container.lg" py={10}>
      <Heading as="h1" size="xl" mb={6}>
        Welcome to the Review Dashboard
      </Heading>
      <Box fontSize="lg">
        This is the home page. Use the navigation to access the dashboard and
        feedback workflow.
      </Box>
    </Container>
  );
}

function DashboardShell({ userRole }: { userRole: UserRole }) {
  const { currentLayout } = useDashboardLayout();
  const {
    data: reports,
    isLoading: reportsLoading,
    error: reportsError,
  } = useComplianceReports();
  const {
    data: heatMapData,
    isLoading: heatLoading,
    error: heatError,
  } = useHeatMapData();

  // Demo: Use the first report for feedback/code analysis
  const firstReport = reports && reports.length > 0 ? reports[0] : undefined;
  const codeSample = firstReport
    ? `// ${firstReport.title}\n// Example code for analysis`
    : '// No report selected';

  return (
    <Box p={6}>
      <Heading as="h2" size="lg" mb={6}>
        Dashboard
      </Heading>
      <Flex gap={6} wrap="wrap">
        {/* Render widgets based on layout */}
        {currentLayout.components.map((comp) => {
          if (!comp.visible) return null;
          switch (comp.type) {
            case 'compliance_score':
              return (
                <ComplianceScoreWidget
                  key={comp.id}
                  isLoading={reportsLoading}
                  error={reportsError?.message}
                  score={
                    firstReport
                      ? {
                          overall: firstReport.score,
                          nist: 90,
                          iso27001: 85,
                          gdpr: 80,
                          trend: 'up',
                          trendValue: 2,
                          lastUpdated: firstReport.lastUpdated,
                        }
                      : undefined
                  }
                  size={comp.size}
                />
              );
            case 'heat_map':
              return (
                <HeatMapVisualization
                  key={comp.id}
                  isLoading={heatLoading}
                  error={heatError?.message}
                  data={heatMapData || []}
                />
              );
            case 'reporting':
              return (
                <ReportingDashboard
                  key={comp.id}
                  reports={reports || []}
                  isLoading={reportsLoading}
                  error={reportsError?.message}
                />
              );
            case 'scan_results':
              return (
                <AIFeedbackPanel
                  key={comp.id}
                  code={codeSample}
                  language="javascript"
                  isLoading={false}
                  error={null}
                />
              );
            case 'scan_trigger':
              return (
                <CodeAnalysisEditor
                  key={comp.id}
                  value={codeSample}
                  language="javascript"
                  readOnly
                />
              );
            default:
              return null;
          }
        })}
      </Flex>
    </Box>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);
  return (
    <Button
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle dark mode"
      mt={4}
    >
      {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    </Button>
  );
}

const widgets: DashboardWidget[] = [
  {
    id: 'kpi-1',
    type: 'kpi',
    title: 'Compliance Score',
    description: 'Current compliance score',
    layout: { x: 0, y: 0, w: 1, h: 1 },
    data: {
      label: 'Compliance Score',
      value: 92,
      unit: '%',
      trend: 'up',
      trendValue: 3,
    },
  },
  {
    id: 'chart-1',
    type: 'chart',
    title: 'Compliance Trend',
    description: 'Score over time',
    layout: { x: 1, y: 0, w: 2, h: 1 },
    data: {
      type: 'line',
      label: 'Compliance Trend',
      data: [
        { x: 'Jan', y: 80 },
        { x: 'Feb', y: 85 },
        { x: 'Mar', y: 88 },
        { x: 'Apr', y: 90 },
        { x: 'May', y: 92 },
      ],
    },
  },
  {
    id: 'chart-2',
    type: 'chart',
    title: 'Issue Breakdown',
    description: 'Types of issues',
    layout: { x: 0, y: 1, w: 1, h: 1 },
    data: {
      type: 'pie',
      label: 'Issue Breakdown',
      data: [
        { name: 'Critical', value: 2 },
        { name: 'High', value: 5 },
        { name: 'Medium', value: 8 },
        { name: 'Low', value: 15 },
      ],
    },
  },
  {
    id: 'remediation-1',
    type: 'remediation_progress',
    title: 'Remediation Progress',
    description: 'Remediation status',
    layout: { x: 1, y: 1, w: 2, h: 1 },
    data: { label: 'Remediation', progress: 72, status: 'in-progress' },
  },
];

const initialLayout = widgets.map((w, i) => ({
  i: w.id,
  x: w.layout.x,
  y: w.layout.y,
  w: w.layout.w,
  h: w.layout.h,
  minW: 1,
  minH: 1,
}));

export function App() {
  const [userRole, setUserRole] = useState<UserRole>('security_team');
  const [layout, setLayout] = useState(initialLayout);
  const [isWidgetLibraryOpen, setWidgetLibraryOpen] = React.useState(false);
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([
    {
      id: 'widget-default-kpi',
      type: 'kpi',
      title: 'Compliance KPI',
      layout: { x: 0, y: 0, w: 2, h: 2 },
      data: { label: 'Compliance', value: 92, unit: '%', trend: 'up' },
    },
  ]);
  const { user } = useAuth();
  const [configModalOpen, setConfigModalOpen] = React.useState(false);
  const [editingWidget, setEditingWidget] =
    React.useState<DashboardWidget | null>(null);

  // Load widgets from localStorage or Supabase on mount
  React.useEffect(() => {
    // If user is authenticated, TODO: load from Supabase
    if (user) {
      // TODO: Load widgets from Supabase for user.id
      return;
    }
    // Otherwise, load from localStorage
    const saved = localStorage.getItem('dashboard-widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse widgets from localStorage', e);
      }
    }
  }, [user]);

  // Persist widgets to localStorage or Supabase on change
  React.useEffect(() => {
    // If user is authenticated, TODO: persist to Supabase
    if (user) {
      // TODO: Save widgets to Supabase for user.id
      return;
    }
    // Otherwise, persist to localStorage
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets, user]);

  function handleAddWidget(type: string) {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
      layout: { x: 0, y: 0, w: 2, h: 2 },
      data: {},
    };
    setWidgets((prev) => [...prev, newWidget]);
    setWidgetLibraryOpen(false);
  }

  function handleRemoveWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }

  function handleOpenConfig(widget: DashboardWidget) {
    setEditingWidget(widget);
    setConfigModalOpen(true);
  }
  function handleCloseConfig() {
    setConfigModalOpen(false);
    setEditingWidget(null);
  }
  function handleSaveConfig(updated: DashboardWidget) {
    setWidgets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Box
        as="header"
        mb={8}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <h1
          className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          tabIndex={0}
          aria-label="Compliance Dashboard Title"
        >
          Compliance Dashboard
        </h1>
        <ThemeToggle />
      </Box>
      {/* Dashboard help text */}
      <div className="max-w-3xl mx-auto mt-4 mb-6 px-4 text-center text-zinc-700 dark:text-zinc-300 text-sm">
        <span className="font-semibold">Tip:</span> Drag widgets to rearrange.
        Click{' '}
        <span className="inline-block align-middle">
          <FiSettings className="inline w-4 h-4" />
        </span>{' '}
        to configure,{' '}
        <span className="inline-block align-middle">
          <FiTrash2 className="inline w-4 h-4" />
        </span>{' '}
        to remove. Use the blue{' '}
        <span className="inline-block align-middle">
          <svg
            className="inline w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>{' '}
        button to add widgets.
      </div>
      {/* Suggest Widget button (stub for future AI integration) */}
      <button
        className="fixed bottom-24 right-8 z-40 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 rounded-full shadow-lg p-4 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 flex items-center gap-2"
        aria-label="Suggest Widget (AI)"
        tabIndex={0}
        title="Suggest a widget based on your compliance data (coming soon)"
        disabled
      >
        <FiZap className="w-5 h-5" />
        <span className="sr-only">Suggest Widget (AI)</span>
      </button>
      {/* Add Widget FAB with tooltip */}
      <button
        className="fixed bottom-8 right-8 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Add Widget"
        tabIndex={0}
        title="Add a new dashboard widget"
        onClick={() => setWidgetLibraryOpen(true)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="sr-only">Add Widget</span>
      </button>
      <WidgetLibraryPanel
        isOpen={isWidgetLibraryOpen}
        onClose={() => setWidgetLibraryOpen(false)}
        onAddWidget={handleAddWidget}
      />
      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: layout,
          md: layout,
          sm: layout,
          xs: layout,
          xxs: layout,
        }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
        rowHeight={180}
        margin={[24, 24]}
        isResizable
        isDraggable
        onLayoutChange={(newLayout) => setLayout(newLayout)}
        aria-label="Dashboard Widgets"
        role="region"
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="relative group">
            {/* Remove button with tooltip */}
            <button
              className="absolute top-2 right-2 z-10 p-1 bg-white dark:bg-zinc-900 rounded-full shadow hover:bg-red-100 dark:hover:bg-red-900 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
              aria-label={`Remove ${widget.title}`}
              tabIndex={0}
              title="Remove widget"
              onClick={() => handleRemoveWidget(widget.id)}
            >
              <FiTrash2 className="w-5 h-5" />
              <span className="sr-only">Remove</span>
            </button>
            {/* Settings button with tooltip */}
            <button
              className="absolute top-2 right-10 z-10 p-1 bg-white dark:bg-zinc-900 rounded-full shadow hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
              aria-label={`Configure ${widget.title}`}
              tabIndex={0}
              title="Configure widget"
              onClick={() => handleOpenConfig(widget)}
            >
              <FiSettings className="w-5 h-5" />
              <span className="sr-only">Configure</span>
            </button>
            <WidgetFactory widget={widget} />
          </div>
        ))}
      </ResponsiveGridLayout>
      <WidgetConfigModal
        isOpen={configModalOpen}
        onClose={handleCloseConfig}
        widget={editingWidget}
        onSave={handleSaveConfig}
      />
    </div>
  );
}

export default App;
