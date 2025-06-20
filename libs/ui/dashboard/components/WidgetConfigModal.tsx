import * as React from 'react';
import { Modal, Input, Button } from '../../primitives';
import type { DashboardWidget } from '../types/widget';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  widget: DashboardWidget | null;
  onSave: (updated: DashboardWidget) => void;
}

const colorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'gray', label: 'Gray' },
];

export function WidgetConfigModal({
  isOpen,
  onClose,
  widget,
  onSave,
}: WidgetConfigModalProps) {
  const [title, setTitle] = React.useState(widget?.title || '');
  const [color, setColor] = React.useState(widget?.data?.color || 'blue');
  const [dataSource, setDataSource] = React.useState(
    widget?.data?.dataSource || ''
  );
  const [framework, setFramework] = React.useState(
    widget?.data?.config?.framework || ''
  );
  const [columns, setColumns] = React.useState<string[]>(
    widget?.data?.config?.columns || []
  );
  const [view, setView] = React.useState<string>(
    widget?.data?.config?.view || 'table'
  );

  React.useEffect(() => {
    setTitle(widget?.title || '');
    setColor(widget?.data?.color || 'blue');
    setDataSource(widget?.data?.dataSource || '');
    setFramework(widget?.data?.config?.framework || '');
    setColumns(widget?.data?.config?.columns || []);
    setView(widget?.data?.config?.view || 'table');
  }, [widget]);

  if (!widget) return null;

  function handleSave() {
    const updated: DashboardWidget = {
      ...widget,
      title,
      data: {
        ...widget.data,
        color,
        ...(widget.type === 'chart' ? { dataSource } : {}),
        ...(widget.type === 'compliance_status'
          ? { config: { ...widget.data?.config, framework } }
          : {}),
        ...(widget.type === 'audit_log'
          ? { config: { ...widget.data?.config, columns, view } }
          : {}),
      },
    };
    onSave(updated);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Widget Settings">
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="title" className="block font-semibold mb-1">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            aria-label="Widget title"
          />
        </div>
        <div>
          <label htmlFor="color" className="block font-semibold mb-1">
            Color
          </label>
          <select
            id="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="border rounded px-2 py-1"
            aria-label="Widget color"
          >
            {colorOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {widget.type === 'chart' && (
          <div>
            <label htmlFor="dataSource" className="block font-semibold mb-1">
              Data Source
            </label>
            <Input
              id="dataSource"
              value={dataSource}
              onChange={e => setDataSource(e.target.value)}
              aria-label="Chart data source"
            />
          </div>
        )}
        {widget.type === 'compliance_status' && (
          <div>
            <label htmlFor="framework" className="block font-semibold mb-1">
              Framework
            </label>
            <Input
              id="framework"
              value={framework}
              onChange={e => setFramework(e.target.value)}
              placeholder="e.g. NIST, GDPR"
              aria-label="Compliance framework"
            />
          </div>
        )}
        {widget.type === 'audit_log' && (
          <>
            <div>
              <label className="block font-semibold mb-1">Columns</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'timestamp',
                  'event_type',
                  'user_id',
                  'resource',
                  'resource_id',
                  'outcome',
                  'ip_address',
                  'user_agent',
                  'details',
                  'hash',
                  'prev_hash',
                ].map(col => (
                  <label key={col} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      value={col}
                      checked={columns.includes(col)}
                      onChange={e => {
                        if (e.target.checked) setColumns([...columns, col]);
                        else setColumns(columns.filter(c => c !== col));
                      }}
                      aria-label={col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    />
                    <span>
                      {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1" htmlFor="audit-log-view">
                View
              </label>
              <select
                id="audit-log-view"
                value={view}
                onChange={e => setView(e.target.value as any)}
                className="border rounded px-2 py-1"
                aria-label="Audit log view"
              >
                <option value="table">Table</option>
                <option value="timeline">Timeline (coming soon)</option>
              </select>
            </div>
          </>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose} colorScheme="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="solid" colorScheme="brand">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
