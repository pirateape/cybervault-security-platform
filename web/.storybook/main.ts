import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../../libs/ui/dashboard/components/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: 'web/vite.config.ts',
      },
    },
  },
  viteFinal: (config) => {
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      '@nivo/bar',
      '@nivo/line',
      '@nivo/pie',
      '@nivo/core',
      '@nivo/axes',
      '@nivo/colors',
      '@nivo/legends',
      '@nivo/text',
      '@nivo/theming',
      '@nivo/tooltip',
      'd3-scale',
      'd3-shape',
      'd3-format',
      'd3-time',
      'd3-time-format',
      'd3-array',
      'd3-color',
      'd3-interpolate',
      'd3-path',
      'd3-hierarchy',
      'd3-geo',
      'd3-selection',
      'd3-transition',
      'd3-dsv',
      'd3-fetch',
      'd3-force',
      'd3-random',
      'd3-drag',
      'd3-zoom',
      'd3-brush',
      'd3-chord',
      'd3-dispatch',
      'd3-ease',
      'd3-quadtree',
      'd3-timer',
      'd3-voronoi',
      'd3-polygon',
      'd3-scale-chromatic',
    ];
    return config;
  },
};

export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
