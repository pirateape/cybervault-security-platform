import React, { useState } from 'react';
import {
  RuleVersionHistoryPanel,
  RuleVersion,
} from './RuleVersionHistoryPanel';
import { StoryObj, Meta } from '@storybook/react';

const sampleVersions: RuleVersion[] = [
  {
    id: 1,
    rule_id: 1,
    version: 1,
    content: { minLength: 8, requireSpecial: false },
    created_at: new Date(Date.now() - 2000000).toISOString(),
    created_by: 'user1234',
  },
  {
    id: 2,
    rule_id: 1,
    version: 2,
    content: { minLength: 12, requireSpecial: true },
    created_at: new Date(Date.now() - 1000000).toISOString(),
    created_by: 'user5678',
  },
];

const meta: Meta<typeof RuleVersionHistoryPanel> = {
  title: 'Rule Management/RuleVersionHistoryPanel',
  component: RuleVersionHistoryPanel,
  argTypes: {
    versions: { control: 'object' },
    loading: { control: 'boolean' },
    error: { control: 'text' },
    restoring: { control: 'boolean' },
    restoreError: { control: 'text' },
    canEdit: { control: 'boolean' },
    selectedRuleContent: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof RuleVersionHistoryPanel>;

export const Default: Story = {
  render: (args) => {
    const [viewVersion, setViewVersion] = useState<RuleVersion | null>(null);
    return (
      <RuleVersionHistoryPanel
        {...args}
        viewVersion={viewVersion}
        setViewVersion={setViewVersion}
        onRestore={() => {}}
      />
    );
  },
  args: {
    versions: sampleVersions,
    loading: false,
    error: '',
    restoring: false,
    restoreError: '',
    canEdit: true,
    selectedRuleContent: JSON.stringify(
      { minLength: 16, requireSpecial: true },
      null,
      2
    ),
  },
};

export const Loading: Story = {
  render: (args) => {
    const [viewVersion, setViewVersion] = useState<RuleVersion | null>(null);
    return (
      <RuleVersionHistoryPanel
        {...args}
        viewVersion={viewVersion}
        setViewVersion={setViewVersion}
        onRestore={() => {}}
      />
    );
  },
  args: {
    versions: [],
    loading: true,
    error: '',
    restoring: false,
    restoreError: '',
    canEdit: false,
    selectedRuleContent: '',
  },
};

export const Error: Story = {
  render: (args) => {
    const [viewVersion, setViewVersion] = useState<RuleVersion | null>(null);
    return (
      <RuleVersionHistoryPanel
        {...args}
        viewVersion={viewVersion}
        setViewVersion={setViewVersion}
        onRestore={() => {}}
      />
    );
  },
  args: {
    versions: [],
    loading: false,
    error: 'Failed to load version history',
    restoring: false,
    restoreError: '',
    canEdit: false,
    selectedRuleContent: '',
  },
};
