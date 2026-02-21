/**
 * @fileoverview Step-by-step process section for the "How It Works" page
 * @source boombox-10.0/src/app/components/howitworks/howitworksstepsection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays the 4-step Boombox storage process (Request, Pack, Store, Deliver) in a vertical timeline layout.
 * Features a visual timeline with connecting lines and step indicators.
 * Each step includes a step number badge, title, description, and optimized image.
 * Responsive design adapts from vertical mobile to horizontal desktop layout.
 *
 * API ROUTES UPDATED:
 * - None (presentation component, no API calls)
 *
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary for timeline lines and step badges
 * - Replaced bg-zinc-950 with bg-primary for step dots
 * - Applied semantic text colors (text-text-primary, text-primary)
 * - Used consistent design system spacing and responsive patterns
 *
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image component for images
 * - Using placeholder.jpg as temporary image source
 * - Configured with lazy loading for below-the-fold images
 * - Set responsive aspect ratios (landscape 4:3)
 * - Added descriptive alt text for each step for SEO and accessibility
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added proper heading hierarchy (h2 for step titles)
 * - Added semantic HTML structure with ordered list for steps
 * - Added ARIA labels for timeline visualization
 * - Proper keyboard navigation support
 * - Screen reader friendly step indicators
 *
 * @refactor Migrated to features/howitworks with design system compliance, Next.js Image, and enhanced accessibility
 */

'use client';

import React from 'react';
import Image from 'next/image';

export interface Step {
  /**
   * Step number in the process (1-4)
   */
  stepNumber: number;

  /**
   * Step title
   */
  title: string;

  /**
   * Step description text
   */
  description: string;

  /**
   * Optional image for the step
   */
  image?: string;

  /**
   * Alt text for the image
   */
  imageAlt?: string;
}

export interface HowItWorksStepSectionProps {
  /**
   * Array of steps to display (defaults to standard 4-step process)
   */
  steps?: Step[];

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

const defaultSteps: Step[] = [
  {
    stepNumber: 1,
    title: 'Request',
    description:
      "Book online. We'll arrive when and where you need us. Get a storage unit delivered to your door at the push of a button. Storage has never been this simple.",
    image: '/howitworks/step-1-union-roast.png',
    imageAlt:
      'Customer booking Boombox storage online - request delivery service',
  },
  {
    stepNumber: 2,
    title: 'Pack',
    description:
      'Save money by packing your storage unit or hire a local pro. You can pack the unit yourself or we can match you with a local pro to help with the heavy lifting.',
    image: '/howitworks/step-2-pierce.png',
    imageAlt:
      'Packing belongings into Boombox storage unit with professional help',
  },
  {
    stepNumber: 3,
    title: 'Store',
    description:
      "We'll transport your storage unit to our secure facility. Just sit back and relax, as our friendly Boombox driver delivers your Boombox to our 24/7 monitored facility",
    image: '/placeholder.jpg',
    imageAlt: 'Boombox driver transporting storage unit to secure facility',
  },
  {
    stepNumber: 4,
    title: 'Deliver',
    description:
      "Need to access your storage unit? We'll deliver right to your door. It's self storage that comes to you. If you need to grab a box or add a couple items simply request your unit back and we'll deliver it right to your door.",
    image: '/placeholder.jpg',
    imageAlt: 'Boombox storage unit being delivered back to customer location',
  },
];

/**
 * HowItWorksStepSection component
 * Displays the 4-step Boombox process with timeline visualization
 */
export function HowItWorksStepSection({
  steps = defaultSteps,
  className,
}: HowItWorksStepSectionProps) {
  return (
    <section
      className={`md:flex mt-10 lg:px-16 px-6 mb-24 sm:mb-48 ${className || ''}`}
      aria-label="How Boombox works process"
    >
      <div className="relative">
        {/* Timeline vertical line */}
        <div
          className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-surface-tertiary"
          aria-hidden="true"
        />

        {/* Timeline bottom horizontal line */}
        <div
          className="absolute left-0 bottom-0 w-4 h-0.5 bg-surface-tertiary"
          aria-hidden="true"
        />

        {/* Steps list */}
        <ol className="space-y-24 list-none">
          {steps.map((step, index) => (
            <li key={step.stepNumber} className="relative flex">
              {/* Timeline dot */}
              <div className="flex flex-col items-center pr-6">
                <div
                  className="w-4 h-4 bg-primary rounded-full z-10"
                  aria-hidden="true"
                />
              </div>

              {/* Step content */}
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-8 w-full">
                {/* Step image */}
                <div className="relative w-full sm:w-72 md:w-96 aspect-[4/3] shrink-0 rounded-md overflow-hidden">
                  <Image
                    src={step.image || '/placeholder.jpg'}
                    alt={
                      step.imageAlt ||
                      `${step.title} - Boombox storage process step ${step.stepNumber}`
                    }
                    fill
                    className="object-cover rounded-md"
                    loading="lazy"
                    quality={85}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 288px, 384px"
                  />
                </div>

                {/* Step text content */}
                <div>
                  <span
                    className="inline-block bg-surface-tertiary py-2.5 px-4 rounded-full text-primary"
                    aria-label={`Step ${step.stepNumber} of ${steps.length}`}
                  >
                    Step {step.stepNumber}
                  </span>
                  <h2 className="mt-2 text-text-primary">{step.title}</h2>
                  <p className="mt-2 text-text-primary">{step.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
