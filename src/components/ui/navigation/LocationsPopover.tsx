/**
 * @fileoverview LocationsPopover - Navigation dropdown for location selection
 * @source boombox-10.0/src/app/components/navigation/LocationsPopover.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a dropdown interface for users to select service locations, 
 * includes zip code input and city links for location-based navigation.
 * Features enhanced keyboard navigation and screen reader support.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Migrated hardcoded zinc colors to semantic design system tokens
 * - Replaced native button with primitive Button component
 * - Applied consistent text hierarchy using design system colors
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * 
 * DATA EXTRACTION:
 * - Moved cities data to external data source for better maintainability
 * - Added proper TypeScript interfaces for location data
 * - Implemented SEO-friendly URLs for each location
 * 
 * @refactor Converted to design system compliance, primitive component usage, and enhanced accessibility
 */

'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/primitives/Button';
import { MapIcon } from '@/components/icons/MapIcon';
import { LocationZipInput } from './LocationZipInput';
import { SERVED_CITIES } from '@/data/locations';
import Link from 'next/link';
import { useClickOutside } from '@/hooks/useClickOutside';

export const LocationsPopover = () => {
 const [isOpen, setIsOpen] = useState<boolean>(false);
 const [focusedIndex, setFocusedIndex] = useState<number>(-1);
 const popoverRef = useRef<HTMLDivElement>(null);
 const buttonRef = useRef<HTMLButtonElement>(null);
 const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

 // Memoize cities data for performance
 const cities = useMemo(() => SERVED_CITIES, []);

 const toggleMenu = useCallback(() => {
  setIsOpen(prev => {
   const newIsOpen = !prev;
   if (newIsOpen) {
    // Reset focus index when opening
    setFocusedIndex(-1);
   }
   return newIsOpen;
  });
 }, []);

 const closeMenu = useCallback(() => {
  setIsOpen(false);
  setFocusedIndex(-1);
  // Return focus to button when closing without scrolling
  buttonRef.current?.focus({ preventScroll: true });
 }, []);

 // Close menu when clicking outside
 useClickOutside(popoverRef, closeMenu);

 const handleKeyDown = useCallback((event: KeyboardEvent) => {
  if (!isOpen) return;

  switch (event.key) {
   case 'Escape':
    event.preventDefault();
    closeMenu();
    break;
   case 'ArrowDown':
    event.preventDefault();
    setFocusedIndex(prev => {
     const nextIndex = prev < cities.length ? prev + 1 : 0;
     return nextIndex;
    });
    break;
   case 'ArrowUp':
    event.preventDefault();
    setFocusedIndex(prev => {
     const nextIndex = prev > 0 ? prev - 1 : cities.length;
     return nextIndex;
    });
    break;
   case 'Enter':
   case ' ':
    event.preventDefault();
    if (focusedIndex >= 0 && focusedIndex < cities.length) {
     menuItemsRef.current[focusedIndex]?.click();
    } else if (focusedIndex === cities.length) {
     // "Check our full list" link
     const fullListLink = popoverRef.current?.querySelector('a[href="/locations"]') as HTMLAnchorElement;
     fullListLink?.click();
    }
    break;
  }
 }, [isOpen, focusedIndex, cities.length, closeMenu]);

 useEffect(() => {
  document.addEventListener('keydown', handleKeyDown);
  return () => {
   document.removeEventListener('keydown', handleKeyDown);
  };
 }, [handleKeyDown]);

 // Focus management for keyboard navigation
 useEffect(() => {
  if (isOpen && focusedIndex >= 0) {
   if (focusedIndex < cities.length) {
    menuItemsRef.current[focusedIndex]?.focus();
   } else if (focusedIndex === cities.length) {
    const fullListLink = popoverRef.current?.querySelector('a[href="/locations"]') as HTMLAnchorElement;
    fullListLink?.focus();
   }
  }
 }, [focusedIndex, isOpen, cities.length]);
 
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
    Locations
   </Button>
 
   <div
    id="locations-menu"
    role="menu"
    aria-label="Storage locations menu"
    className={`absolute min-w-max right-0 z-10 mt-5 origin-top-right bg-surface-primary rounded-md shadow-custom-shadow ring-1 ring-inset ring-border transition-transform transition-opacity duration-200 ease-out ${
     isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
   >
    <div className="flex p-4 border-b border-border">
     <div className="flex flex-grow basis-0 space-x-4 justify-start items-center ml-2">
      <MapIcon className="w-8" aria-hidden="true"/>
      <div>   
       <p className="mt-1 mb-0.5 text-text-primary font-medium">Locations</p>
       <p className="text-xs text-text-secondary">check if we serve your zip code</p>
      </div>
     </div>
     <div className="basis-64 relative justify-end justify-items-end">
      <LocationZipInput/>
     </div>
    </div>
    
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1" role="none">
     {cities.map((city, index) => (
      <Link 
       key={city.name} 
       href={city.href}
       ref={el => { menuItemsRef.current[index] = el; }}
       role="menuitem"
       tabIndex={isOpen ? 0 : -1}
       aria-label={`Storage in ${city.city}, ${city.state}`}
       className={`py-2.5 px-3 text-nowrap text-sm underline-offset-4 hover:underline`}
       onMouseEnter={() => setFocusedIndex(index)}
       onClick={closeMenu}
      >
       {city.name}
      </Link>
     ))}
    </div>

    <div 
     className={`group relative leading-6 p-4 border-t border-border cursor-pointer hover:bg-surface-tertiary active:bg-surface-disabled`}
     role="none"
    >
     <Link 
      className="flex justify-between grow items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded" 
      href="/locations"
      role="menuitem"
      tabIndex={isOpen ? 0 : -1}
      aria-label="View complete list of all storage locations"
      onMouseEnter={() => setFocusedIndex(cities.length)}
      onClick={closeMenu}
     >
      <p className="pl-2 text-text-primary group-hover:text-primary">Check our full list of locations</p>
      <ChevronRightIcon className="h-5 w-5 text-text-primary group-hover:text-primary mr-2" aria-hidden="true"/>
     </Link>
    </div>
   </div>
   </div>
  );
 };
