import React, { useState } from 'react';
import { RuleSearch } from './RuleSearch';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof RuleSearch> = {
  title: 'Rule Management/RuleSearch',
  component: RuleSearch,
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof RuleSearch>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <RuleSearch {...args} value={value} onChange={setValue} />;
  },
  args: {
    placeholder: 'Search rules...',
  },
};

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState('ISO');
    return <RuleSearch {...args} value={value} onChange={setValue} />;
  },
  args: {
    placeholder: 'Search rules...',
  },
};
