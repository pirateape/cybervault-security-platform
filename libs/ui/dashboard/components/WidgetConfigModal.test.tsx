import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetConfigModal } from './WidgetConfigModal';
import '@testing-library/jest-dom';

describe('WidgetConfigModal (audit_log)', () => {
  const baseWidget = {
    id: 'audit-1',
    type: 'audit_log',
    title: 'Audit Log',
    layout: { x: 0, y: 0, w: 4, h: 4 },
    data: { config: { columns: ['timestamp', 'event_type'], view: 'table' } },
  };
  const onSave = jest.fn();
  const onClose = jest.fn();

  it('renders modal with audit_log config fields', () => {
    render(
      <WidgetConfigModal
        isOpen={true}
        onClose={onClose}
        widget={baseWidget}
        onSave={onSave}
      />
    );
    expect(screen.getByText(/Edit Widget Settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Columns/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Audit log view/i)).toBeInTheDocument();
  });

  it('allows selecting columns', () => {
    render(
      <WidgetConfigModal
        isOpen={true}
        onClose={onClose}
        widget={baseWidget}
        onSave={onSave}
      />
    );
    const checkbox = screen.getByLabelText(/User Id/i);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('allows changing view', () => {
    render(
      <WidgetConfigModal
        isOpen={true}
        onClose={onClose}
        widget={baseWidget}
        onSave={onSave}
      />
    );
    const select = screen.getByLabelText(/Audit log view/i);
    fireEvent.change(select, { target: { value: 'timeline' } });
    expect(select).toHaveValue('timeline');
  });

  it('calls onSave with updated config', () => {
    render(
      <WidgetConfigModal
        isOpen={true}
        onClose={onClose}
        widget={baseWidget}
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getByText(/Save/i));
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onClose on cancel', () => {
    render(
      <WidgetConfigModal
        isOpen={true}
        onClose={onClose}
        widget={baseWidget}
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(onClose).toHaveBeenCalled();
  });

  it('is accessible with labels and buttons', () => {
    render(
      <WidgetConfigModal
        isOpen={true}
        onClose={onClose}
        widget={baseWidget}
        onSave={onSave}
      />
    );
    expect(screen.getByText(/Edit Widget Settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Columns/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Audit log view/i)).toBeInTheDocument();
  });
});
