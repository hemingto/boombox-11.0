/**
 * @fileoverview Next.js Configuration
 * @source boombox-10.0/next.config.mjs
 * @refactor Converted from .mjs to .ts format for TypeScript consistency
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // External packages that should not be bundled by webpack
  serverExternalPackages: ['@onfleet/node-onfleet'],

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd15p8tr8p0vffz.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
