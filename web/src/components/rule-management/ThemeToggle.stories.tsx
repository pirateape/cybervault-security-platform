import React, { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Rule Management/ThemeToggle',
  component: ThemeToggle,
  argTypes: {
    theme: { control: 'radio', options: ['vs-dark', 'light'] },
  },
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Dark: Story = {
  render: (args) => {
    const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
    return (
      <ThemeToggle
        {...args}
        theme={theme}
        onToggle={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
      />
    );
  },
};

export const Light: Story = {
  render: (args) => {
    const [theme, setTheme] = useState<'vs-dark' | 'light'>('light');
    return (
      <ThemeToggle
        {...args}
        theme={theme}
        onToggle={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
      />
    );
  },
};
