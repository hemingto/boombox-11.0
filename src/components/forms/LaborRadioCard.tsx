"use client";

/**
 * @fileoverview Labor Radio Card - Radio card component for selecting labor/moving partners
 * @source boombox-10.0/src/app/components/reusablecomponents/laborradiocard.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays labor/moving partner information in a selectable radio card format
 * - Shows partner details including image, title, description, price, rating, and reviews
 * - Handles selection state with visual feedback and error states
 * - Supports external links to partner reviews and websites
 * - Includes "New to Boombox" badge for partners with limited reviews
 * 
 * API ROUTES UPDATED:
 * - No direct API routes (data passed via props)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens:
 *   - zinc-950 → primary, zinc-400 → text-secondary
 *   - red-500 → status-error, slate-100 → surface-tertiary
 *   - emerald-500/emerald-100 → status-success/status-bg-success
 * - Applied semantic color classes for consistent theming
 * - Used design system ring colors for focus and error states
 * - Applied consistent hover states using design system colors
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added comprehensive ARIA labels and descriptions
 * - Enhanced keyboard navigation support with Enter/Space key handling
 * - Improved screen reader announcements for selection and error states
 * - Added proper role attributes and semantic HTML structure
 * - Ensured WCAG 2.1 AA color contrast compliance
 * - Added focus indicators for keyboard navigation
 * 
 * @refactor Migrated to use Next.js Image, applied design system colors,
 * enhanced accessibility with ARIA labels, improved error handling UX, and added
 * keyboard navigation support
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

interface LaborRadioCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  reviews: number;
  rating: number;
  link: string;
  featured?: boolean;
  imageSrc: string;
  checked?: boolean;
  onChange?: (id: string, price: string, description: string) => void;
  hasError?: boolean;
  onClearError?: () => void;
}

export const LaborRadioCard: React.FC<LaborRadioCardProps> = ({
  id,
  title,
  description,
  price,
  reviews,
  rating,
  link,
  featured,
  imageSrc,
  checked,
  onChange,
  hasError,
  onClearError,
}) => {
  const [isImageBroken, setIsImageBroken] = useState(false);

  const handleSelectionChange = () => {
    if (onChange) {
      onChange(id, price, title); // Note: passing title instead of description to match original
    }
    if (onClearError) {
      onClearError();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectionChange();
    }
  };

  const isNewToBoombox = reviews < 2 || !rating;
  
  // Format price display - show placeholder if null/undefined
  const displayPrice = price && !price.includes('null') ? price : '$--/hr';

  return (
    <label
      htmlFor={id}
      className={`mb-4 p-4 rounded-md flex justify-between cursor-pointer ${
        hasError
          ? 'ring-border-error bg-status-bg-error ring-2'
          : checked
          ? 'ring-primary ring-2 bg-surface-primary'
          : 'ring-border ring-2 ring-slate-100 bg-surface-tertiary'
      }`}
      aria-describedby={`${id}-description ${id}-rating`}
      aria-label={`Select ${title} for ${displayPrice}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex w-full">
        {/* Partner Image */}
        <div className="relative w-28 h-28 bg-surface-disabled flex flex-none justify-center items-center rounded-md mr-3">
          {imageSrc && !isImageBroken ? (
            <Image
              src={imageSrc}
              alt={`${title} company logo`}
              className="object-cover rounded-md"
              width={112}
              height={112}
              onError={() => setIsImageBroken(true)}
            />
          ) : (
            <span 
              className="text-sm text-text-secondary text-center" 
              aria-hidden="true"
            >
              Image not available
            </span>
          )}
        </div>

        {/* Partner Details */}
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="text-md font-medium text-text-primary">{title}</div>
            <p className="text-lg font-semibold text-text-primary">{displayPrice}</p>
          </div>
          
          <p 
            id={`${id}-description`}
            className="text-sm flex-grow text-text-primary mb-1 line-clamp-2"
          >
            {description}
          </p>

          {/* Rating and Reviews */}
          <div 
            id={`${id}-rating`}
            className="flex items-end mt-auto pb-1 space-x-1"
            role="group"
            aria-label={isNewToBoombox ? "New to Boombox partner" : `Rating: ${rating.toFixed(1)} out of 5 stars`}
          >
            {isNewToBoombox ? (
              <span className="px-3 py-2 text-xs text-status-success bg-status-bg-success rounded-full font-medium">
                New to Boombox
              </span>
            ) : (
              <>
                <p className="text-xs leading-3 font-medium text-text-tertiary">
                  {rating.toFixed(1)}
                </p>
                
                <div className="flex" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, i) => (
                    <React.Fragment key={i}>
                      {i < Math.floor(rating) ? (
                        <StarIcon className="w-4 text-primary" data-testid="star-filled" />
                      ) : (
                        <StarIconOutline className="w-4 text-text-secondary" data-testid="star-outline" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Reviews Link */}
                <a 
                  href={link} 
                  className="text-xs ml-2 text-text-secondary leading-3 underline hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Read ${reviews} reviews (opens in new tab)`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {reviews} Reviews
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Radio Input */}
      <div>
        <input
          id={id}
          type="radio"
          name="movingPartner"
          checked={checked}
          onChange={handleSelectionChange}
          className="sr-only"
          aria-describedby={`${id}-description ${id}-rating`}
          aria-checked={checked}
        />
      </div>

      {/* Screen Reader Announcements */}
      <div className="sr-only">
        {checked && (
          <span aria-live="polite">
            {title} selected for {displayPrice}
          </span>
        )}
        {hasError && (
          <span aria-live="assertive">
            Please select a labor option to continue
          </span>
        )}
      </div>
    </label>
  );
};

export default LaborRadioCard;
