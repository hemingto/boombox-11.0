/**
 * @fileoverview PricingPopover - Navigation dropdown for pricing information
 * @source boombox-10.0/src/app/components/navigation/PricingPopover.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Provides a dropdown interface for pricing queries with zip code input and
 * navigation to detailed pricing page. Features enhanced keyboard navigation
 * and screen reader support for pricing exploration.
 *
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc/slate colors with semantic design system tokens
 * - Applied consistent text hierarchy using design system colors
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * - Updated button and link styling to use design system patterns
 *
 * @refactor Converted to design system compliance and enhanced accessibility
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/primitives/Button';
import { PriceIcon } from '@/components/icons/PriceIcon';
import { PriceZipInput } from './PriceZipInput';
import Link from 'next/link';
import { useClickOutside } from '@/hooks/useClickOutside';

export const PricingPopover = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    // Return focus to button when closing without scrolling
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  // Close menu when clicking outside
  useClickOutside(popoverRef, closeMenu);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    },
    [isOpen, closeMenu]
  );

  const handleButtonKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu();
      } else if (event.key === 'Escape') {
        closeMenu();
      }
    },
    [toggleMenu, closeMenu]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        borderRadius="full"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-controls="locations-menu"
        aria-label="Select storage location - opens menu with list of served cities"
        aria-haspopup="menu"
        icon={<ChevronDownIcon className="-ml-1 h-4 w-4 stroke-2" />}
        iconPosition="right"
        className="font-poppins font-normal text-text-inverse hover:bg-primary-hover active:bg-primary-active"
      >
        Pricing
      </Button>

      {isOpen && (
        <div
          id="pricing-popover-menu"
          role="menu"
          aria-label="Pricing tools menu"
          className="absolute min-w-max right-0 z-10 mt-5 origin-top-right bg-surface-primary rounded-md shadow-custom-shadow ring-1 ring-inset ring-border transition-transform transition-opacity duration-200 ease-out opacity-100"
        >
          <div className="flex p-4 border-b border-border space-x-8">
            <div className="flex flex-none w-64 space-x-4 justify-start items-center ml-2">
              <PriceIcon
                className="w-8"
                aria-hidden="true"
                data-testid="price-icon"
              />
              <div>
                <p className="mt-1 mb-0.5 text-text-primary font-medium">
                  Storage unit prices
                </p>
                <p className="text-xs text-text-primary">
                  check pricing in your zip code
                </p>
              </div>
            </div>
            <div className="w-56 flex-none relative justify-end justify-items-end">
              <PriceZipInput />
            </div>
          </div>

          <div
            className="group relative leading-6 p-4 cursor-pointer hover:bg-surface-tertiary active:bg-surface-disabled"
            role="none"
          >
            <Link
              className="flex justify-between grow items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded"
              href="/storage-unit-prices"
              role="menuitem"
              aria-label="Learn more about storage unit pricing"
              onClick={closeMenu}
            >
              <p className="pl-2 text-text-primary group-hover:text-primary">
                Learn more at our pricing page
              </p>
              <ChevronRightIcon
                className="h-5 w-5 text-text-primary group-hover:text-primary mr-2"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
