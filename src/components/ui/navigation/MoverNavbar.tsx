/**
 * @fileoverview MoverNavbar - Navigation header for mover/driver accounts
 * @source boombox-10.0/src/app/components/navbar/MoverNavbar.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides navigation header for authenticated movers and drivers with role-specific
 * navigation paths and account management. Features responsive design with desktop
 * and mobile layouts, supports both mover and driver user types.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc/slate colors with semantic design system tokens
 * - Applied consistent text hierarchy using design system colors
 * - Enhanced accessibility with proper ARIA labels and semantic HTML
 * - Updated styling to use design system patterns
 * 
 * @refactor Converted to design system compliance and enhanced accessibility
 */

import { BoomboxLogo } from "@/components/icons/BoomboxLogo";
import Link from 'next/link';
import { MoverMenuPopover } from "./MoverMenuPopover";
import { MoverMobileMenu } from "./MoverMobileMenu";
import { NotificationBell } from "./NotificationBell";

interface MoverNavbarProps {
  theme?: 'dark' | 'light';
  userType: "driver" | "mover";
  userId: string;
}

export const MoverNavbar: React.FC<MoverNavbarProps> = ({ theme = 'dark', userType, userId }) => {
  const isDarkTheme = theme === 'dark';
  const baseUrl = userType === "driver" ? `/service-provider/driver/${userId}` : `/service-provider/mover/${userId}`;

  return (
    <header role="banner">
      <nav 
        className={`h-16 w-full flex items-center ${isDarkTheme ? 'bg-primary' : 'bg-surface-primary border-b border-border'}`}
        aria-label={`${userType === 'driver' ? 'Driver' : 'Mover'} account navigation`}
      >
        <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
          <ul className="md:basis-1/2 justify-start">
            <li>
              <Link 
                href={baseUrl}
                aria-label={`Go to ${userType} dashboard home`}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <BoomboxLogo className={`w-24 sm:w-32 ${isDarkTheme ? 'text-text-inverse' : 'text-primary'}`} />
              </Link>
            </li>
          </ul>

          <ul className="md:basis-1/2 flex justify-end items-center grow gap-3">
            <li>
              <NotificationBell 
                recipientId={parseInt(userId)} 
                recipientType={userType === "driver" ? "DRIVER" : "MOVER"} 
                isDarkTheme={isDarkTheme}
              />
            </li>

            <li>
              <MoverMenuPopover className="hidden sm:block" theme={theme} userType={userType} userId={userId} />
              <MoverMobileMenu className="sm:hidden" theme={theme} userType={userType} userId={userId} />
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};
