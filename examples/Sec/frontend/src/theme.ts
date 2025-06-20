import { extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },

  colors: {
    brand: {
      50: '#e0f7fa',
      100: '#b2ebf2',
      200: '#80deea',
      300: '#4dd0e1',
      400: '#26c6da',
      500: '#00bcd4',
      600: '#00acc1',
      700: '#0097a7',
      800: '#00838f',
      900: '#006064',
    },
    accent: {
      50: '#f5f3ff',
      100: '#ede7fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8c5af7',
      600: '#7e3af2',
      700: '#6b21a8',
      800: '#581c87',
      900: '#47126b',
    },
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
      a: {
        color: 'brand.400',
        _hover: {
          textDecoration: 'underline',
        },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'md',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0, 188, 212, 0.3)',
        },
        transition: 'all 0.2s ease',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.100',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'gray.800',
          borderRadius: 'lg',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
          border: '1px solid',
          borderColor: 'gray.700',
          _hover: {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 188, 212, 0.2)',
          },
          transition: 'all 0.3s ease',
        },
      },
    },
  },
});

export default theme;
