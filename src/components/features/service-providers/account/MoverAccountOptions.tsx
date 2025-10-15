/**
 * @fileoverview Clickable card option component for mover account navigation
 * @source boombox-10.0/src/app/components/mover-account/moveraccountoptions.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Reusable card component that displays account management options with icons, titles, and descriptions.
 * Supports both link navigation and disabled states. Used for organizing mover account settings and actions.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced text-zinc-950 with text-text-primary
 * - Replaced text-zinc-500 with text-text-secondary
 * - Replaced bg-white with bg-surface-primary
 * - Uses semantic color tokens throughout
 * - Maintains shadow-custom-shadow from design system
 * 
 * @refactor Renamed to PascalCase, applied design system colors, enhanced accessibility with ARIA attributes
 */

import React, { ReactNode } from 'react';
import Link from 'next/link';

interface MoverAccountOptionsProps {
  /** Icon element to display at the top of the card */
  icon: ReactNode;
  /** Main title/heading for the option */
  title: string;
  /** Descriptive text explaining the option */
  description: string;
  /** Optional URL for navigation - if not provided, renders as non-clickable */
  href?: string;
  /** Whether the option should be disabled (not clickable) */
  disabled?: boolean;
}

/**
 * Account option card component for mover navigation
 * 
 * Displays a card with icon, title, and description that can link to account management pages.
 * Supports hover effects when enabled and provides visual feedback for disabled states.
 * 
 * @example
 * ```tsx
 * <MoverAccountOptions
 *   icon={<CalendarIcon />}
 *   title="Manage Availability"
 *   description="Set your working hours and availability"
 *   href="/mover/availability"
 * />
 * ```
 * 
 * @example Disabled state
 * ```tsx
 * <MoverAccountOptions
 *   icon={<LockIcon />}
 *   title="Premium Features"
 *   description="Upgrade to access premium tools"
 *   disabled={true}
 * />
 * ```
 */
export function MoverAccountOptions({ 
  icon, 
  title, 
  description, 
  href, 
  disabled = false 
}: MoverAccountOptionsProps) {
  const buttonContent = (
    <button
      type="button"
      className={`w-full h-40 sm:h-48 text-left rounded-2xl bg-surface-primary shadow-custom-shadow p-6 flex flex-col items-start transform transition-transform duration-300 ${
        !disabled && 'sm:hover:scale-[102%]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={`${title}: ${description}`}
    >
      <div className="mb-2" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-text-secondary leading-5">
        {description}
      </p>
    </button>
  );

  // If disabled or no href, render button without link wrapper
  if (disabled || !href) {
    return buttonContent;
  }

  // Wrap with Link for navigation
  return (
    <Link 
      href={href}
      className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
      aria-label={`Navigate to ${title}`}
    >
      {buttonContent}
    </Link>
  );
}

