# Dashboard Widget Components

This directory contains modular, best-practices dashboard widgets for the Security Compliance Dashboard. All widgets are designed for maximum reusability, accessibility, and visual excellence using React, TypeScript, Tailwind CSS, DaisyUI, and Recharts.

## Widget Components

- **KPIWidget**: Displays a key performance indicator with animated value, trend, and icon.
- **ChartWidget**: Renders dynamic charts (bar, line, pie, area) using Recharts, with full SSR/CSR safety and accessibility.
- **WidgetContainer**: Provides layout, focus, drag/resize affordances, and ARIA roles for all widgets.
- **WidgetFactory**: Maps widget types to their respective components for modular, extensible rendering.
- **DashboardLayout**: Responsive, drag-and-drop grid layout for arranging widgets.
- **RemediationProgressBar**: Animated, accessible progress bar for remediation status, with label, progress, and status color.

## Usage Example

```tsx
import { DashboardLayout } from './DashboardLayout';
import type { DashboardWidget } from '../types/widget';
import { RemediationProgressBar } from './RemediationProgressBar';

const widgets: DashboardWidget[] = [
  {
    id: 'kpi-1',
    type: 'kpi',
    title: 'Total Compliance',
    layout: { x: 0, y: 0, w: 3, h: 2 },
    data: { label: 'Compliance', value: 98, trend: 'up', icon: '✅' },
  },
  {
    id: 'chart-1',
    type: 'chart',
    title: 'Risk Distribution',
    layout: { x: 3, y: 0, w: 6, h: 4 },
    data: {
      type: 'bar',
      data: [
        { name: 'Low', value: 40 },
        { name: 'Medium', value: 30 },
        { name: 'High', value: 20 },
        { name: 'Critical', value: 10 },
      ],
      options: { xKey: 'name', yKey: 'value', colors: ['#38a169', '#ecc94b', '#dd6b20', '#e53e3e'] },
    },
  },
];

<DashboardLayout widgets={widgets} />

<RemediationProgressBar label="Remediation" progress={72} status="in-progress" />
```

## Prop Types

### DashboardWidget

```
type DashboardWidget = {
  id: string;
  type: 'kpi' | 'chart' | 'risk' | 'remediation' | 'custom';
  title: string;
  description?: string;
  layout: WidgetLayout;
  data?: any;
};
```

### KPIWidgetData

```
type KPIWidgetData = {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
};
```

### ChartWidgetData

```
type ChartWidgetData = {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  options?: {
    xKey?: string;
    yKey?: string;
    colors?: string[];
  };
};
```

### RemediationProgressBarData

```
type RemediationProgressBarData = {
  label: string;
  progress: number;
  status?: 'in-progress' | 'complete' | 'blocked';
};
```

## Customization

- **Theming**: All widgets support dark/light mode and are styled with Tailwind/DaisyUI utility classes.
- **Responsiveness**: Widgets and layout are fully responsive and mobile-friendly.
- **Accessibility**: ARIA roles, keyboard navigation, and focus rings are implemented for all widgets.
- **Performance**: ChartWidget and KPIWidget are lazy-loaded via React.lazy and Suspense for optimal performance.
- **Extensibility**: Add new widget types by extending WidgetFactory and creating new widget components.

## Testing

- Unit and integration tests are provided for ChartWidget (see `ChartWidget.test.tsx`).
- Use React Testing Library and Jest for all widget tests.

## Extension Guidelines

- To add a new widget type:
  1. Create a new widget component (e.g., `RiskWidget.tsx`).
  2. Add the type to `DashboardWidget` and `WidgetFactory`.
  3. Document the new widget in this README.
  4. Add tests for the new widget.

---

For questions or contributions, see the project root README or open an issue on GitHub.
