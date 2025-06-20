import React from 'react';
import { RuleListWidget } from './RuleListWidget';
import type { StoryFn } from '@storybook/react';

export default {
  title: 'Organizations/RuleListWidget',
  component: RuleListWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'RuleListWidget is a modular, multi-tenant rule management widget. Use orgId prop to scope to the current tenant. Supports RBAC and extensibility.'
      }
    }
  },
  argTypes: {
    orgId: { control: 'text', defaultValue: 'org-123' }
  }
};

const Template: StoryFn<typeof RuleListWidget> = (args) => (
  <div className="max-w-2xl mx-auto p-8 bg-base-200 rounded-xl shadow-lg">
    <RuleListWidget {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  orgId: 'org-123'
}; 