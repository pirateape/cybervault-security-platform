import React from 'react';
import { AuditLogPanel, AuditLogEntry } from './AuditLogPanel';
import { StoryObj, Meta } from '@storybook/react';

const sampleAuditLog: AuditLogEntry[] = [
  {
    id: 1,
    user_id: 'user1234',
    event_type: 'create',
    resource: 'rule',
    outcome: 'success',
    metadata: { ip: '127.0.0.1' },
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 'user5678',
    event_type: 'update',
    resource: 'rule',
    outcome: 'success',
    metadata: { ip: '127.0.0.2' },
    created_at: new Date(Date.now() - 1000000).toISOString(),
  },
  {
    id: 3,
    user_id: 'user9999',
    event_type: 'delete',
    resource: 'rule',
    outcome: 'failure',
    metadata: { ip: '127.0.0.3' },
    created_at: new Date(Date.now() - 2000000).toISOString(),
  },
];

const meta: Meta<typeof AuditLogPanel> = {
  title: 'Rule Management/AuditLogPanel',
  component: AuditLogPanel,
  argTypes: {
    auditLog: { control: 'object' },
    loading: { control: 'boolean' },
    error: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof AuditLogPanel>;

export const Default: Story = {
  args: {
    auditLog: sampleAuditLog,
    loading: false,
    error: '',
  },
};

export const Loading: Story = {
  args: {
    auditLog: [],
    loading: true,
    error: '',
  },
};

export const Error: Story = {
  args: {
    auditLog: [],
    loading: false,
    error: 'Failed to load audit log',
  },
};
