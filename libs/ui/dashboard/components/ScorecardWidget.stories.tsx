import React from 'react';
import { ScorecardWidget } from './ScorecardWidget';
import { FiShield, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';

export default {
  title: 'Dashboard/ScorecardWidget',
  component: ScorecardWidget,
};

export const LowRisk = () => (
  <ScorecardWidget
    score={98}
    label="Compliance"
    riskLevel="low"
    icon={<FiShield />}
  />
);

export const MediumRisk = () => (
  <ScorecardWidget
    score={82}
    label="Compliance"
    riskLevel="medium"
    icon={<FiAlertTriangle />}
  />
);

export const HighRisk = () => (
  <ScorecardWidget
    score={65}
    label="Compliance"
    riskLevel="high"
    icon={<FiAlertCircle />}
  />
);
