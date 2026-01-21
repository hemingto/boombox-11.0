/**
 * @fileoverview Next.js Configuration
 * @source boombox-10.0/next.config.mjs
 * @refactor Converted from .mjs to .ts format for TypeScript consistency
 */

import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Skip ESLint during production builds (lint errors addressed separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type checking during builds (handled separately via tsc)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Onfleet integration settings
  env: {
    ONFLEET_API_KEY: process.env.ONFLEET_API_KEY,
  },

  // Performance optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'd15p8tr8p0vffz.cloudfront.net',
      },
    ],
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Bundle analyzer
    if (process.env.BUNDLE_ANALYZE) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
          analyzerPort: isServer ? 8888 : 8889,
        })
      );
    }

    return config;
  },
};

export default bundleAnalyzer(nextConfig);
