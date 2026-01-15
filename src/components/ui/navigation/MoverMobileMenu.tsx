/**
 * @fileoverview MoverMobileMenu - Full-screen mobile menu for mover/driver accounts
 * @source boombox-10.0/src/app/components/navbar/MoverMobileMenu.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides full-screen mobile navigation overlay for authenticated movers and drivers
 * with role-specific menu items and logout functionality. Features automatic route
 * change detection, body scroll lock, and supports both mover and driver user types.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc/slate colors with semantic design system tokens
 * - Applied consistent text hierarchy using design system colors
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * - Updated button styling to use design system patterns
 * 
 * @refactor Converted to design system compliance and enhanced accessibility
 */

'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid';
import { signOut } from "next-auth/react";

interface MoverMobileMenuProps {
 className?: string;
 theme?: 'dark' | 'light';
 userType: "driver" | "mover";
 userId: string;
}

export const MoverMobileMenu: React.FC<MoverMobileMenuProps> = ({ className, theme = 'dark', userType, userId }) => {
 const [isOpen, setIsOpen] = useState(false);
 const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
 const isDarkTheme = theme === 'dark';
 const pathname = usePathname();
 const router = useRouter();

 const baseUrl = userType === "driver" ? `/service-provider/driver/${userId}` : `/service-provider/mover/${userId}`;

 const menuOptions = [
  { name: "Home", href: `${baseUrl}`},
  { name: "Jobs", href: `${baseUrl}/jobs`},
  { name: "Work Schedule", href: `${baseUrl}/calendar`},
  { name: "Vehicle information", href: `${baseUrl}/vehicle`},
  { name: "Drivers", href: `${baseUrl}/drivers`},
  { name: "Account information", href: `${baseUrl}/account-information`},
  { name: "Payment", href: `${baseUrl}/payment` },
];

 useEffect(() => {
  const handleRouteChange = () => {
   setIsOpen(false);
   document.body.style.overflow = '';
  };

  handleRouteChange();

  return () => {
   document.body.style.overflow = '';
  };
 }, [pathname]);

 useEffect(() => {
  if (isOpen) {
   document.body.style.overflow = 'hidden';
  } else {
   document.body.style.overflow = '';
  }

  return () => {
   document.body.style.overflow = '';
  };
 }, [isOpen]);

 const toggleMenu = () => {
  setIsOpen(!isOpen);
 };

 const handleLogout = async () => {
  try {
   console.log('[MoverMobileMenu] Starting logout...');
   setIsLoggingOut(true);
   
   console.log('[MoverMobileMenu] Calling signOut...');
   await signOut({ redirect: false });
   
   console.log('[MoverMobileMenu] signOut completed, redirecting to /');
   router.push('/');
   
   setIsLoggingOut(false);
   console.log('[MoverMobileMenu] Logout complete');
  } catch (error) {
   console.error('[MoverMobileMenu] Logout failed:', error);
   alert('Failed to log out. Please try again.');
   setIsLoggingOut(false);
  }
 };

 return (
  <div className={`relative ${className}`}>
   <button
    onClick={toggleMenu}
    className={`flex text-sm cursor-pointer items-center gap-1 py-2.5 px-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
     isDarkTheme
      ? 'bg-primary-hover text-text-inverse active:bg-primary-active focus-visible:ring-text-inverse'
      : 'text-text-primary active:bg-surface-tertiary focus-visible:ring-primary'
    }`}
    aria-label={`Toggle ${userType} navigation menu`}
    aria-expanded={isOpen}
    aria-controls="mover-mobile-navigation-menu"
   >
    {isOpen ? (
     <XMarkIcon className="w-5" aria-hidden="true" />
    ) : (
     <Bars3Icon className="w-5" aria-hidden="true" />
    )}
   </button>

   <div
    id="mover-mobile-navigation-menu"
    role="dialog"
    aria-modal="true"
    aria-label={`${userType} mobile navigation menu`}
    className={`fixed inset-0 top-16 bg-surface-primary flex z-20 transition-all duration-500 overflow-hidden ${
     isOpen ? 'max-h-screen' : 'max-h-0'
    }`}
   >
    <nav className="text-text-primary w-full" role="navigation" aria-label={`${userType} mobile navigation`}>
     <ul className="mt-2" role="list">
      {menuOptions.map((option) => (
       <li key={option.name} role="listitem">
        <Link 
         href={option.href}
         className="group flex space-x-4 items-center p-6 text-nowrap cursor-pointer border-b border-border hover:bg-surface-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
         aria-label={`Navigate to ${option.name}`}
        >
         <p className="text-text-primary text-3xl group-hover:text-primary">{option.name}</p>
        </Link>
       </li>
      ))}
     </ul>
     <div className="flex p-6 mt-2 gap-2">
      <button
       onClick={handleLogout}
       disabled={isLoggingOut}
       aria-label={isLoggingOut ? 'Logging out' : 'Log out of your account'}
       className="rounded-full w-full border-2 py-2.5 px-3 font-semibold border-primary bg-surface-primary text-text-primary text-md font-inter hover:bg-surface-tertiary active:bg-surface-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
       {isLoggingOut ? 'Logging out...' : 'Log Out'}
      </button>
     </div>
    </nav>
   </div>
  </div>
 );
};
