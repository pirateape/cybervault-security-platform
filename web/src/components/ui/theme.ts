import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// Brand color palette (50-950 scale)
const brand = {
  50: { value: '#e6f2ff' },
  100: { value: '#cce4ff' },
  200: { value: '#99caff' },
  300: { value: '#66afff' },
  400: { value: '#3395ff' },
  500: { value: '#007bff' },
  600: { value: '#005fcc' },
  700: { value: '#004399' },
  800: { value: '#002866' },
  900: { value: '#000c33' },
  950: { value: '#00061a' },
};

// Semantic tokens for light/dark mode
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand,
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: { _light: '{colors.white}', _dark: '#141414' } },
          subtle: { value: { _light: '{colors.gray.50}', _dark: '#1a1a1a' } },
          muted: { value: { _light: '{colors.gray.100}', _dark: '#262626' } },
        },
        fg: {
          DEFAULT: { value: { _light: '{colors.black}', _dark: '#e5e5e5' } },
          muted: { value: { _light: '{colors.gray.600}', _dark: '#a3a3a3' } },
        },
        border: {
          DEFAULT: { value: { _light: '{colors.gray.200}', _dark: '#404040' } },
        },
        accent: {
          DEFAULT: { value: { _light: '{colors.brand.500}', _dark: '{colors.brand.300}' } },
        },
        // Brand semantic tokens
        brand: {
          solid: { value: '{colors.brand.500}' },
          contrast: { value: '{colors.brand.100}' },
          fg: { value: '{colors.brand.700}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.200}' },
          emphasized: { value: '{colors.brand.300}' },
          focusRing: { value: '{colors.brand.500}' },
        },
      },
    },
  },
});

// Placeholder for tenant-specific theme overrides
// export function getTenantSystem(tenantId: string) {
//   // Merge tenant-specific tokens here
//   return createSystem(defaultConfig, config);
// }

export const system = createSystem(defaultConfig, config); 