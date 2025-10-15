import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-links',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Define all Node.js-specific packages that should be excluded from browser bundle
    const nodePackages = [
      'twilio',
      'https-proxy-agent',
      'http-proxy-agent',
      'agent-base',
      'fs',
      'path',
      'crypto',
      'stream',
      'buffer',
      'util',
      'events',
      'url',
      'querystring',
      'http',
      'https',
      'net',
      'tls',
      'os',
      'child_process',
      'cluster',
      'worker_threads',
      'perf_hooks',
      'dns',
      'readline',
      'repl',
      'tty',
      'dgram',
      'vm',
      'async_hooks',
      'inspector',
      'punycode',
      'domain',
      'assert',
      'constants',
      'module',
      'v8',
      'zlib',
      'process',
    ];

    // Exclude Node.js packages from being bundled
    config.define = {
      ...config.define,
      global: 'globalThis',
    };

    // Configure optimizeDeps to exclude Node.js packages
    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [...(config.optimizeDeps?.exclude || []), ...nodePackages],
    };

    // Add externals for server-side packages
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        external: (id: string) => {
          // Check if the id is a Node.js package that should be external
          return nodePackages.some(pkg => id === pkg || id.startsWith(pkg + '/'));
        },
      },
    };

    // Resolve aliases to prevent server-side imports
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        // Provide empty modules for server-side packages
        'twilio': './.storybook/stubs/empty.js',
        'https-proxy-agent': './.storybook/stubs/empty.js',
        'http-proxy-agent': './.storybook/stubs/empty.js',
        'agent-base': './.storybook/stubs/empty.js',
      },
    };

    return config;
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  staticDirs: ['../public'],
  features: {
    experimentalRSC: true,
  },
};

export default config;