import React, { useState } from 'react';
import { RuleDeleteConfirm } from './RuleDeleteConfirm';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof RuleDeleteConfirm> = {
  title: 'Rule Management/RuleDeleteConfirm',
  component: RuleDeleteConfirm,
  argTypes: {
    open: { control: 'boolean' },
    message: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof RuleDeleteConfirm>;

export const Open: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <RuleDeleteConfirm
        {...args}
        open={open}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    );
  },
  args: {
    message: 'Are you sure you want to delete this rule?',
  },
};

export const Closed: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <RuleDeleteConfirm
        {...args}
        open={open}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    );
  },
  args: {
    message: 'Are you sure you want to delete this rule?',
  },
};
