import React from 'react';
import { TenantReports } from './TenantReports';
import type { StoryFn } from '@storybook/react';

export default {
  title: 'Organizations/TenantReports',
  component: TenantReports,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'TenantReports is a modular, multi-tenant reporting widget. Use orgId prop to scope to the current tenant. Supports RBAC and extensibility.'
      }
    }
  },
  argTypes: {
    orgId: { control: 'text', defaultValue: 'org-123' }
  }
};

const Template: StoryFn<typeof TenantReports> = (args) => (
  <div className="max-w-2xl mx-auto p-8 bg-base-200 rounded-xl shadow-lg">
    <TenantReports {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  orgId: 'org-123'
}; 