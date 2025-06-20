import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import {
  Responsive,
  WidthProvider,
  type Layout,
  type ResponsiveProps,
  type WidthProviderProps,
} from 'react-grid-layout';
import { useAuth } from '../context/AuthContext';

import ScanTriggerWidget from './ScanTriggerWidget';
import ComplianceScoreWidget, {
  type ComplianceScore,
  type ComplianceMetrics,
} from './ComplianceScoreWidget';
import ReportingDashboard, {
  type ComplianceReport,
  type ReportTemplate,
} from './ReportingDashboard';
import HeatMapVisualization from './HeatMapVisualization';
import type { ComplianceDataPoint } from './HeatMapVisualization';

const ResponsiveReactGridLayout = WidthProvider(
  Responsive
) as React.ComponentType<ResponsiveProps & WidthProviderProps>;

export type UserRole =
  | 'security_team'
  | 'developer'
  | 'compliance_officer'
  | 'admin';

export interface DashboardLayout {
  role: UserRole;
  components: DashboardComponent[];
  gridTemplate: string;
  spacing: number;
}

export interface DashboardComponent {
  id: string;
  type:
    | 'heat_map'
    | 'compliance_score'
    | 'reporting'
    | 'scan_results'
    | 'scan_trigger'
    | 'custom';
  gridArea: string;
  props?: any;
  visible: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface DashboardLayoutContextType {
  currentLayout: DashboardLayout | null;
  userRole: UserRole | null;
  updateComponentVisibility: (componentId: string, visible: boolean) => void;
  updateComponentProps: (componentId: string, props: any) => void;
}

const DashboardLayoutContext = createContext<
  DashboardLayoutContextType | undefined
>(undefined);

export const useDashboardLayout = () => {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error(
      'useDashboardLayout must be used within a DashboardLayoutProvider'
    );
  }
  return context;
};

interface DashboardLayoutProviderProps {
  children: React.ReactNode;
  mockData?: {
    heatMapData?: ComplianceDataPoint[];
    complianceScore?: ComplianceScore;
    complianceMetrics?: ComplianceMetrics;
    reports?: ComplianceReport[];
    templates?: ReportTemplate[];
  };
}

const DashboardLayoutProvider: React.FC<DashboardLayoutProviderProps> = ({
  children,
  mockData = {},
}) => {
  const { user } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Determine user role (in real app, this would come from user profile)
  const userRole: UserRole = useMemo(() => {
    // For demo purposes, determine role based on user properties or default to security_team
    if (user?.role) {
      return user.role as UserRole;
    }
    // Default role for demo
    return 'security_team';
  }, [user]);

  // Define layouts for different roles
  const layouts: Record<UserRole, DashboardLayout> = {
    security_team: {
      role: 'security_team',
      gridTemplate: `
      "score score heat heat" auto
      "score score heat heat" auto
      "reports reports reports reports" 1fr
      / 1fr 1fr 1fr 1fr
    `,
      spacing: 6,
      components: [
        {
          id: 'scan_trigger',
          type: 'scan_trigger',
          gridArea: 'score',
          visible: true,
          size: 'md',
        },
      ],
    },
    developer: {
      role: 'developer',
      gridTemplate: `
      "score heat heat" auto
      "reports reports reports" 1fr
      / 1fr 1fr 1fr
    `,
      spacing: 4,
      components: [
        {
          id: 'scan_trigger',
          type: 'scan_trigger',
          gridArea: 'score',
          visible: true,
          size: 'md',
        },
      ],
    },
    compliance_officer: {
      role: 'compliance_officer',
      gridTemplate: `
      "score score" auto
      "reporting reporting" 1fr
      / 1fr 1fr
    `,
      spacing: 6,
      components: [
        {
          id: 'scan_trigger',
          type: 'scan_trigger',
          gridArea: 'score',
          visible: true,
          size: 'md',
        },
      ],
    },
    admin: {
      role: 'admin',
      gridTemplate: `
      "score heat reporting" auto
      "results results results" 1fr
      / 1fr 1fr 1fr
    `,
      spacing: 4,
      components: [
        {
          id: 'scan_trigger',
          type: 'scan_trigger',
          gridArea: 'score',
          visible: true,
          size: 'md',
        },
        {
          id: 'compliance_score',
          type: 'compliance_score',
          gridArea: 'score',
          visible: true,
          size: 'md',
        },
        {
          id: 'heat_map',
          type: 'heat_map',
          gridArea: 'heat',
          visible: true,
          size: 'md',
        },
        {
          id: 'reporting',
          type: 'reporting',
          gridArea: 'reporting',
          visible: true,
          size: 'md',
        },
        {
          id: 'scan_results',
          type: 'scan_results',
          gridArea: 'results',
          visible: true,
          size: 'md',
        },
      ],
    },
  };

  const currentLayout = layouts[userRole];

  // Layout persistence key
  const layoutKey = `dashboard-layout-${userRole}`;

  // Responsive breakpoints and columns for better scaling
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 };

  // Default layout for all breakpoints
  const defaultLayout = currentLayout.components.map((c, i) => ({
    i: c.id,
    x: (i * 4) % 12,
    y: Math.floor(i / 3) * 2,
    w: 4,
    h: 3,
    minW: 2,
    maxW: 12,
    minH: 2,
    maxH: 8,
  }));
  const gridLayouts = {
    lg: defaultLayout,
    md: defaultLayout,
    sm: defaultLayout,
    xs: defaultLayout,
    xxs: defaultLayout,
  };

  const [layout, setLayout] = useState<Layout[]>(() => {
    const saved = localStorage.getItem(layoutKey);
    if (saved) return JSON.parse(saved);
    return defaultLayout;
  });

  useEffect(() => {
    localStorage.setItem(layoutKey, JSON.stringify(layout));
  }, [layoutKey, layout]);

  // Component state management
  const [componentStates, setComponentStates] = React.useState<
    Record<string, any>
  >({});

  const updateComponentVisibility = (componentId: string, visible: boolean) => {
    setComponentStates((prev) => ({
      ...prev,
      [componentId]: { ...prev[componentId], visible },
    }));
  };

  const updateComponentProps = (componentId: string, props: any) => {
    setComponentStates((prev) => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        props: { ...prev[componentId]?.props, ...props },
      },
    }));
  };

  // Render component based on type
  const renderComponent = (component: DashboardComponent) => {
    const state = componentStates[component.id];
    const isVisible =
      state?.visible !== undefined ? state.visible : component.visible;
    const componentProps = { ...component.props, ...state?.props };

    if (!isVisible) return null;

    switch (component.type) {
      case 'heat_map':
        return (
          <HeatMapVisualization
            data={mockData.heatMapData || []}
            {...componentProps}
          />
        );
      case 'compliance_score':
        return (
          <ComplianceScoreWidget
            score={mockData.complianceScore}
            metrics={mockData.complianceMetrics}
            size={component.size}
            {...componentProps}
          />
        );
      case 'reporting':
        return (
          <ReportingDashboard
            reports={mockData.reports || []}
            templates={mockData.templates || []}
            {...componentProps}
          />
        );
      case 'scan_results':
        return (
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            minH="300px"
          >
            <Box>Scan Results Component (to be implemented)</Box>
          </Box>
        );
      case 'scan_trigger':
        return <ScanTriggerWidget {...componentProps} />;
      default:
        return (
          <Box
            bg="white"
            p={4}
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
          >
            Unknown component type: {component.type}
          </Box>
        );
    }
  };

  const contextValue: DashboardLayoutContextType = {
    currentLayout,
    userRole,
    updateComponentVisibility,
    updateComponentProps,
  };

  return (
    <DashboardLayoutContext.Provider value={contextValue}>
      <Box bg={bgColor} minH="100vh" p={4}>
        {/* See https://github.com/react-grid-layout/react-grid-layout#provide-grid-width-automatically-using-widthprovider-hoc-in-react */}
        <ResponsiveReactGridLayout
          className="layout"
          layouts={gridLayouts}
          breakpoints={breakpoints}
          cols={cols}
          margin={[16, 16]}
          containerPadding={[16, 16]}
          rowHeight={120}
          onLayoutChange={(l: Layout[]) => setLayout(l)}
          isResizable
          isDraggable
        >
          {currentLayout.components.map((component) => (
            <div
              key={component.id}
              data-grid={layout.find((l: Layout) => l.i === component.id)}
            >
              {renderComponent(component)}
            </div>
          ))}
        </ResponsiveReactGridLayout>
        {children}
      </Box>
    </DashboardLayoutContext.Provider>
  );
};

export default DashboardLayoutProvider;
