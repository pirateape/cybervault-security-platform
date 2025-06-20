import React, { useState } from 'react';
import RuleEditorPanel from './RuleEditorPanel';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof RuleEditorPanel> = {
  title: 'Rule Management/RuleEditorPanel',
  component: RuleEditorPanel,
  argTypes: {
    value: { control: 'text' },
    language: { control: 'text' },
    theme: { control: 'radio', options: ['vs-dark', 'light'] },
    height: { control: 'text' },
    readOnly: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof RuleEditorPanel>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(
      args.value || '{\n  "minLength": 12,\n  "requireSpecial": true\n}'
    );
    return <RuleEditorPanel {...args} value={value} onChange={setValue} />;
  },
  args: {
    language: 'json',
    theme: 'vs-dark',
    height: 400,
    readOnly: false,
  },
};

export const ReadOnly: Story = {
  render: (args) => {
    return (
      <RuleEditorPanel
        {...args}
        value={
          args.value || '{\n  "minLength": 12,\n  "requireSpecial": true\n}'
        }
        onChange={() => {}}
        readOnly
      />
    );
  },
  args: {
    language: 'json',
    theme: 'light',
    height: 400,
    readOnly: true,
  },
};
