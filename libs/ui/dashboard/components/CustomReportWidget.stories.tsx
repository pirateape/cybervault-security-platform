import React from 'react';
import { CustomReportWidget } from './CustomReportWidget';

export default {
  title: 'Dashboard/CustomReportWidget',
  component: CustomReportWidget,
};

export const Empty = () => (
  <CustomReportWidget onGenerate={() => {}} reportData={[]} />
);

export const Loading = () => (
  <CustomReportWidget onGenerate={() => {}} isLoading />
);

export const Error = () => (
  <CustomReportWidget
    onGenerate={() => {}}
    error="Failed to generate report."
  />
);

export const WithData = () => (
  <CustomReportWidget
    onGenerate={() => {}}
    reportData={[
      { Project: 'Alpha', Date: '2024-06-01', Score: 98 },
      { Project: 'Beta', Date: '2024-06-01', Score: 87 },
    ]}
  />
);
