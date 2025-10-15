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
                        <li className="text-sm rounded-full py-2.5 px-3 hover:bg-primary-hover active:bg-primary-active transition-colors">
                            <Link 
                                href="/howitworks" 
                                className="text-text-inverse text-nowrap text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 rounded"
                                aria-label="Learn how Boombox storage works"
                            >
                                How it works
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
                            <Link href="/getquote">
                                <button 
                                    className="hidden sm:block py-2.5 px-3 rounded-full font-semibold bg-surface-primary text-sm hover:bg-surface-tertiary active:bg-surface-disabled transition-colors text-nowrap font-inter text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2"
                                    aria-label="Get a storage quote"
                                >
                                    Get Quote
                                </button>
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
