/**
 * @fileoverview MenuPopover component - Dropdown navigation menu for main header
 * @source boombox-10.0/src/app/components/navbar/menupopover.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Renders a hamburger menu button that toggles a dropdown popover
 * - Contains navigation links to main site sections (How it works, Storage prices, etc.)
 * - Shows dynamic account page link based on user authentication status
 * - Supports dark/light theme variants
 * - Handles click-outside-to-close functionality
 * - Used in main site navigation header
 * 
 * API ROUTES UPDATED:
 * - No API routes used (pure UI component)
 * 
 * 
 * @refactor Extracted getAccountPageUrl logic to navigationUtils for reusability
 * @refactor Fixed account type case bug (customer -> USER, etc.)
 */

'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon } from "@heroicons/react/20/solid";
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { getAccountPageUrl, getAccountPageText } from '@/lib/utils/navigationUtils';
import { useClickOutside } from '@/hooks/useClickOutside';

const menuOptions = [
  { name: "How it works", href: "/howitworks" },
  { name: "Storage unit prices", href: "/storage-unit-prices" },
  { name: "Storage calculator", href: "/storage-calculator" },
  { name: "Packing supplies", href: "/packing-supplies" },
  { name: "Locations", href: "/locations" },
  { name: "Help center", href: "/help-center" },
];

interface MenuPopoverProps {
  className?: string;
  theme?: 'dark' | 'light';
}

export const MenuPopover: React.FC<MenuPopoverProps> = ({ className, theme = 'dark' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isDarkTheme = theme === 'dark';

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

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      // Return focus to the toggle button
      const button = event.currentTarget.querySelector('button');
      button?.focus();
    }
  };

  // Close menu when clicking outside
  useClickOutside(popoverRef, () => setIsOpen(false));

  return (
    <div className={`relative inline-block text-left ${className}`} ref={popoverRef}>
      <button
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls="popover-menu"
        aria-label="Toggle navigation menu"
        className={`group flex text-sm cursor-pointer items-center gap-1 py-2.5 px-2.5 rounded-full focus:outline-none ${
          isDarkTheme
            ? 'text-text-inverse sm:hover:bg-primary-hover active:bg-primary-active focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2'
            : 'text-text-primary sm:hover:bg-surface-tertiary active:bg-surface-disabled focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-5" />
        ) : (
          <Bars3Icon className="w-5" />
        )}
      </button>

      <div
        id="popover-menu"
        role="menu"
        aria-label="Navigation menu"
        onKeyDown={handleMenuKeyDown}
        className={`absolute min-w-48 right-0 z-10 mt-4 origin-top-right bg-surface-primary rounded-md shadow-custom-shadow ring-1 ring-inset ring-border transition-transform transition-opacity duration-200 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ul className="border-b border-border">
          {menuOptions.map((option, index) => (
            <Link key={option.name} href={option.href}>
              <li 
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
                className={`group flex h-10 space-x-4 items-center p-4 text-nowrap text-sm cursor-pointer focus:outline-none focus:bg-surface-tertiary ${
                  'text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled group-hover:text-text-primary'
                }`}
              >
                <p className="text-sm">{option.name}</p>
              </li>
            </Link>
          ))}
        </ul>
        <Link href={getAccountPageUrl(session?.user)}>
          <div
            role="menuitem"
            tabIndex={isOpen ? 0 : -1}
            className={`flex h-12 items-center justify-center px-4 py-3 text-nowrap text-sm cursor-pointer focus:outline-none focus:bg-surface-tertiary ${
              'text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled'
            }`}
          >
            <p className="text-sm">{getAccountPageText(session?.user)}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
