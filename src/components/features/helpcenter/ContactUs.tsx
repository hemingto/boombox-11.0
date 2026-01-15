/**
 * @fileoverview Help Center contact information component
 * @source boombox-10.0/src/app/components/helpcenter/helpcentercontactus.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays contact information card with image, heading, and contact details.
 * Shows phone number and email address with icons for easy access.
 * 
 * DESIGN SYSTEM UPDATES:
 * - bg-slate-100 → bg-surface-tertiary (semantic background color)
 * - text-zinc-950 → text-primary (semantic text color)
 * - Applied consistent spacing using design system tokens
 * - Used semantic HTML elements (section, address)
 * 
 * IMAGE OPTIMIZATION:
 * - Updated Next.js Image component from deprecated layout="fill" to fill prop
 * - Replaced objectFit="cover" with object-fit style
 * - Added proper sizes attribute for responsive images
 * - Maintained aspect ratio with responsive design
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added semantic HTML structure (section, address)
 * - Proper heading hierarchy (h2)
 * - Added ARIA labels for contact methods
 * - Added aria-hidden to decorative icons
 * - Clickable phone and email links with proper href
 * - Descriptive alt text for contact image
 * 
 * @refactor Refactored with design system compliance, enhanced accessibility, and Next.js 15 image optimization
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

export interface ContactUsProps {
  /**
   * Main heading text
   * @default 'Need to get in touch?'
   */
  title?: string;

  /**
   * Subtitle text
   * @default 'No problem! Contact our support team'
   */
  subtitle?: string;

  /**
   * Phone number to display
   * @default '415-322-3135'
   */
  phone?: string;

  /**
   * Email address to display
   * @default 'help@boomboxstorage.com'
   */
  email?: string;

  /**
   * Image source path
   * @default '/img/berkeley.png'
   */
  imageSrc?: string;

  /**
   * Image alt text
   * @default 'Contact Us customer service representative'
   */
  imageAlt?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Whether to show the contact image
   * @default true
   */
  showImage?: boolean;
}

/**
 * ContactUs Component
 * 
 * Displays a contact information card with image and contact details.
 * Implements WCAG 2.1 AA accessibility standards with proper semantic HTML.
 */
export function ContactUs({
  title = 'Need to get in touch?',
  subtitle = 'No problem! Contact our support team',
  phone = '415-322-3135',
  email = 'help@boomboxstorage.com',
  imageSrc = '/berkeley.png',
  imageAlt = 'Contact Us customer service representative',
  className,
  showImage = true,
}: ContactUsProps) {
  return (
    <section 
      className={cn('flex bg-surface-tertiary py-12', className)}
      aria-label="Contact information"
    >
      <div className="flex flex-col sm:flex-row bg-white w-full h-full sm:min-h-[300px] rounded-md place-content-center m-12">
          {showImage && (
            <div className="relative sm:w-2/5 w-full aspect-video overflow-hidden rounded-tr-md sm:rounded-tr-none rounded-tl-md sm:rounded-bl-md">
            <Image 
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 40vw"
              priority
            />
          </div>
          )}
        <div className={cn(
          'flex flex-col items-center justify-center p-8 sm:p-6 mx-auto',
          showImage ? 'w-full sm:w-3/5' : 'w-full'
        )}>
          <div>
            <h2 className="mb-1">{title}</h2>
            <p className="mt-1 mb-8 text-text-primary">
              {subtitle}
            </p>
            
            <address className="not-italic">
              {/* Phone contact */}
              <div className="flex gap-4 mb-2">
                <PhoneIcon 
                  className="h-6 w-6 text-primary flex-shrink-0" 
                  aria-hidden="true"
                />
                <a 
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="text-text-primary"
                  aria-label={`Call us at ${phone}`}
                >
                  {phone}
                </a>
              </div>
              
              {/* Email contact */}
              <div className="flex gap-4 mb-1">
                <EnvelopeIcon 
                  className="h-6 w-6 text-primary flex-shrink-0" 
                  aria-hidden="true"
                />
                <a 
                  href={`mailto:${email}`}
                  className="text-text-primary"
                  aria-label={`Email us at ${email}`}
                >
                  {email}
                </a>
              </div>
            </address>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactUs;

