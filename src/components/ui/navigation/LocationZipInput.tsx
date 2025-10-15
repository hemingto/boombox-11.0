/**
 * @fileoverview LocationZipInput - Zip code input for location validation
 * @source boombox-10.0/src/app/components/navigation/LocationZipInput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a zip code input field with validation and search functionality.
 * Navigates to location pages with zip code parameters for service verification.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Migrated hardcoded zinc colors to semantic design system tokens
 * - Replaced native button with primitive Button component
 * - Applied design system input field styling
 * - Enhanced accessibility with proper ARIA labels
 * 
 * @refactor Converted to design system compliance and primitive component usage
 */

'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';

export const LocationZipInput = () => {
  const [locationZipCode, setLocationZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleZipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 5 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setLocationZipCode(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (/^\d{5}$/.test(locationZipCode)) {
        // Navigate to /locations with the zipCode as a query parameter
        router.push(`/locations?zipCode=${locationZipCode}`);
      } else {
        router.push(`/locations`); // Navigate to /locations without a zip code
      }
    } finally {
      setIsLoading(false);
    }
  }, [locationZipCode, router, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isValidZip = /^\d{5}$/.test(locationZipCode);

  return (
    <div className="rounded-full px-3 pb-1.5 pt-2.5 ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-border-focus bg-surface-primary">
      <label htmlFor="zip" className="pl-3 block text-xs text-text-primary font-medium">
        Zip Code
      </label>
      <input
        id="zip"
        name="zip"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{5}"
        placeholder="94123"
        value={locationZipCode}
        onChange={handleZipChange}
        onKeyDown={handleKeyDown}
        aria-label="Enter your zip code to check service availability"
        aria-describedby="zip-help"
        className="pl-3 block w-full focus:outline-none border-0 p-0 text-text-primary placeholder:text-text-secondary focus:ring-0 sm:text-sm sm:leading-6 bg-transparent"
      />
      <div className="absolute right-1.5 inset-y-1.5">
        <Button
          type="button"
          variant="primary"
          size="sm"
          borderRadius="full"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          aria-label={isValidZip ? `Search storage locations for zip code ${locationZipCode}` : 'Search all storage locations'}
          className="w-11 h-11 p-2 shadow-sm"
        >
          <MagnifyingGlassIcon aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      <div id="zip-help" className="sr-only">
        Enter a 5-digit zip code to check if we provide storage services in your area
      </div>
    </div>
  );
};

// Add display name for debugging
LocationZipInput.displayName = 'LocationZipInput';
