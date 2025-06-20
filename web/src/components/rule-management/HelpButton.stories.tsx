import React, { useState } from 'react';
import { HelpButton } from './HelpButton';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof HelpButton> = {
  title: 'Rule Management/HelpButton',
  component: HelpButton,
};
export default meta;

type Story = StoryObj<typeof HelpButton>;

export const Default: Story = {
  render: () => <HelpButton />,
};

export const Open: Story = {
  render: () => {
    // Simulate open state by clicking the button after mount
    const [mounted, setMounted] = useState(false);
    React.useEffect(() => {
      setMounted(true);
    }, []);
    return <HelpButton />; // User can click to open
  },
};
