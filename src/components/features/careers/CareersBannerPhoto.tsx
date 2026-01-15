/**
 * @fileoverview Careers banner photo component with optimized image implementation
 * @source boombox-10.0/src/app/components/careers/careersbannerphoto.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a banner photo section for the careers page with proper image optimization
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Next.js Image with design system spacing and layout patterns
 * - Improved accessibility with proper alt text and ARIA attributes
 * 
 * @refactor Uses Next.js Image for better performance and SEO
 */

'use client';

import Image from 'next/image';

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
      <div className="relative w-full h-[500px] rounded-md overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover rounded-md"
          loading="lazy"
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
        />
      </div>
    </section>
  );
}

export default CareersBannerPhoto;
