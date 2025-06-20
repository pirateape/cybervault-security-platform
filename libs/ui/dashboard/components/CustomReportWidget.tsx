import * as React from 'react';
import { useHasPermission } from '../../../hooks/authProvider';
import { Card, Button, Input } from '../../primitives';

export interface CustomReportWidgetProps {
  onGenerate: (filters: Record<string, any>) => void;
  reportData?: any[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export const CustomReportWidget: React.FC<CustomReportWidgetProps> = (props) => {
  const canViewReports = useHasPermission('view_reports');
  
  // Debug logging
  console.log('CustomReportWidget Debug:', {
    canViewReports
  });
  
  // During SSR/build, be permissive to avoid empty static pages
  if (typeof window === 'undefined' && !canViewReports) {
    // Return a placeholder during SSR
    return (
      <Card className="w-full h-full p-6 flex flex-col items-center justify-center">
        <span style={{ color: '#6b7280' }}>Loading custom reports...</span>
      </Card>
    );
  }
  
  if (!canViewReports) {
    // TODO: RBAC extensibility: show request access or contact admin
    return (
      <Card tabIndex={0} aria-label="Custom report widget - Access Denied" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <span style={{ color: '#dc2626', fontWeight: 600 }}>Access Denied: Cannot view reports</span>
      </Card>
    );
  }

  const [filters, setFilters] = React.useState<Record<string, any>>({});
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  return (
    <Card tabIndex={0} aria-label="Custom report widget" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ...((props.className ? {} : {})) }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, width: '100%' }}>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
          Custom Report
        </span>
      </div>
      <form
        style={{ display: 'flex', gap: 8, marginBottom: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          props.onGenerate(filters);
        }}
        aria-label="Custom report filters"
      >
        <Input
          name="project"
          placeholder="Project"
          onChange={handleChange}
          uiSize="sm"
          aria-label="Project filter"
        />
        <Input
          name="date"
          placeholder="Date"
          type="date"
          onChange={handleChange}
          uiSize="sm"
          aria-label="Date filter"
        />
        <Button colorScheme="brand" type="submit" disabled={props.isLoading}>
          Generate
        </Button>
      </form>
      <div aria-live="polite" aria-atomic="true" style={{ minHeight: 20 }}>
        {props.isLoading && <span style={{ color: '#2563eb', fontSize: 12 }}>Loading...</span>}
        {props.error && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{props.error}</span>}
      </div>
      {props.reportData && props.reportData.length > 0 && (
        <div style={{ marginTop: 8, width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }} aria-label="Custom report data">
            <thead>
              <tr>
                {Object.keys(props.reportData[0]).map((k) => (
                  <th key={k} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.reportData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => (
                    <td key={j} style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* TODO: Add RBAC, extensibility, and Storybook/test coverage hooks */}
    </Card>
  );
};
