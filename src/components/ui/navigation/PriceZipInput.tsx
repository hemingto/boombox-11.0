/**
 * @fileoverview PriceZipInput - Zip code input for pricing page navigation
 * @source boombox-10.0/src/app/components/navigation/PriceZipInput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a zip code input field with validation and search functionality for pricing queries.
 * Navigates to quote page with zip code parameters for location-specific pricing information.
 * Features real-time input validation and enhanced keyboard navigation support.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded slate/zinc colors with semantic design system tokens
 * - Migrated native button to primitive Button component with design system styling
 * - Applied consistent input field styling using design system patterns
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * 
 * @refactor Converted to design system compliance, primitive component usage, and enhanced accessibility
 */

'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';

export const PriceZipInput = () => {
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleZipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 5 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (/^\d{5}$/.test(zipCode)) {
        queryParams.append('zipCode', zipCode);
      }

      await router.push(`/getquote${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    } finally {
      setIsLoading(false);
    }
  }, [zipCode, router, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isValidZip = /^\d{5}$/.test(zipCode);

  return (
    <div className="rounded-full px-3 pb-1.5 pt-2.5 ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-border-focus bg-surface-primary">
      <label htmlFor="price-zip" className="pl-3 block text-xs text-text-primary font-medium">
        Zip Code
      </label>
      <input
        id="price-zip"
        name="price-zip"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{5}"
        placeholder="94123"
        value={zipCode}
        onChange={handleZipChange}
        onKeyDown={handleKeyDown}
        aria-label="Enter your zip code to check pricing in your area"
        aria-describedby="price-zip-help"
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
          aria-label={isValidZip ? `Get pricing for zip code ${zipCode}` : 'Get pricing information'}
          className="w-11 h-11 p-2 shadow-sm"
        >
          <MagnifyingGlassIcon aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      <div id="price-zip-help" className="sr-only">
        Enter a 5-digit zip code to get accurate pricing for your area
      </div>
    </div>
  );
};
