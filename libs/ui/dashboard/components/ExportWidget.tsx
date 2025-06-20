import * as React from 'react';
import { FiDownload, FiFileText, FiFile, FiFilePlus } from 'react-icons/fi';
import { useHasPermission } from '../../../hooks/authProvider';
import { Card, Button } from '../../primitives';

export interface ExportWidgetProps {
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
  status?: 'idle' | 'exporting' | 'done' | 'error';
  downloadUrl?: string;
  error?: string;
  className?: string;
}

export function ExportWidget({
  onExport,
  status = 'idle',
  downloadUrl,
  error,
  className,
}: ExportWidgetProps) {
  const canExport = useHasPermission('export_reports');
  
  // Debug logging
  console.log('ExportWidget Debug:', {
    canExport
  });
  
  // During SSR/build, be permissive to avoid empty static pages
  if (typeof window === 'undefined' && !canExport) {
    // Return a placeholder during SSR
    return (
      <Card className="w-full h-full p-6 flex flex-col items-center justify-center">
        <span style={{ color: '#6b7280' }}>Loading export options...</span>
      </Card>
    );
  }
  
  if (!canExport) {
    console.log('ExportWidget: Permission denied, returning null');
    return null;
  }

  return (
    <Card
      variant="outline"
      className={`flex flex-col items-start ${className ?? ''}`.trim()}
      tabIndex={0}
      ariaLabel="Export widget"
    >
      <div className="flex items-center mb-2 w-full">
        <span className="text-xs font-semibold uppercase tracking-wider flex-1">
          Export Data
        </span>
        <FiDownload className="text-xl ml-2" aria-hidden />
      </div>
      <div className="flex gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport('pdf')}
          disabled={status === 'exporting'}
          aria-label="Export as PDF"
          colorScheme="brand"
          leftIcon={<FiFileText className="mr-1" />}
        >
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport('csv')}
          disabled={status === 'exporting'}
          aria-label="Export as CSV"
          colorScheme="brand"
          leftIcon={<FiFile className="mr-1" />}
        >
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport('excel')}
          disabled={status === 'exporting'}
          aria-label="Export as Excel"
          colorScheme="brand"
          leftIcon={<FiFilePlus className="mr-1" />}
        >
          Excel
        </Button>
      </div>
      {status === 'exporting' && (
        <div className="text-blue-500 text-xs">Exporting...</div>
      )}
      {status === 'done' && downloadUrl && (
        <a href={downloadUrl} className="btn btn-xs btn-success mt-2" download>
          Download
        </a>
      )}
      {status === 'error' && error && (
        <div className="text-red-500 text-xs mt-2">{error}</div>
      )}
    </Card>
  );
}
