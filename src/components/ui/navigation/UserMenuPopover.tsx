/**
 * @fileoverview UserMenuPopover - User account dropdown menu
 * @source boombox-10.0/src/app/components/navbar/UserMenuPopover.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides dropdown menu for authenticated users with account navigation links
 * and logout functionality. Features user-specific menu items and proper
 * session management with enhanced accessibility.
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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bars3Icon, XMarkIcon } from "@heroicons/react/20/solid";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from "next-auth/react";
import { useClickOutside } from '@/hooks/useClickOutside';

interface UserMenuPopoverProps {
    userId: string;
    className?: string;
    theme?: 'dark' | 'light';
}

export const UserMenuPopover: React.FC<UserMenuPopoverProps> = ({ userId, className, theme = 'dark' }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const menuOptions = [
        { name: "Home", href: `/user-page/${userId}` }, // Fixed template literal
        { name: "Add storage unit", href: `/user-page/${userId}/add-storage` }, // Dynamically include userId
        { name: "Access storage", href: `/user-page/${userId}/access-storage` },
        { name: "Packing supplies", href: `/user-page/${userId}/packing-supplies` },
        { name: "Payments", href: `/user-page/${userId}/payments` },
        { name: "Account info", href: `/user-page/${userId}/account-info` },
      ];

    const isDarkTheme = theme === 'dark';

    const toggleMenu = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const closeMenu = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Close menu when clicking outside
    useClickOutside(popoverRef, closeMenu);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            closeMenu();
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMenu();
        }
    }, [closeMenu, toggleMenu]);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut({ redirect: false });
            router.push('/');
            setIsLoggingOut(false);
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Failed to log out. Please try again.');
            setIsLoggingOut(false);
        }
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={popoverRef}>
            <button
                onClick={toggleMenu}
                onKeyDown={handleKeyDown}
                aria-expanded={isOpen}
                aria-controls="user-popover-menu"
                aria-label="Toggle user account menu"
                aria-haspopup="menu"
                className={`group flex text-sm cursor-pointer items-center gap-1 py-2.5 px-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
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
                id="user-popover-menu"
                role="menu"
                aria-label="User account menu"
                className={`absolute min-w-48 right-0 z-10 mt-4 origin-top-right bg-surface-primary rounded-md shadow-custom-shadow ring-1 ring-inset ring-border transition-transform transition-opacity duration-200 ease-out ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                <ul className="" role="list">
                    {menuOptions.map((option) => (
                        <li key={option.name} role="listitem">
                            <Link 
                                href={option.href}
                                role="menuitem"
                                tabIndex={isOpen ? 0 : -1}
                                aria-label={`Navigate to ${option.name}`}
                                className="group flex h-10 space-x-4 items-center p-4 text-nowrap text-sm cursor-pointer text-text-secondary hover:bg-surface-tertiary active:bg-surface-disabled group-hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset transition-colors"
                                onClick={closeMenu}
                            >
                                <p className="text-sm">{option.name}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
                
                <div
                    className="flex border-t border-border h-12 items-center justify-center text-nowrap text-sm cursor-pointer text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled transition-colors"
                >
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        role="menuitem"
                        tabIndex={isOpen ? 0 : -1}
                        aria-label={isLoggingOut ? 'Logging out' : 'Log out of your account'}
                        className="w-full px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded transition-colors"
                    >
                        <p className="text-sm">{isLoggingOut ? 'Logging out...' : 'Log Out'}</p>
                    </button>
                </div>
            </div>
        </div>
    );
};
