import React from 'react';
import ToastProvider, { useToast } from './ToastProvider';
import { StoryObj, Meta } from '@storybook/react';

const meta: Meta<typeof ToastProvider> = {
  title: 'Rule Management/ToastProvider',
  component: ToastProvider,
};
export default meta;

type Story = StoryObj<typeof ToastProvider>;

export const Default: Story = {
  render: () => {
    const ToastDemo = () => {
      const toast = useToast();
      return (
        <button
          className="btn btn-primary"
          onClick={() => toast('Hello from Toast!', 'success')}
        >
          Show Toast
        </button>
      );
    };
    return (
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>
    );
  },
};
