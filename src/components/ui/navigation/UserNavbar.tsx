/**
 * @fileoverview UserNavbar - Navigation header for authenticated users
 * @source boombox-10.0/src/app/components/navbar/UserNavbar.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides navigation header for authenticated users with user-specific actions
 * (Add Storage, Access Storage) and user account menu. Features responsive design
 * with desktop and mobile layouts, user-specific navigation paths.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc/slate colors with semantic design system tokens
 * - Applied consistent text hierarchy using design system colors
 * - Enhanced accessibility with proper ARIA labels and semantic HTML
 * - Updated button styling to use design system patterns
 * 
 * @refactor Converted to design system compliance and enhanced accessibility
 */

import { BoomboxLogo } from "@/components/icons/BoomboxLogo";
import Link from 'next/link';
import { Inter } from "next/font/google";
import { UserMenuPopover } from "./UserMenuPopover";
import { UserMobileMenu } from "./UserMobileMenu";
// Note: NotificationBell import needs to be updated based on new structure
// import NotificationBell from "../notifications/notification-bell";

const inter = Inter({ subsets: ["latin"] });

interface UserNavbarProps {
  userId: string;
  theme?: 'dark' | 'light';
  showAddStorageButton?: boolean; // New prop to control Get Quote button visibility
  showAccessStorageButton?: boolean; // New prop to control Log In button visibility
}

export const UserNavbar: React.FC<UserNavbarProps> = ({ userId, theme = 'dark', showAddStorageButton = true, showAccessStorageButton = true }) => {
  const isDarkTheme = theme === 'dark';

  return (
    <header role="banner">
      <nav 
        className={`h-16 w-full flex items-center ${isDarkTheme ? 'bg-primary' : 'bg-surface-primary border-b border-border'}`}
        aria-label="User account navigation"
      >
        <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
          <ul className="md:basis-1/2 justify-start">
            <li>
              <Link 
                href={`/user-page/${userId}`}
                aria-label="Go to user dashboard home"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <BoomboxLogo className={`w-24 sm:w-32 ${isDarkTheme ? 'text-text-inverse' : 'text-primary'}`} />
              </Link>
            </li>
          </ul>

          <ul className="md:basis-1/2 flex justify-end items-center grow gap-3">
            {showAccessStorageButton && (
              <li>
                <Link href={`/user-page/${userId}/access-storage`}>
                  <button 
                    className={`hidden sm:block py-2.5 px-4 rounded-full font-semibold text-sm transition-colors text-nowrap font-inter focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isDarkTheme 
                        ? 'text-text-inverse hover:bg-primary-hover active:bg-primary-active focus-visible:ring-text-inverse' 
                        : 'text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled focus-visible:ring-primary'
                    }`}
                    aria-label="Access your existing storage units"
                  >
                    Access Storage
                  </button>
                </Link>
              </li>
            )}

            {showAddStorageButton && (
              <li>
                <Link href={`/user-page/${userId}/add-storage`}>
                  <button 
                    className={`hidden sm:block py-2.5 px-3 rounded-full font-semibold text-sm transition-colors text-nowrap font-inter focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isDarkTheme 
                        ? 'text-primary bg-surface-primary hover:bg-surface-tertiary active:bg-surface-disabled focus-visible:ring-text-inverse' 
                        : 'text-text-inverse bg-primary hover:bg-primary-hover active:bg-primary-active focus-visible:ring-primary'
                    }`}
                    aria-label="Add a new storage unit"
                  >
                    Add Storage
                  </button>
                </Link>
              </li>
            )}

            {/* 
            <li>
              <NotificationBell 
                recipientId={parseInt(userId)} 
                recipientType="USER" 
                isDarkTheme={isDarkTheme}
              />
            </li>
            */}

            <li>
              <UserMenuPopover className="hidden sm:block" userId={userId} theme={theme} />
              <UserMobileMenu className="sm:hidden" userId={userId} theme={theme} />
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};
