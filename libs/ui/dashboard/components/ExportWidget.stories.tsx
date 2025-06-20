import React from 'react';
import { ExportWidget } from './ExportWidget';

export default {
  title: 'Dashboard/ExportWidget',
  component: ExportWidget,
};

export const Idle = () => <ExportWidget onExport={() => {}} status="idle" />;

export const Exporting = () => (
  <ExportWidget onExport={() => {}} status="exporting" />
);

export const Done = () => (
  <ExportWidget
    onExport={() => {}}
    status="done"
    downloadUrl="/mock-download.csv"
  />
);

export const Error = () => (
  <ExportWidget
    onExport={() => {}}
    status="error"
    error="Export failed. Please try again."
  />
);
