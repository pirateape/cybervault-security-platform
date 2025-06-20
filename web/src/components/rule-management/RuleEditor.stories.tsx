import React, { useState } from 'react';
import { RuleEditor } from './RuleEditor';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof RuleEditor> = {
  title: 'Rule Management/RuleEditor',
  component: RuleEditor,
  argTypes: {
    value: { control: 'text' },
    language: { control: 'text' },
    theme: { control: 'radio', options: ['vs-dark', 'light'] },
    readOnly: { control: 'boolean' },
    collaborative: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof RuleEditor>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(
      args.value || '{\n  "minLength": 12,\n  "requireSpecial": true\n}'
    );
    return <RuleEditor {...args} value={value} onChange={setValue} />;
  },
  args: {
    language: 'json',
    theme: 'vs-dark',
    readOnly: false,
    collaborative: false,
  },
};

export const ReadOnly: Story = {
  render: (args) => {
    return (
      <RuleEditor
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
    readOnly: true,
    collaborative: false,
  },
};
