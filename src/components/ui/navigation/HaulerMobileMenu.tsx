'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid';
import { signOut } from 'next-auth/react';

interface HaulerMobileMenuProps {
  className?: string;
  theme?: 'dark' | 'light';
  userId: string;
}

export const HaulerMobileMenu: React.FC<HaulerMobileMenuProps> = ({
  className,
  theme = 'dark',
  userId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const isDarkTheme = theme === 'dark';
  const pathname = usePathname();
  const router = useRouter();

  const baseUrl = `/service-provider/hauler/${userId}`;

  const menuOptions = [
    { name: 'Home', href: baseUrl },
    { name: 'Jobs', href: `${baseUrl}/jobs` },
    { name: 'Work Schedule', href: `${baseUrl}/calendar` },
    { name: 'Truck & Trailer', href: `${baseUrl}/vehicle` },
    { name: 'Drivers', href: `${baseUrl}/drivers` },
    { name: 'Account Information', href: `${baseUrl}/account-information` },
    { name: 'Route Pricing', href: `${baseUrl}/route-pricing` },
    { name: 'Payment', href: `${baseUrl}/payment` },
  ];

  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex text-sm cursor-pointer items-center gap-1 py-2.5 px-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isDarkTheme
            ? 'bg-primary-hover text-text-inverse active:bg-primary-active focus-visible:ring-text-inverse'
            : 'text-text-primary active:bg-surface-tertiary focus-visible:ring-primary'
        }`}
        aria-label="Toggle hauler navigation menu"
        aria-expanded={isOpen}
        aria-controls="hauler-mobile-navigation-menu"
      >
        {isOpen ? (
          <XMarkIcon className="w-5" aria-hidden="true" />
        ) : (
          <Bars3Icon className="w-5" aria-hidden="true" />
        )}
      </button>

      <div
        id="hauler-mobile-navigation-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Hauler mobile navigation menu"
        className={`fixed inset-0 top-16 bg-surface-primary flex z-20 transition-all duration-500 overflow-hidden ${
          isOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <nav
          className="text-text-primary w-full"
          role="navigation"
          aria-label="Hauler mobile navigation"
        >
          <ul className="mt-2" role="list">
            {menuOptions.map(option => (
              <li key={option.name} role="listitem">
                <Link
                  href={option.href}
                  className="group flex space-x-4 items-center p-6 text-nowrap cursor-pointer border-b border-border hover:bg-surface-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  aria-label={`Navigate to ${option.name}`}
                >
                  <p className="text-text-primary text-3xl group-hover:text-primary">
                    {option.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex p-6 mt-2 gap-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={
                isLoggingOut ? 'Logging out' : 'Log out of your account'
              }
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
