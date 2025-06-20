//@ts-check

import { composePlugins, withNx } from '@nx/next';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  experimental: {
    // Enable experimental features if needed
  },
  webpack: (config) => {
    // Add webpack alias for libs
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/libs': path.resolve(__dirname, '../libs'),
      '@data-access': path.resolve(__dirname, '../libs/data-access'),
      '@types': path.resolve(__dirname, '../libs/types'),
      '@ui': path.resolve(__dirname, '../libs/ui'),
      '@web2': path.resolve(__dirname, 'src'),
      'web2': path.resolve(__dirname, '.'),
    };
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);
