import type { Preview } from '@storybook/react';
import React, { useEffect } from 'react';
import '../src/styles.css';
import { AuthProvider } from '../../libs/hooks/authProvider';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../src/components/ui/theme';

// Wrapper component that provides ChakraProvider and AuthProvider for all stories
// AuthProvider will use real Supabase configuration from .env file
const StorybookProviders = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    ChakraProvider,
    { value: system },
    React.createElement(AuthProvider, {}, children)
  );
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { 
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: 'centered',
    a11y: { disable: false },
    viewport: {
      viewports: {
        responsive: {
          name: 'Responsive',
          styles: { width: '1200px', height: '800px' },
        },
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
      },
      defaultViewport: 'responsive',
    },
  },
  decorators: [
    // Global ChakraProvider and AuthProvider for all stories
    (Story) => React.createElement(StorybookProviders, {}, React.createElement(Story)),
    // Theme decorator
    (Story, context) => {
      // Use Storybook's globals to toggle dark mode
      useEffect(() => {
        document.documentElement.setAttribute(
          'data-theme',
          context.globals.theme === 'dark' ? 'dark' : 'light'
        );
      }, [context.globals.theme]);
      return React.createElement(Story, context);
    },
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
};

export default preview;
