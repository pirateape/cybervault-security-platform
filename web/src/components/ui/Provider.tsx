import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from './theme';

// TODO: Integrate ColorModeProvider or next-themes if needed for advanced color mode management
// TODO: Replace with custom system/theme when ready
// import { system } from './theme';

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ChakraProvider value={system}>{children}</ChakraProvider>
  );
};

export default Provider; 