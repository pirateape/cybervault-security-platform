import React from 'react';
import { RuleList } from './RuleList';
import { StoryObj, Meta } from '@storybook/react';

const sampleRules = [
  { id: 1, name: 'NIST Password Policy', content: '{ "minLength": 12 }' },
  { id: 2, name: 'ISO27001 Encryption', content: '{ "encryption": "AES256" }' },
  { id: 3, name: 'GDPR Data Retention', content: '{ "retention": 365 }' },
];

const meta: Meta<typeof RuleList> = {
  title: 'Rule Management/RuleList',
  component: RuleList,
  argTypes: {
    rules: { control: 'object' },
    selectedRuleId: { control: 'number' },
    loading: { control: 'boolean' },
    deletingId: { control: 'number' },
  },
};
export default meta;

type Story = StoryObj<typeof RuleList>;

export const Default: Story = {
  args: {
    rules: sampleRules,
    selectedRuleId: 1,
    onSelect: () => {},
    onDelete: () => {},
    canDelete: () => true,
    loading: false,
    deletingId: null,
  },
};

export const Loading: Story = {
  args: {
    rules: [],
    selectedRuleId: null,
    onSelect: () => {},
    onDelete: () => {},
    canDelete: () => false,
    loading: true,
    deletingId: null,
  },
};
