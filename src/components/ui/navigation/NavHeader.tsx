/**
 * @fileoverview NavHeader - Full featured navigation header for main site
 * @source boombox-10.0/src/app/components/navbar/NavHeader.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides the main site navigation header with logo, navigation links, pricing and location
 * popovers, and action buttons. Features responsive design with desktop and mobile layouts.
 * Used on main marketing pages that need complete navigation functionality.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with semantic design system tokens
 * - Applied consistent text hierarchy using design system colors 
 * - Enhanced accessibility with proper ARIA labels and semantic HTML
 * - Updated button styling to use design system patterns
 * 
 * @refactor Converted to design system compliance and enhanced accessibility
 */

import { BoomboxLogo } from "@/components/icons/BoomboxLogo"
import Link from 'next/link'
import { LocationsPopover } from "./LocationsPopover";
import { PricingPopover } from "./PricingPopover";
import { MenuPopover } from "./MenuPopover";
import { MobileMenu } from "./MobileMenu";
import { Button } from "@/components/ui/primitives/Button/Button";

export const NavHeader = () => {
  return(
    <header role="banner">
      <nav className="h-16 w-full bg-primary flex items-center" aria-label="Main site navigation">
        <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
          <ul className="md:basis-1/3 justify-start">
            <li>
              <Link 
                href="/"
                aria-label="Boombox home page"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 rounded-sm"
              >
                <BoomboxLogo className="text-text-inverse w-24 sm:w-32"/>
              </Link>
            </li>
          </ul>
          
          <ul className="hidden lg:flex lg:gap-10 md:gap-6 basis-1/3 grow justify-center" role="list">
            <li>
              <Link 
                href="/howitworks"
                aria-label="Learn how Boombox storage works"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius="full"
                  className="font-poppins font-normal text-text-inverse hover:bg-primary-hover active:bg-primary-active"
                  noWrap
                >
                  How it works
                </Button>
              </Link>
            </li>
            <li>
              <PricingPopover/>
            </li>
            <li>
              <LocationsPopover/> 
            </li>
          </ul>
          <ul className="md:basis-1/3 flex justify-end items-center grow gap-4" role="list">
            <li>
              <Link href="/get-quote">
                <Button
                  variant="white"
                  size="sm"
                  borderRadius="full"
                  className="hidden sm:block"
                  aria-label="Get a storage quote"
                  noWrap
                >
                  Get Quote
                </Button>
              </Link>
            </li>
            <li>
              <MenuPopover className="hidden sm:block"/>
              <MobileMenu className="sm:hidden"/>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};
