import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof SkeletonLoader> = {
  title: 'Rule Management/SkeletonLoader',
  component: SkeletonLoader,
  argTypes: {
    className: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof SkeletonLoader>;

export const Default: Story = {
  args: {
    className: '',
  },
};

export const Custom: Story = {
  args: {
    className: 'h-8 w-32',
  },
};
