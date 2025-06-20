import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export type UserRole =
  | 'security_team'
  | 'developer'
  | 'compliance_officer'
  | 'admin';

export interface DashboardComponent {
  id: string;
  type: string;
  gridArea: string;
  visible: boolean;
  size: 'sm' | 'md' | 'lg';
  props?: Record<string, any>;
}

export interface DashboardLayout {
  role: UserRole;
  gridTemplate: string;
  spacing: number;
  components: DashboardComponent[];
}

export interface DashboardLayoutContextType {
  currentLayout: DashboardLayout;
  userRole: UserRole;
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

export const DashboardLayoutProvider = ({
  children,
  userRole = 'security_team',
  mockData = {},
}: {
  children: ReactNode;
  userRole?: UserRole;
  mockData?: Record<string, any>;
}) => {
  // Define layouts for different roles
  const layouts: Record<UserRole, DashboardLayout> = {
    security_team: {
      role: 'security_team',
      gridTemplate: `"score score heat heat" auto "score score heat heat" auto "reports reports reports reports" 1fr / 1fr 1fr 1fr 1fr`,
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
      gridTemplate: `"score heat heat" auto "reports reports reports" 1fr / 1fr 1fr 1fr`,
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
      gridTemplate: `"score score" auto "reporting reporting" 1fr / 1fr 1fr`,
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
      gridTemplate: `"score heat reporting" auto "results results results" 1fr / 1fr 1fr 1fr`,
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

  const [layout, setLayout] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(layoutKey);
      if (saved) return JSON.parse(saved);
    }
    return defaultLayout;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(layoutKey, JSON.stringify(layout));
    }
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

  const contextValue: DashboardLayoutContextType = {
    currentLayout,
    userRole,
    updateComponentVisibility,
    updateComponentProps,
  };

  return (
    <DashboardLayoutContext.Provider value={contextValue}>
      {children}
    </DashboardLayoutContext.Provider>
  );
};
