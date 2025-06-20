import React from 'react';
import { PresenceBar } from './PresenceBar';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof PresenceBar> = {
  title: 'Rule Management/PresenceBar',
  component: PresenceBar,
  argTypes: {
    peers: { control: 'object' },
  },
};
export default meta;

type Story = StoryObj<typeof PresenceBar>;

export const MultiplePeers: Story = {
  args: {
    peers: ['alice', 'bob', 'carol'],
  },
};

export const SinglePeer: Story = {
  args: {
    peers: ['alice'],
  },
};
