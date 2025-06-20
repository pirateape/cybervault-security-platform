import React from 'react';
import { MonacoEditorWidget } from './MonacoEditorWidget';
import type { StoryFn } from '@storybook/react';

export default {
  title: 'Organizations/MonacoEditorWidget',
  component: MonacoEditorWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'MonacoEditorWidget is a modular, multi-tenant code editor widget using Monaco Editor. Use value prop to set the editor content. Supports RBAC and extensibility.'
      }
    }
  },
  argTypes: {
    value: { control: 'text', defaultValue: '// Write your rule here...' },
    language: { control: 'text', defaultValue: 'typescript' },
    theme: { control: 'radio', options: ['light', 'dark', 'system'], defaultValue: 'system' }
  }
};

const Template: StoryFn<typeof MonacoEditorWidget> = (args) => (
  <div className="max-w-2xl mx-auto p-8 bg-base-200 rounded-xl shadow-lg">
    <MonacoEditorWidget {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  value: '// Write your rule here...',
  language: 'typescript',
  theme: 'system'
}; 