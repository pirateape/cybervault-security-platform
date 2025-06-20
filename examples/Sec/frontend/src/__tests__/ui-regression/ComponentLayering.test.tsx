import { describe, it, expect } from '@jest/globals';
import { screen } from '@testing-library/react';
import {
  renderWithProviders,
  testComponentLayering,
  commonBreakpoints,
} from '../utils/uiRegressionHelpers';
import Dashboard from '../../pages/Dashboard';
import NavBar from '../../components/NavBar';
import ReportingDashboard from '../../components/ReportingDashboard';
import HeatMapVisualization from '../../components/HeatMapVisualization';
import ComplianceScoreWidget from '../../components/ComplianceScoreWidget';

describe('UI Component Layering Tests', () => {
  describe('Dashboard Layering', () => {
    it('should have proper z-index layering for dashboard components', () => {
      const { container } = renderWithProviders(<Dashboard />);
      const layeringIssues = testComponentLayering(container);

      // Log issues for debugging
      if (layeringIssues.length > 0) {
        console.warn('Dashboard layering issues:', layeringIssues);
      }

      // Should have minimal layering issues
      expect(layeringIssues.length).toBeLessThan(3);

      // No interactive elements should have negative z-index
      const interactiveIssues = layeringIssues.filter((issue) =>
        issue.issue.includes('Interactive element with negative z-index')
      );
      expect(interactiveIssues).toHaveLength(0);
    });

    it('should maintain layering consistency across breakpoints', async () => {
      const breakpointsToTest = [
        commonBreakpoints[0], // mobile-small
        commonBreakpoints[3], // tablet
        commonBreakpoints[5], // desktop-medium
      ];

      for (const breakpoint of breakpointsToTest) {
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
        window.dispatchEvent(new Event('resize'));

        const { container, unmount } = renderWithProviders(<Dashboard />);
        const layeringIssues = testComponentLayering(container);

        // Each breakpoint should have consistent layering
        expect(layeringIssues.length).toBeLessThan(5);

        // No extremely high z-index values
        const highZIndexIssues = layeringIssues.filter((issue) =>
          issue.issue.includes('Extremely high z-index')
        );
        expect(highZIndexIssues).toHaveLength(0);

        unmount();
      }
    });
  });

  describe('Navigation Layering', () => {
    it('should ensure navigation stays above content', () => {
      const { container } = renderWithProviders(<NavBar />);

      const navElement = container.querySelector('nav');
      expect(navElement).toBeInTheDocument();

      if (navElement) {
        const navStyle = window.getComputedStyle(navElement);
        const zIndex = parseInt(navStyle.zIndex);

        // Navigation should have a reasonable z-index
        expect(zIndex).toBeGreaterThan(0);
        expect(zIndex).toBeLessThan(1000);
      }

      const layeringIssues = testComponentLayering(container);
      expect(layeringIssues.length).toBeLessThan(2);
    });
  });

  describe('Modal and Overlay Layering', () => {
    it('should handle modal layering correctly', () => {
      // Test with a component that might have modals
      const { container } = renderWithProviders(<ReportingDashboard />);

      const layeringIssues = testComponentLayering(container);

      // Check for modal-related layering issues
      const modalIssues = layeringIssues.filter(
        (issue) =>
          issue.element.getAttribute('role') === 'dialog' ||
          issue.element.classList.contains('modal') ||
          issue.element.classList.contains('overlay')
      );

      // Modals should not have layering issues
      expect(modalIssues).toHaveLength(0);
    });
  });

  describe('Chart and Visualization Layering', () => {
    it('should maintain proper layering for interactive charts', () => {
      const mockData = [
        { name: 'Test 1', value: 100, compliance: 85 },
        { name: 'Test 2', value: 200, compliance: 92 },
      ];

      const { container } = renderWithProviders(
        <HeatMapVisualization data={mockData} />
      );

      const layeringIssues = testComponentLayering(container);

      // Charts should have minimal layering issues
      expect(layeringIssues.length).toBeLessThan(3);

      // SVG elements should not have problematic z-index values
      const svgElements = container.querySelectorAll('svg');
      svgElements.forEach((svg) => {
        const style = window.getComputedStyle(svg);
        const zIndex = style.zIndex;

        if (zIndex !== 'auto') {
          const zIndexValue = parseInt(zIndex);
          expect(zIndexValue).toBeLessThan(100);
        }
      });
    });
  });

  describe('Widget Layering', () => {
    it('should ensure widgets have consistent layering', () => {
      const mockScore = {
        overall: 85,
        categories: [
          { name: 'Security', score: 90 },
          { name: 'Compliance', score: 80 },
        ],
      };

      const { container } = renderWithProviders(
        <ComplianceScoreWidget score={mockScore} />
      );

      const layeringIssues = testComponentLayering(container);

      // Widgets should have clean layering
      expect(layeringIssues.length).toBeLessThan(2);

      // Check for widget-specific elements
      const widgetElements = container.querySelectorAll(
        '[data-testid*="widget"]'
      );
      widgetElements.forEach((widget) => {
        const style = window.getComputedStyle(widget);
        const position = style.position;
        const zIndex = style.zIndex;

        // Positioned widgets should have explicit z-index
        if (position !== 'static' && position !== 'relative') {
          expect(zIndex).not.toBe('auto');
        }
      });
    });
  });

  describe('Responsive Layering Behavior', () => {
    it('should maintain layering integrity during responsive transitions', async () => {
      const { container, rerender } = renderWithProviders(<Dashboard />);

      // Test multiple viewport changes
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1440, height: 900 }, // Desktop
        { width: 320, height: 568 }, // Back to mobile
      ];

      for (const viewport of viewports) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        });
        window.dispatchEvent(new Event('resize'));

        // Re-render to trigger responsive changes
        rerender(<Dashboard />);

        const layeringIssues = testComponentLayering(container);

        // Should maintain layering consistency
        expect(layeringIssues.length).toBeLessThan(5);

        // No elements should disappear behind others
        const hiddenElements = Array.from(
          container.querySelectorAll('*')
        ).filter((el) => {
          const style = window.getComputedStyle(el);
          return style.visibility === 'hidden' && style.display !== 'none';
        });

        // Hidden elements should be intentionally hidden, not due to layering
        expect(hiddenElements.length).toBeLessThan(3);
      }
    });
  });

  describe('Focus and Interaction Layering', () => {
    it('should ensure focused elements are visible and accessible', () => {
      const { container } = renderWithProviders(<Dashboard />);

      // Find all focusable elements
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      focusableElements.forEach((element) => {
        const style = window.getComputedStyle(element);
        const zIndex = parseInt(style.zIndex) || 0;

        // Focusable elements should not be hidden behind others
        expect(zIndex).toBeGreaterThanOrEqual(0);

        // Should not have extremely high z-index
        expect(zIndex).toBeLessThan(9999);
      });
    });
  });

  describe('Animation and Transition Layering', () => {
    it('should handle animated elements layering correctly', async () => {
      const { container } = renderWithProviders(<Dashboard />);

      // Look for elements with transitions or animations
      const animatedElements = Array.from(
        container.querySelectorAll('*')
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.transition !== 'all 0s ease 0s' || style.animation !== 'none'
        );
      });

      animatedElements.forEach((element) => {
        const style = window.getComputedStyle(element);
        const zIndex = style.zIndex;

        // Animated elements should have reasonable z-index values
        if (zIndex !== 'auto') {
          const zIndexValue = parseInt(zIndex);
          expect(zIndexValue).toBeLessThan(1000);
          expect(zIndexValue).toBeGreaterThan(-100);
        }
      });
    });
  });
});
