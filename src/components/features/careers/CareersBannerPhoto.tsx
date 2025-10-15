/**
 * @fileoverview Careers banner photo component with optimized image implementation
 * @source boombox-10.0/src/app/components/careers/careersbannerphoto.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a banner photo section for the careers page with proper image optimization
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 placeholder div with OptimizedImage primitive component
 * - Uses design system spacing and layout patterns
 * - Improved accessibility with proper alt text and ARIA attributes
 * 
 * @refactor Replaced placeholder div with Next.js optimized image component for better performance and SEO
 */

'use client';

import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage';

export interface CareersBannerPhotoProps {
  /**
   * Image source URL for the banner
   */
  src?: string;
  
  /**
   * Alt text for the banner image
   */
  alt?: string;
  
  /**
   * Additional CSS classes for customization
   */
  className?: string;
}

export function CareersBannerPhoto({ 
  src = '/img/careers-banner.jpg', 
  alt = 'Boombox team working together in a collaborative environment',
  className 
}: CareersBannerPhotoProps) {
  return (
    <section className="md:flex lg:px-16 px-6 sm:mb-48 mb-24" aria-label="Careers banner section">
      <OptimizedImage
        src={src}
        alt={alt}
        containerClassName="w-full h-[500px] rounded-md"
        className="object-cover"
        aspectRatio="landscape"
        loading="lazy"
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
        fallbackSrc="/img/placeholder-careers.jpg"
        showSkeleton={true}
        skeletonClassName="bg-surface-tertiary"
      />
    </section>
  );
}

export default CareersBannerPhoto;
