/**
 * @fileoverview ConditionalNavbar - Conditionally renders NavHeader or MinimalNavbar based on route
 * @source Created for boombox-11.0 to support minimal navbar on informational pages
 * 
 * COMPONENT FUNCTIONALITY:
 * Wrapper component that checks the current pathname and renders either the full NavHeader
 * (with navigation dropdowns) or MinimalNavbar (without dropdowns) based on the route.
 * Used in public layout to maintain boombox-10.0 behavior where informational pages 
 * like "How it works" don't show navigation dropdowns.
 * 
 * @refactor Created to maintain server component optimization while supporting conditional navbar
 */

'use client';

import { usePathname } from 'next/navigation';
import { NavHeader } from './NavHeader';
import { MinimalNavbar } from './MinimalNavbar';

// Pages that should NOT show any navbar
const NO_NAVBAR_PATHS = [
  '/tracking',
  '/feedback',
];

// Pages that should use the minimal navbar (without dropdowns)
const MINIMAL_NAVBAR_PATHS = [
  '/howitworks',
  '/locations',
  '/storage-unit-prices',
  '/storage-calculator',
  '/packing-supplies',
  '/help-center',
  '/blog',
  '/blog-post',
  '/careers',
  '/checklist',
  '/sitemap',
  '/terms',
  '/insurance',
  '/storage-guidelines',
  '/vehicle-requirements',
  '/get-quote',
];

export const ConditionalNavbar = () => {
  const pathname = usePathname();
  
  // Check if current path should hide navbar entirely
  const hideNavbar = NO_NAVBAR_PATHS.some(path => pathname?.startsWith(path));
  
  if (hideNavbar) {
    return null;
  }
  
  // Check if current path should use minimal navbar
  const useMinimalNav = MINIMAL_NAVBAR_PATHS.some(path => pathname?.startsWith(path));

  return useMinimalNav ? (
    <MinimalNavbar theme="dark" showGetQuoteButton={true} />
  ) : (
    <NavHeader />
  );
};

