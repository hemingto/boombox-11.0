import type { MetadataRoute } from 'next';
import { BlogService } from '@/lib/services/blogService';
import { SERVED_CITIES } from '@/data/locations';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://boomboxstorage.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/storage-unit-prices`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    { url: `${baseUrl}/get-quote`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/locations`, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${baseUrl}/how-it-works`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/packing-supplies`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/storage-calculator`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    { url: `${baseUrl}/insurance`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    {
      url: `${baseUrl}/help-center`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    { url: `${baseUrl}/careers`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/checklist`, changeFrequency: 'monthly', priority: 0.5 },
    {
      url: `${baseUrl}/holiday-storage`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/commercial-storage`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/archival-storage`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/moving-and-storage`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/storage-guidelines`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/vehicle-requirements`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/driver-sign-up`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${baseUrl}/sitemap`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogSlugs = await BlogService.getAllPublishedSlugs();
    blogPages = blogSlugs.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    // DB may be unavailable during build; skip blog posts gracefully
  }

  const locationPages: MetadataRoute.Sitemap = SERVED_CITIES.map(city => ({
    url: `${baseUrl}${city.href}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...locationPages];
}
