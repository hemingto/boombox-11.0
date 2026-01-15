/**
 * @fileoverview ConditionalFooter - Conditionally renders Footer based on route
 * @source Created for boombox-11.0 to support pages without footer
 * 
 * COMPONENT FUNCTIONALITY:
 * Wrapper component that checks the current pathname and conditionally renders
 * the Footer component. Used in public layout to exclude footer from specific
 * pages like get-quote where it may distract from the conversion flow.
 * 
 * @refactor Created to maintain clean layout structure while supporting conditional footer
 */

'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

// Pages that should NOT show the footer
const NO_FOOTER_PATHS = [
  '/get-quote',
  '/tracking',
  '/feedback',
];

export const ConditionalFooter = () => {
  const pathname = usePathname();
  
  // Check if current path should hide footer
  const hideFooter = NO_FOOTER_PATHS.some(path => pathname?.startsWith(path));

  // Return null if footer should be hidden, otherwise render Footer
  return hideFooter ? null : <Footer />;
};

