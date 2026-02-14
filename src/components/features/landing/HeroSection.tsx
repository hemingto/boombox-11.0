/**
 * @fileoverview Hero Section component for landing page
 * @source boombox-10.0/src/app/components/landingpage/herosection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Main hero section that allows users to select storage amount and enter zip code
 * to get a quote. Features 5 storage options (Extra items, Studio, 1 Bed, 2 Bed, Full Home)
 * with visual icons, zip code input with validation, and navigation to quote page with
 * pre-filled parameters.
 *
 * API ROUTES UPDATED:
 * - None (client-side only component with navigation)
 *
 * DESIGN SYSTEM UPDATES:
 * - bg-slate-100 → bg-surface-tertiary (radio button selected state)
 * - hover:bg-slate-100 active:bg-slate-200 → hover:bg-surface-tertiary active:bg-surface-disabled
 * - text-zinc-950 → text-text-primary (selected state)
 * - text-zinc-400 → text-text-secondary (unselected state)
 * - bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-700 → btn-primary utility class
 * - Input field uses semantic colors for focus states
 * - MapPinIcon color uses semantic text tokens
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added semantic HTML with section element
 * - Added proper ARIA labels for radio group and input
 * - Enhanced keyboard navigation support
 * - Proper form structure with fieldset and legend
 * - Descriptive labels for all interactive elements
 * - Input has proper type and validation feedback
 *
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image with priority loading for above-the-fold hero image
 * - Proper aspect ratio (square) and responsive sizing
 * - Quality optimized for hero display (90%)
 *
 * BUSINESS LOGIC PRESERVED:
 * - Exact same storage unit count mapping
 * - Same zip code validation (5-digit)
 * - Same navigation logic with query parameters
 * - Same keyboard Enter key handling
 *
 * @refactor Migrated to features/landing with design system compliance and enhanced accessibility
 */

'use client';

import { useState, KeyboardEvent } from 'react';
import { ExtraitemsIcon } from '@/components/icons/ExtraItemsIcon';
import { StudioIcon } from '@/components/icons/StudioIcon';
import { OnebedroomIcon } from '@/components/icons/OneBedroomIcon';
import { TwobedroomIcon } from '@/components/icons/TwoBedroomIcon';
import { FullhomeIcon } from '@/components/icons/FullHomeIcon';
import { MapPinIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/primitives/Input/Input';

interface StorageOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  unitCount: number;
  iconClassName: string;
}

export interface HeroSectionProps {
  /**
   * Main heading text
   */
  title: string;

  /**
   * Button text for CTA
   */
  buttontext: string;

  /**
   * Hero image source path
   * @default '/hero-imgs/hero-2.png'
   */
  imageSrc?: string;

  /**
   * Hero image alt text
   * @default 'San Francisco Bay Area mobile storage service'
   */
  imageAlt?: string;

  /**
   * @deprecated No longer used - component now uses CSS gradient fallback for better scaling
   */
  fallbackSrc?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

const storageOptions: StorageOption[] = [
  {
    value: 'extraItems',
    label: 'Extra items',
    icon: ExtraitemsIcon,
    unitCount: 1,
    iconClassName: 'w-8',
  },
  {
    value: 'studio',
    label: 'Studio',
    icon: StudioIcon,
    unitCount: 1,
    iconClassName: 'w-5',
  },
  {
    value: 'oneBedroom',
    label: '1 Bed Apt.',
    icon: OnebedroomIcon,
    unitCount: 2,
    iconClassName: 'w-6',
  },
  {
    value: 'twoBedroom',
    label: '2 Bed Apt.',
    icon: TwobedroomIcon,
    unitCount: 3,
    iconClassName: 'w-8',
  },
  {
    value: 'fullHome',
    label: 'Full Home',
    icon: FullhomeIcon,
    unitCount: 4,
    iconClassName: 'w-8',
  },
];

/**
 * Hero Section Component
 *
 * Main landing page hero with storage amount selection and zip code input.
 * Navigates to quote page with pre-filled parameters based on user selection.
 *
 * @example
 * ```tsx
 * <HeroSection
 *   title="Store your stuff with Boombox"
 *   buttontext="Get a quote"
 * />
 * ```
 */
// Tiny 10x10 blur placeholder - scales infinitely without resolution issues
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZTVlN2ViIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZDFkNWRiIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PC9zdmc+';

export function HeroSection({
  title,
  buttontext,
  imageSrc = '/hero-imgs/hero-square.png',
  imageAlt = 'San Francisco Bay Area mobile storage service',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fallbackSrc: _fallbackSrc,
  className,
}: HeroSectionProps) {
  const [selectedValue, setSelectedValue] = useState<string>('extraItems');
  const [zipCode, setZipCode] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const router = useRouter();

  const handleRadioChange = (value: string) => {
    setSelectedValue(value);
  };

  const handleGetQuote = () => {
    const selectedOption = storageOptions.find(
      option => option.value === selectedValue
    );
    const formData: { storageUnitCount: number; zipCode?: string } = {
      storageUnitCount: selectedOption ? selectedOption.unitCount : 1,
    };

    // Only include zipCode if it's a valid 5-digit number
    if (/^\d{5}$/.test(zipCode)) {
      formData.zipCode = zipCode;
    }

    // Convert form data to query string
    const queryParams = new URLSearchParams({
      storageUnitCount: formData.storageUnitCount.toString(),
      ...(formData.zipCode && { zipCode: formData.zipCode }),
    }).toString();

    // Navigate to the get-quote page with the query parameters
    router.push(`/get-quote?${queryParams}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGetQuote();
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(e.target.value);
  };

  return (
    <section
      className={`md:flex mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-48 mb-24 mr-6 sm:mr-0 ${className || ''}`}
      aria-label="Get a storage quote"
    >
      {/* Left column: Form */}
      <div className="place-content-center basis-1/2 mb-10 md:mb-0">
        <div className="max-w-xl mx-auto">
          <h1 className="mb-10 max-md:text-5xl max-md:leading-tight">
            {title}
          </h1>

          {/* Storage amount selection */}
          <fieldset className="mb-8">
            <legend className="mb-4">How much are you storing?</legend>
            <div
              className="flex gap-1 sm:gap-2 text-center max-w-lg"
              role="radiogroup"
              aria-label="Storage amount selection"
            >
              {storageOptions.map(option => (
                <label
                  key={option.value}
                  className="flex-1 min-w-0 cursor-pointer flex flex-col items-center"
                >
                  <input
                    type="radio"
                    name="storageAmount"
                    className="sr-only"
                    value={option.value}
                    checked={selectedValue === option.value}
                    onChange={() => handleRadioChange(option.value)}
                    aria-label={`${option.label} - ${option.unitCount} storage ${option.unitCount === 1 ? 'unit' : 'units'}`}
                  />
                  <div
                    className={`flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-lg place-content-center mb-1 ${
                      selectedValue === option.value
                        ? 'bg-surface-tertiary'
                        : 'hover:bg-surface-tertiary active:bg-surface-disabled'
                    }`}
                  >
                    <option.icon
                      className={`${option.iconClassName} ${
                        selectedValue === option.value
                          ? 'text-text-primary'
                          : 'text-text-secondary'
                      }`}
                    />
                  </div>
                  <p
                    className={`text-[11px] sm:text-xs ${selectedValue === option.value ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    {option.label}
                  </p>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Zip code input */}
          <div className="mb-10">
            <Input
              id="zip-code-input"
              type="text"
              placeholder="Enter your zip"
              label="Where do you need us?"
              value={zipCode}
              onChange={handleZipChange}
              onKeyDown={handleKeyDown}
              icon={<MapPinIcon />}
              iconPosition="left"
              size="md"
              maxLength={5}
              className="max-w-80 placeholder:text-sm"
              aria-label="Enter your 5-digit zip code"
            />
          </div>

          {/* CTA Button */}
          <button
            onClick={handleGetQuote}
            className="btn-primary"
            aria-label={`${buttontext} - Get a storage quote for ${storageOptions.find(o => o.value === selectedValue)?.label || 'your selection'}`}
          >
            {buttontext}
          </button>
        </div>
      </div>

      {/* Right column: Image */}
      <div className="flex place-content-center basis-1/2">
        <div className="relative w-full max-w-xl aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-surface-secondary to-surface-tertiary">
          {imageError ? (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-secondary to-surface-tertiary"
              role="img"
              aria-label={imageAlt}
            >
              <svg
                className="w-24 h-24 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          ) : (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              quality={90}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="rounded-lg object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
