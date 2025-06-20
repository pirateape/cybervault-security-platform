import React from 'react';
import { CredentialManager } from './CredentialManager';
import type { StoryFn } from '@storybook/react';

export default {
  title: 'Organizations/CredentialManager',
  component: CredentialManager,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CredentialManager is a modular, multi-tenant credential management widget. It supports secure vault abstraction, RBAC, and extensibility. Use orgId prop to scope to the current tenant. All credential values are securely fetched and never exposed in logs or UI.'
      }
    }
  },
  argTypes: {
    orgId: { control: 'text', defaultValue: 'org-123' }
  }
};

const Template: StoryFn<typeof CredentialManager> = (args) => (
  <div className="max-w-2xl mx-auto p-8 bg-base-200 rounded-xl shadow-lg">
    <CredentialManager {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  orgId: 'org-123'
}; 