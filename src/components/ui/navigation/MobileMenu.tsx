/**
 * @fileoverview MobileMenu - Full-screen mobile navigation menu
 * @source boombox-10.0/src/app/components/navbar/MobileMenu.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a full-screen mobile navigation overlay with menu items and action buttons.
 * Includes automatic route change detection to close menu, body scroll lock when open,
 * and user account integration. Supports both dark and light themes.
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
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid';
import { useSession } from "next-auth/react";
import { getAccountPageUrl, getAccountPageText } from '@/lib/utils/navigationUtils';

const menuOptions = [
 { name: 'How it works', href: '/howitworks' },
 { name: 'Storage unit prices', href: '/storage-unit-prices' },
 { name: 'Storage calculator', href: '/storage-calculator' },
 { name: 'Packing Supplies', href: '/packing-supplies' },
 { name: 'Locations', href: '/locations' },
 { name: 'Help Center', href: '/help-center' },
];

interface MobileMenuProps {
 className?: string;
 theme?: 'dark' | 'light';
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ className, theme = 'dark' }) => {
 const [isOpen, setIsOpen] = useState(false);
 const isDarkTheme = theme === 'dark';
 const pathname = usePathname();
 const { data: session } = useSession();



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

 const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === 'Escape') {
   setIsOpen(false);
  } else if (event.key === 'Enter' || event.key === ' ') {
   event.preventDefault();
   toggleMenu();
  }
 };

 return (
  <div className={`relative ${className}`}>
   <button
    onClick={toggleMenu}
    onKeyDown={handleKeyDown}
    className={`flex text-sm cursor-pointer items-center gap-1 py-2.5 px-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
     isDarkTheme
      ? 'bg-primary-hover text-text-inverse active:bg-primary-active focus-visible:ring-text-inverse'
      : 'text-text-primary active:bg-surface-tertiary focus-visible:ring-primary'
    }`}
    aria-label="Toggle navigation menu"
    aria-expanded={isOpen}
    aria-controls="mobile-navigation-menu"
   >
    {isOpen ? (
     <XMarkIcon className="w-5" aria-hidden="true" />
    ) : (
     <Bars3Icon className="w-5" aria-hidden="true" />
    )}
   </button>

   <div
    id="mobile-navigation-menu"
    role="dialog"
    aria-modal="true"
    aria-label="Mobile navigation menu"
    className={`fixed inset-0 top-16 bg-surface-primary flex z-20 transition-all duration-500 overflow-hidden ${
     isOpen ? 'max-h-screen' : 'max-h-0'
    }`}
   >
    <nav className="text-text-primary w-full" role="navigation" aria-label="Mobile navigation">
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
      <Link href={getAccountPageUrl(session?.user)} className="basis-1/2">
       <button
        className="rounded-full w-full border-2 py-2.5 px-3 font-semibold border-primary bg-surface-primary text-text-primary text-md font-inter hover:bg-surface-tertiary active:bg-surface-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Go to ${getAccountPageText(session?.user)} page`}
       >
        {getAccountPageText(session?.user)}
       </button>
      </Link>
      <Link href="/get-quote" className="basis-1/2">
       <button
        className="rounded-full py-2.5 px-3 font-semibold w-full text-md border-2 border-primary bg-primary text-text-inverse active:bg-primary-active font-inter hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2"
        aria-label="Get a storage quote"
       >
        Get Quote
       </button>
      </Link>
     </div>
    </nav>
   </div>
  </div>
 );
};
