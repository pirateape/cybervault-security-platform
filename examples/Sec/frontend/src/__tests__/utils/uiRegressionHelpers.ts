import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import theme from '../../theme';

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

const AllTheProviders = ({
  children,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <AuthProvider>{children}</AuthProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
};

// UI Regression Testing Utilities
export interface UISnapshot {
  componentName: string;
  props: Record<string, any>;
  timestamp: string;
  viewport: { width: number; height: number };
  theme: 'light' | 'dark';
  testId: string;
}

export const createUISnapshot = (
  componentName: string,
  props: Record<string, any> = {},
  options: {
    viewport?: { width: number; height: number };
    theme?: 'light' | 'dark';
  } = {}
): UISnapshot => {
  return {
    componentName,
    props,
    timestamp: new Date().toISOString(),
    viewport: options.viewport || { width: 1024, height: 768 },
    theme: options.theme || 'light',
    testId: `ui-snapshot-${componentName.toLowerCase()}-${Date.now()}`,
  };
};

// Component layering test utilities
export const testComponentLayering = (container: HTMLElement) => {
  const elements = Array.from(container.querySelectorAll('*'));
  const layeringIssues: Array<{
    element: Element;
    issue: string;
    zIndex: string;
  }> = [];

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const zIndex = computedStyle.zIndex;
    const position = computedStyle.position;

    // Check for common layering issues
    if (zIndex === 'auto' && position !== 'static') {
      layeringIssues.push({
        element,
        issue: 'Positioned element without explicit z-index',
        zIndex,
      });
    }

    if (parseInt(zIndex) > 9999) {
      layeringIssues.push({
        element,
        issue: 'Extremely high z-index value',
        zIndex,
      });
    }

    // Check for negative z-index on interactive elements
    if (
      parseInt(zIndex) < 0 &&
      (element.tagName === 'BUTTON' ||
        element.tagName === 'A' ||
        element.getAttribute('role') === 'button')
    ) {
      layeringIssues.push({
        element,
        issue: 'Interactive element with negative z-index',
        zIndex,
      });
    }
  });

  return layeringIssues;
};

// Responsive behavior testing
export const testResponsiveBehavior = async (
  component: ReactElement,
  breakpoints: Array<{ width: number; height: number; name: string }>
) => {
  const results: Array<{
    breakpoint: string;
    width: number;
    height: number;
    snapshot: string;
    issues: string[];
  }> = [];

  for (const breakpoint of breakpoints) {
    // Set viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: breakpoint.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: breakpoint.height,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    // Render component
    const { container, unmount } = renderWithProviders(component);

    // Check for responsive issues
    const issues: string[] = [];
    const elements = container.querySelectorAll('*');

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();

      // Check for horizontal overflow
      if (rect.width > breakpoint.width) {
        issues.push(`Element exceeds viewport width: ${element.tagName}`);
      }

      // Check for elements that are too small on mobile
      if (breakpoint.width < 768 && element.tagName === 'BUTTON') {
        if (rect.height < 44) {
          issues.push(`Button too small for touch: ${rect.height}px height`);
        }
      }
    });

    results.push({
      breakpoint: breakpoint.name,
      width: breakpoint.width,
      height: breakpoint.height,
      snapshot: container.innerHTML,
      issues,
    });

    unmount();
  }

  return results;
};

// Accessibility testing for UI regression
export const testAccessibilityRegression = (container: HTMLElement) => {
  const issues: Array<{
    element: Element;
    issue: string;
    severity: 'error' | 'warning';
  }> = [];

  // Check for missing alt text on images
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.getAttribute('alt')) {
      issues.push({
        element: img,
        issue: 'Image missing alt attribute',
        severity: 'error',
      });
    }
  });

  // Check for buttons without accessible names
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledBy = button.getAttribute('aria-labelledby');

    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        element: button,
        issue: 'Button without accessible name',
        severity: 'error',
      });
    }
  });

  // Check for form inputs without labels
  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    const id = input.getAttribute('id');
    const hasLabel = id && container.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        element: input,
        issue: 'Form input without label',
        severity: 'error',
      });
    }
  });

  // Check for insufficient color contrast (basic check)
  const textElements = container.querySelectorAll(
    'p, span, div, h1, h2, h3, h4, h5, h6'
  );
  textElements.forEach((element) => {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    // This is a simplified check - in practice, you'd use a proper contrast ratio calculator
    if (color === backgroundColor) {
      issues.push({
        element,
        issue: 'Text and background colors are identical',
        severity: 'error',
      });
    }
  });

  return issues;
};

// Performance testing for UI components
export const testComponentPerformance = async (
  component: ReactElement,
  iterations: number = 10
) => {
  const renderTimes: number[] = [];
  const unmountTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Measure render time
    const renderStart = performance.now();
    const { unmount } = renderWithProviders(component);
    const renderEnd = performance.now();
    renderTimes.push(renderEnd - renderStart);

    // Measure unmount time
    const unmountStart = performance.now();
    unmount();
    const unmountEnd = performance.now();
    unmountTimes.push(unmountEnd - unmountStart);
  }

  return {
    averageRenderTime:
      renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
    maxRenderTime: Math.max(...renderTimes),
    minRenderTime: Math.min(...renderTimes),
    averageUnmountTime:
      unmountTimes.reduce((a, b) => a + b, 0) / unmountTimes.length,
    maxUnmountTime: Math.max(...unmountTimes),
    minUnmountTime: Math.min(...unmountTimes),
    renderTimes,
    unmountTimes,
  };
};

// Theme consistency testing
export const testThemeConsistency = (container: HTMLElement) => {
  const inconsistencies: Array<{
    element: Element;
    property: string;
    value: string;
    issue: string;
  }> = [];

  const elements = container.querySelectorAll('*');
  const colorValues = new Set<string>();
  const fontSizes = new Set<string>();
  const fontFamilies = new Set<string>();

  elements.forEach((element) => {
    const style = window.getComputedStyle(element);

    // Collect color values
    if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
      colorValues.add(style.color);
    }

    // Collect font sizes
    if (style.fontSize) {
      fontSizes.add(style.fontSize);
    }

    // Collect font families
    if (style.fontFamily) {
      fontFamilies.add(style.fontFamily);
    }

    // Check for inline styles (potential theme violations)
    if (element.getAttribute('style')) {
      inconsistencies.push({
        element,
        property: 'style',
        value: element.getAttribute('style') || '',
        issue: 'Inline styles detected - may violate theme consistency',
      });
    }
  });

  // Check for too many unique values (potential inconsistency)
  if (colorValues.size > 20) {
    inconsistencies.push({
      element: container,
      property: 'colors',
      value: `${colorValues.size} unique colors`,
      issue: 'Too many unique color values - consider consolidating',
    });
  }

  if (fontSizes.size > 10) {
    inconsistencies.push({
      element: container,
      property: 'font-sizes',
      value: `${fontSizes.size} unique font sizes`,
      issue: 'Too many unique font sizes - consider using design system scale',
    });
  }

  return {
    inconsistencies,
    stats: {
      uniqueColors: colorValues.size,
      uniqueFontSizes: fontSizes.size,
      uniqueFontFamilies: fontFamilies.size,
    },
  };
};

// Export common test data
export const commonBreakpoints = [
  { width: 320, height: 568, name: 'mobile-small' },
  { width: 375, height: 667, name: 'mobile-medium' },
  { width: 414, height: 896, name: 'mobile-large' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1024, height: 768, name: 'desktop-small' },
  { width: 1440, height: 900, name: 'desktop-medium' },
  { width: 1920, height: 1080, name: 'desktop-large' },
];

export const commonTestProps = {
  loading: { isLoading: true },
  error: { error: new Error('Test error') },
  empty: { data: [] },
  populated: { data: [{ id: 1, name: 'Test Item' }] },
};
