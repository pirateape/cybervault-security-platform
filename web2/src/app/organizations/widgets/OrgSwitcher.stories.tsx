import React from 'react';
import { OrgSwitcher } from './OrgSwitcher';
import type { StoryFn } from '@storybook/react';

export default {
  title: 'Organizations/OrgSwitcher',
  component: OrgSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'OrgSwitcher is a modular, multi-tenant organization switcher widget. Use userId/currentOrgId props to scope to the current user/tenant. Supports RBAC and extensibility.'
      }
    }
  },
  argTypes: {
    userId: { control: 'text', defaultValue: 'user-abc' },
    currentOrgId: { control: 'text', defaultValue: 'org-123' }
  }
};

const Template: StoryFn<typeof OrgSwitcher> = (args) => (
  <div className="max-w-md mx-auto p-8 bg-base-200 rounded-xl shadow-lg">
    <OrgSwitcher {...args} onSwitch={() => {}} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  userId: 'user-abc',
  currentOrgId: 'org-123'
}; 