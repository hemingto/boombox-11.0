import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://boomboxstorage.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/customer/',
          '/service-provider/',
          '/login',
          '/admin/login',
          '/admin/signup',
          '/driver-signup',
          '/driver-accept-invite',
          '/mover-signup',
          '/tracking/',
          '/feedback/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
