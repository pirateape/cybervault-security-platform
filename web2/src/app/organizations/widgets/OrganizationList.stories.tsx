import React from 'react';
import { OrganizationList } from './OrganizationList';
import type { StoryFn } from '@storybook/react';

export default {
  title: 'Organizations/OrganizationList',
  component: OrganizationList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'OrganizationList is a modular, multi-tenant organization list widget. Use userId prop to scope to the current user. Supports RBAC and extensibility.'
      }
    }
  },
  argTypes: {
    userId: { control: 'text', defaultValue: 'user-abc' }
  }
};

const Template: StoryFn<typeof OrganizationList> = (args) => (
  <div className="max-w-2xl mx-auto p-8 bg-base-200 rounded-xl shadow-lg">
    <OrganizationList {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  userId: 'user-abc'
}; 