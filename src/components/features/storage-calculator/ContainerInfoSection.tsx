/**
 * @fileoverview Container information section for storage calculator
 * @source boombox-10.0/src/app/components/storagecalculator/containerinfosection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays key information about Boombox storage units including dimensions,
 * construction materials, and weatherproofing features. Includes an interactive
 * modal showing exact interior and exterior dimensions.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 placeholder with OptimizedImage component
 * - Updated to use semantic color tokens (text-text-secondary, bg-surface-tertiary)
 * - Replaced InformationalPopup with Modal component (per project preference)
 * - Applied design system typography and spacing patterns
 * 
 * @refactor 
 * - Renamed from containerinfosection.tsx to ContainerInfoSection.tsx (PascalCase)
 * - Replaced custom popup with Modal component from design system
 * - Added proper image optimization with OptimizedImage component
 * - Enhanced TypeScript interfaces for better type safety
 * - Improved accessibility with ARIA labels and semantic HTML
 */

'use client';

import React, { useState } from 'react';
import { RulerIcon, StorageUnitIcon, OpenStorageUnitIcon } from '@/components/icons';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage/OptimizedImage';

interface FeatureProps {
  title: string;
  content: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

interface DimensionModalContentProps {
  onClose: () => void;
}

/**
 * Modal content component displaying interior and exterior dimensions
 */
const DimensionModalContent: React.FC<DimensionModalContentProps> = ({ onClose }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4 text-text-primary">Exact Dimensions</h2>
    <p className="text-text-secondary mb-6">
      All measurements are as accurate as possible, but should be viewed as close approximations. 
      If you are unsure if one of your items will fit please reach out at our Help Center
    </p>
    
    <div className="flex flex-col sm:flex-row gap-8 mt-10">
      {/* Interior Dimensions */}
      <div className="flex-1 border-r border-border pr-6">
        <OpenStorageUnitIcon className="w-28 h-24 mb-4 mx-auto" aria-hidden="true" />
        <h3 className="mb-4 text-lg font-semibold text-center text-text-primary">
          Interior Dimensions
        </h3>
        <ul className="text-sm space-y-2 text-text-secondary" role="list">
          <li>
            <span className="font-semibold text-text-primary">Length:</span> 95 ins. or 7ft. 11 in. (241cm)
          </li>
          <li>
            <span className="font-semibold text-text-primary">Width:</span> 56 ins. or 4ft. 8 in. (142cm)
          </li>
          <li>
            <span className="font-semibold text-text-primary">Height:</span> 83.5 ins. or 6ft. 11.5 in. (212cm)
          </li>
          <li>
            <span className="font-semibold text-text-primary">Diagonal:</span> 110 ins. or 9ft. 2 in. (280cm)
          </li>
        </ul>
      </div>

      {/* Exterior Dimensions */}
      <div className="flex-1 pl-6">
        <StorageUnitIcon className="w-24 h-24 mb-4 mx-auto" aria-hidden="true" />
        <h3 className="mb-4 text-lg font-semibold text-center text-text-primary">
          Exterior Dimensions
        </h3>
        <ul className="text-sm space-y-2 text-text-secondary" role="list">
          <li>
            <span className="font-semibold text-text-primary">Length:</span> 96 ins. or 8ft. (244cm)
          </li>
          <li>
            <span className="font-semibold text-text-primary">Width:</span> 60 ins. or 5ft. (152cm)
          </li>
          <li>
            <span className="font-semibold text-text-primary">Height:</span> 83.5 ins. or 6ft. 11.5 in. (212cm)
          </li>
          <li>
            <span className="font-semibold text-text-primary">Diagonal:</span> 90 ins. or 7ft. 6 in. (228cm)
          </li>
        </ul>
      </div>
    </div>

    <div className="mt-8 flex justify-end">
      <button
        onClick={onClose}
        className="btn-primary"
        aria-label="Close dimensions modal"
      >
        Close
      </button>
    </div>
  </div>
);

/**
 * Individual feature card component
 */
const Feature: React.FC<FeatureProps> = ({ title, content, imageSrc, imageAlt }) => (
  <article className="flex flex-col mb-10">
    <div className="w-full aspect-square mb-4">
      {imageSrc ? (
        <OptimizedImage
          src={imageSrc}
          alt={imageAlt || title}
          width={400}
          height={400}
          aspectRatio="square"
          containerClassName="w-full rounded-md"
          className="object-cover rounded-md"
          loading="lazy"
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <OptimizedImage
          src="/placeholder.jpg"
          alt={`${title} illustration`}
          width={400}
          height={400}
          aspectRatio="square"
          containerClassName="w-full rounded-md"
          className="object-cover rounded-md"
          loading="lazy"
          quality={80}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
    </div>
    <h2 className="mb-2 text-xl font-semibold text-text-primary">{title}</h2>
    <div className="text-text-secondary">{content}</div>
  </article>
);

/**
 * Main container information section component
 */
export function ContainerInfoSection() {
  const [isDimensionsModalOpen, setIsDimensionsModalOpen] = useState(false);

  const features: FeatureProps[] = [
    {
      title: 'How we measure up',
      content: (
        <>
          <p className="mb-4">
            Boomboxes are 5 ft. wide 8ft. long and 8ft. tall. That&apos;s 320 cubic feet of storage, 
            enough to store a studio apartment full of items
          </p>
          <button
            onClick={() => setIsDimensionsModalOpen(true)}
            className="flex items-center cursor-pointer text-primary hover:text-primary-hover transition-colors"
            aria-label="View exact dimensions"
          >
            <RulerIcon className="w-6 mr-2" aria-hidden="true" />
            <span className="font-semibold underline">Exact Dimensions</span>
          </button>
        </>
      ),
    },
    {
      title: 'Sturdy steel construction',
      content: 'Boomboxes are constructed out of the highest grade steel to ensure your belongings are stored safely and securely',
    },
    {
      title: 'Weatherproof',
      content: 'Boomboxes are designed to hold up against the toughest of weather conditions and are water, wind, and dust proof',
    },
  ];

  return (
    <section 
      className="lg:px-16 px-6 sm:mb-48 mb-24"
      aria-labelledby="container-info-heading"
    >
      <h1 id="container-info-heading" className="mb-10 text-3xl font-bold text-text-primary">
        Learn more about your Boombox
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <Feature key={index} {...feature} />
        ))}
      </div>

      {/* Dimensions Modal */}
      <Modal
        open={isDimensionsModalOpen}
        onClose={() => setIsDimensionsModalOpen(false)}
        size="lg"
        closeOnOverlayClick
      >
        <DimensionModalContent onClose={() => setIsDimensionsModalOpen(false)} />
      </Modal>
    </section>
  );
}

export default ContainerInfoSection;

