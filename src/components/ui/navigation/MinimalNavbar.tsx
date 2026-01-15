/**
 * @fileoverview MinimalNavbar - Simplified navigation bar for minimal layouts
 * @source boombox-10.0/src/app/components/navbar/MinimalNavbar.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a simplified navigation header with logo, conditional buttons (Get Quote, Log In),
 * and menu popovers. Supports both dark and light themes with responsive design.
 * Used on pages that need minimal navigation without full site navigation.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with semantic design system tokens
 * - Applied consistent text hierarchy using design system colors
 * - Enhanced accessibility with proper ARIA labels and semantic HTML
 * - Replaced native buttons with design system consistent styling
 * 
 * @refactor Converted to design system compliance and enhanced accessibility
 */

import { BoomboxLogo } from "@/components/icons/BoomboxLogo";
import Link from 'next/link';
import { MenuPopover } from "./MenuPopover";
import { MobileMenu } from "./MobileMenu";
import { Button } from "@/components/ui/primitives/Button/Button";

interface MinimalNavbarProps {
  theme?: 'dark' | 'light';
  showGetQuoteButton?: boolean; // New prop to control Get Quote button visibility
  showLoginButton?: boolean; // New prop to control Log In button visibility
}

export const MinimalNavbar: React.FC<MinimalNavbarProps> = ({ theme = 'dark', showGetQuoteButton = true, showLoginButton = true }) => {
  const isDarkTheme = theme === 'dark';

  return (
    <header role="banner">
      <nav 
        className={`h-16 w-full flex items-center ${isDarkTheme ? 'bg-primary' : 'bg-surface-primary border-b border-border'}`}
        aria-label="Main navigation"
      >
        <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
          <ul className="md:basis-1/2 justify-start">
            <li>
              <Link 
                href="/"
                aria-label="Boombox home page"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <BoomboxLogo className={`w-24 sm:w-32 ${isDarkTheme ? 'text-text-inverse' : 'text-primary'}`} />
              </Link>
            </li>
          </ul>

          <ul className="md:basis-1/2 flex justify-end items-center grow gap-3">
            {showLoginButton && (
              <li>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    borderRadius="full"
                    className={`hidden sm:block font-poppins font-semibold ${
                      isDarkTheme 
                        ? 'text-text-inverse hover:bg-primary-hover active:bg-primary-active' 
                        : 'text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled'
                    }`}
                    aria-label="Log in to your account"
                    noWrap
                  >
                    Log in
                  </Button>
                </Link>
              </li>
            )}

            {showGetQuoteButton && (
              <li>
                <Link href="/get-quote">
                  <Button
                    variant={isDarkTheme ? 'white' : 'primary'}
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
            )}

            <li>
              <MenuPopover className="hidden sm:block" theme={theme} />
              <MobileMenu className="sm:hidden" theme={theme} />
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};
