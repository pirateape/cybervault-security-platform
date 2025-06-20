import React from 'react';
import { Provider } from './Provider';
import { Box, Button, Text } from '@chakra-ui/react';

const ThemeDemo: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" gap={6} alignItems="stretch" p={8} minHeight="100vh" bg="bg.DEFAULT">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="2xl" fontWeight="bold" color="brand.fg">
          Theme System Demo (static mode)
        </Text>
        <Button colorScheme="brand" disabled>
          Toggle Dark/Light (not available)
        </Button>
      </Box>
      <Box p={6} borderRadius="lg" bg="brand.solid" color="brand.contrast">
        Brand Solid Box
      </Box>
      <Box p={6} borderRadius="lg" bg="bg.subtle" color="fg.DEFAULT" border="1px solid" borderColor="border.DEFAULT">
        Subtle Background Box
      </Box>
      <Button colorScheme="brand">Brand Button</Button>
      <Button colorScheme="accent">Accent Button</Button>
      <Text color="fg.muted">Muted Foreground Text</Text>
    </Box>
  );
};

export default {
  title: 'UI/Theme System',
  component: ThemeDemo,
  decorators: [
    (Story: any) => <Provider>{<Story />}</Provider>,
  ],
};

export const ThemeSystem = () => <ThemeDemo />; 