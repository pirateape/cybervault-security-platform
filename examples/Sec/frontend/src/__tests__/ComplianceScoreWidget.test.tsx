import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import * as React from 'react';
import ComplianceScoreWidget from '../components/ComplianceScoreWidget';
import type { ComplianceScore } from '../components/ComplianceScoreWidget';

describe('ComplianceScoreWidget - StatArrow Regression', () => {
  const baseScore: ComplianceScore = {
    overall: 85,
    nist: 90,
    iso27001: 80,
    gdpr: 75,
    trend: 'up',
    trendValue: 5,
    lastUpdated: new Date().toISOString(),
  };

  it('renders StatArrow inside StatHelpText and Stat without context error', () => {
    render(
      <ChakraProvider>
        <ComplianceScoreWidget score={baseScore} />
      </ChakraProvider>
    );
    // StatArrow should be present and not throw
    expect(screen.getByText(/from last week/i)).toBeInTheDocument();
    // StatArrow is rendered as an SVG with aria-hidden
    const arrows = screen.getAllByLabelText(/increase|decrease/i, {
      selector: 'svg',
    });
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('does not render StatArrow or trend text if trend is "stable"', () => {
    const score: ComplianceScore = {
      ...baseScore,
      trend: 'stable',
      trendValue: 0,
    };
    render(
      <ChakraProvider>
        <ComplianceScoreWidget score={score} />
      </ChakraProvider>
    );
    // Should render without crashing
    expect(screen.getByText(/compliance score/i)).toBeInTheDocument();
    // Should not render trend text
    expect(screen.queryByText(/from last week/i)).not.toBeInTheDocument();
  });
});
