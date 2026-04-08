'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useClickOutside } from '@/hooks/useClickOutside';

interface HaulerMenuPopoverProps {
  className?: string;
  theme?: 'dark' | 'light';
  userId: string;
}

export const HaulerMenuPopover: React.FC<HaulerMenuPopoverProps> = ({
  className,
  theme = 'dark',
  userId,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const baseUrl = `/service-provider/hauler/${userId}`;

  const menuOptions = [
    { name: 'Home', href: `${baseUrl}` },
    { name: 'Jobs', href: `${baseUrl}/jobs` },
    { name: 'Work Schedule', href: `${baseUrl}/calendar` },
    { name: 'Vehicle Information', href: `${baseUrl}/vehicle` },
    { name: 'Drivers', href: `${baseUrl}/drivers` },
    { name: 'Account Information', href: `${baseUrl}/account-information` },
    { name: 'Payment', href: `${baseUrl}/payment` },
    { name: 'Route Information', href: `${baseUrl}/route-information` },
  ];

  const isDarkTheme = theme === 'dark';

  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useClickOutside(popoverRef, closeMenu);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu();
      }
    },
    [closeMenu, toggleMenu]
  );

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ redirect: false });
      router.push('/');
      setIsLoggingOut(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={popoverRef}
    >
      <button
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls="hauler-popover-menu"
        aria-label="Toggle hauler account menu"
        aria-haspopup="menu"
        className={`group flex text-sm cursor-pointer items-center gap-1 py-2.5 px-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isDarkTheme
            ? 'text-text-inverse hover:bg-primary-hover active:bg-primary-active focus-visible:ring-text-inverse'
            : 'text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled focus-visible:ring-primary'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-5" aria-hidden="true" />
        ) : (
          <Bars3Icon className="w-5" aria-hidden="true" />
        )}
      </button>

      <div
        id="hauler-popover-menu"
        role="menu"
        aria-label="Hauler account menu"
        className={`absolute min-w-48 right-0 z-10 mt-4 origin-top-right bg-surface-primary rounded-md shadow-custom-shadow ring-1 ring-inset ring-border transition-transform transition-opacity duration-200 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ul role="list">
          {menuOptions.map(option => (
            <li key={option.name} role="listitem">
              <Link
                href={option.href}
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
                aria-label={`Navigate to ${option.name}`}
                className="group flex h-10 space-x-4 items-center p-4 text-nowrap text-sm cursor-pointer text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={closeMenu}
              >
                <p className="text-sm">{option.name}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex border-t border-border h-12 items-center justify-center px-4 py-3 text-nowrap text-sm cursor-pointer text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            role="menuitem"
            tabIndex={isOpen ? 0 : -1}
            aria-label={
              isLoggingOut ? 'Logging out' : 'Log out of your account'
            }
            className="w-full text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded"
          >
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
};
