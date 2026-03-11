import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { LocationPageService } from '@/lib/services/locationPageService';
import {
  LocationAboutSection,
  NearbyLocationsSection,
} from '@/components/features/locations';
import {
  HeroSection,
  HowItWorksSection,
  WhatFitsSection,
  CustomerReviewSection,
  SecuritySection,
  FaqSection,
  HelpCenterSection,
} from '@/components/features/landing';
import {
  generateLocationPageSchema,
  generateBreadcrumbSchema,
  generateStructuredDataScript,
} from '@/lib/seo/structured-data';
import { SITE_CONFIG } from '@/lib/seo/metadata';

interface LocationSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await LocationPageService.getAllPublishedSlugs();
  return slugs.map(loc => ({ slug: loc.slug }));
}

export async function generateMetadata({
  params,
}: LocationSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = await LocationPageService.getPublishedBySlug(slug);

  if (!location) {
    return {
      title: 'Location Not Found',
      description: 'The requested location page could not be found.',
    };
  }

  const title =
    location.metaTitle || `${location.city} Storage Units, Delivered | Boombox`;
  const description =
    location.metaDescription ||
    `Professional mobile storage and moving services in ${location.city}, ${location.state}. Storage units delivered to your door. Get a free quote today.`;
  const imageUrl =
    location.ogImageUrl || location.heroImageUrl || '/img/og-image.png';
  const url = `/locations/${location.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Boombox storage in ${location.city}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}${url}`,
    },
  };
}

export default async function LocationSlugPage({
  params,
}: LocationSlugPageProps) {
  const { slug } = await params;
  const location = await LocationPageService.getPublishedBySlug(slug);

  if (!location) {
    notFound();
  }

  const nearbyLocationSlugs =
    (location.nearbyLocationSlugs as string[] | null) ?? [];

  let nearbyLocations: {
    slug: string;
    city: string;
    heroImageUrl: string | null;
    heroImageAlt: string | null;
  }[] = [];
  if (nearbyLocationSlugs.length > 0) {
    const nearby =
      await LocationPageService.getBySlugsBatch(nearbyLocationSlugs);
    nearbyLocations = nearby.map(loc => ({
      slug: loc.slug,
      city: loc.city,
      heroImageUrl: loc.heroImageUrl,
      heroImageAlt: loc.heroImageAlt,
    }));
  }

  const locationSchema = generateLocationPageSchema({
    city: location.city,
    state: location.state,
    zipCode: location.zipCode ?? undefined,
    slug: location.slug,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Locations', url: '/locations' },
    { name: location.city, url: `/locations/${location.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredDataScript(locationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredDataScript(breadcrumbSchema),
        }}
      />

      <HeroSection
        title={`${location.city} storage units, delivered.`}
        buttontext="Get Quote"
        imageSrc={location.heroImageUrl || `/locations/${location.slug}.png`}
        imageAlt={
          location.heroImageAlt || `Boombox mobile storage in ${location.city}`
        }
      />

      <LocationAboutSection
        city={location.city}
        aboutContent={location.aboutContent}
        aboutContentTwo={location.aboutContentTwo}
        imageSrc={location.aboutImageUrl}
        imageAlt={location.aboutImageAlt}
      />

      <HowItWorksSection />

      <WhatFitsSection />

      <CustomerReviewSection />

      <SecuritySection heading={`${location.city} storage you can trust`} />

      <NearbyLocationsSection
        currentCity={location.city}
        nearbyLocations={nearbyLocations}
      />

      <FaqSection />

      <HelpCenterSection />
    </>
  );
}
