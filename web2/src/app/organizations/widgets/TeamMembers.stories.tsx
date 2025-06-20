import React from 'react';
import { TeamMembers } from './TeamMembers';
import type { StoryFn } from '@storybook/react';

export default {
  title: 'Organizations/TeamMembers',
  component: TeamMembers,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'TeamMembers is a modular, multi-tenant team member management widget. Use orgId prop to scope to the current tenant. Supports RBAC and extensibility.'
      }
    }
  },
  argTypes: {
    orgId: { control: 'text', defaultValue: 'org-123' }
  }
};

const Template: StoryFn<typeof TeamMembers> = (args) => (
  <div className="max-w-2xl mx-auto p-8 bg-base-200 rounded-xl shadow-lg">
    <TeamMembers {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  orgId: 'org-123'
}; 