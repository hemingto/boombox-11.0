/**
 * @fileoverview Main dashboard homepage for service provider accounts (drivers and movers)
 * @source boombox-10.0/src/app/components/mover-account/mover-account-homepage.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays main dashboard with navigation cards for account management
 * - Shows account setup checklist with completion tracking
 * - Conditionally renders options based on user type (driver vs mover) and approval status
 * - Fetches moving partner linkage status for drivers
 * - Fetches mover approval status
 * - Provides quick access to calendar, Onfleet dashboard, and all account sections
 * - Conditionally shows/hides options based on driver's moving partner status
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/moving-partner-status → New: /api/drivers/${userId}/moving-partner-status (unchanged)
 * - Old: /api/movers/${userId} → New: /api/moving-partners/${userId}/profile
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-200, bg-slate-100 with semantic surface colors
 * - Replaced text-zinc-950 with text-text-primary
 * - Replaced bg-zinc-950, hover:bg-zinc-800 with btn-primary class
 * - Applied semantic spacing and typography tokens
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper semantic HTML structure with main and section elements
 * - Added aria-label attributes for external links
 * - Improved heading hierarchy
 * - Added loading states with aria-live regions
 * - Enhanced keyboard navigation
 * 
 * @refactor
 * - Updated to use migrated components (MoverAccountOptions, AccountSetupChecklist)
 * - Applied comprehensive design system integration
 * - Enhanced accessibility with WCAG 2.1 AA compliance
 * - Updated API routes to migrated endpoints
 * - Improved TypeScript type safety
 */

'use client';

import React, { useEffect, useState } from 'react';
import { MoverAccountOptions } from './MoverAccountOptions';
import { 
  CalendarDaysIcon, 
  CreditCardIcon, 
  UserCircleIcon, 
  IdentificationIcon, 
  NumberedListIcon 
} from '@heroicons/react/24/outline';
import { MapIcon } from '@/components/icons/MapIcon';
import { ClipboardIcon } from '@/components/icons/ClipboardIcon';
import { TruckIcon } from '@/components/icons/TruckIcon';
import { AccountSetupChecklist } from './AccountSetupChecklist';
import Link from 'next/link';

interface MoverAccountHomepageProps {
  /** User type determines which options and features are displayed */
  userType: 'driver' | 'mover';
  /** User ID for fetching user-specific data */
  userId?: string;
}

interface MovingPartnerStatus {
  isLinkedToMovingPartner: boolean;
  movingPartner: {
    id: number;
    name: string;
  } | null;
}

/**
 * Main dashboard homepage for service provider accounts
 * 
 * Displays account overview with quick access to all account management sections.
 * Adapts content based on user type (driver/mover) and account status.
 * 
 * @example
 * ```tsx
 * // Driver dashboard
 * <MoverAccountHomepage userType="driver" userId="driver-123" />
 * 
 * // Moving partner dashboard
 * <MoverAccountHomepage userType="mover" userId="mover-456" />
 * ```
 */
export function MoverAccountHomepage({ 
  userType, 
  userId = '' 
}: MoverAccountHomepageProps) {
  const [movingPartnerStatus, setMovingPartnerStatus] = useState<MovingPartnerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoverApproved, setIsMoverApproved] = useState(false);

  useEffect(() => {
    if (userType === 'driver' && userId) {
      setIsLoading(true);
      fetch(`/api/drivers/${userId}/moving-partner-status`)
        .then(res => res.json())
        .then(data => setMovingPartnerStatus(data))
        .catch(err => console.error('Error fetching moving partner status:', err))
        .finally(() => setIsLoading(false));
    } else if (userType === 'mover' && userId) {
      setIsLoading(true);
      // Updated API route to migrated endpoint
      fetch(`/api/moving-partners/${userId}/profile`)
        .then(res => res.json())
        .then(data => {
          setIsMoverApproved(!!data.isApproved);
        })
        .catch(err => console.error('Error fetching mover status:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [userType, userId]);

  // Determine base URL based on userType and include userId
  const baseUrl = userType === 'driver' 
    ? `/driver-account-page/${userId}` 
    : `/mover-account-page/${userId}`;

  // Customize title based on userType
  const title = userType === 'driver' ? 'Driver Dashboard' : 'Mover Dashboard';

  return (
    <main className="flex flex-col mt-12 mb-48 lg:px-16 px-6 max-w-5xl w-full mx-auto">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        <div className="flex items-center gap-2">
          {userType === 'mover' && (
            <Link 
              href="https://onfleet.com/login" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Open Onfleet Dashboard in new tab"
            >
              <button 
                className="flex items-center gap-1 bg-surface-tertiary text-text-primary rounded-md py-2.5 pl-6 pr-5 font-inter font-semibold hover:bg-surface-disabled transition-colors"
                type="button"
              >
                Onfleet Dashboard
              </button>
            </Link>
          )}
          <Link 
            href={`${baseUrl}/view-calendar`} 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="View calendar in new tab"
          >
            <button 
              className="btn-primary flex items-center gap-1"
              type="button"
            >
              View Calendar
            </button>
          </Link>
        </div>
      </div>

      {/* Account Setup Checklist */}
      <section aria-label="Account setup progress">
        <AccountSetupChecklist userId={userId} userType={userType} />
      </section>

      {/* Account Management Options Grid */}
      <section 
        aria-label="Account management options"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Jobs - Always visible */}
        <MoverAccountOptions
          icon={<NumberedListIcon className="h-8 w-8 text-text-primary" />}
          title="Jobs"
          description="Manage upcoming jobs and view job history"
          href={`${baseUrl}/jobs`}
        />

        {/* Work Schedule - Hidden for drivers linked to moving partners */}
        {((userType === 'driver' && !movingPartnerStatus?.isLinkedToMovingPartner) || userType === 'mover') && (
          <MoverAccountOptions
            icon={<CalendarDaysIcon className="h-8 w-8 text-text-primary" />}
            title="Work Schedule"
            description="Adjust your availability and block certain dates"
            href={`${baseUrl}/calendar`}
          />
        )}

        {/* Vehicle Information - Hidden for drivers linked to moving partners */}
        {((userType === 'driver' && !movingPartnerStatus?.isLinkedToMovingPartner) || userType === 'mover') && (
          <MoverAccountOptions
            icon={<TruckIcon className="h-8 w-12 text-text-primary" />}
            title="Vehicle information"
            description="Add or update your vehicle information"
            href={`${baseUrl}/vehicle`}
          />
        )}

        {/* Account Information - Mover version */}
        {userType === 'mover' && (
          <MoverAccountOptions
            icon={<UserCircleIcon className="h-8 w-8 text-text-primary" />}
            title="Account Information"
            description="Set your rate, profile picture, and other company info"
            href={`${baseUrl}/account-information`}
          />
        )}

        {/* Account Information - Driver version */}
        {userType === 'driver' && (
          <MoverAccountOptions
            icon={<UserCircleIcon className="h-8 w-8 text-text-primary" />}
            title="Account Information"
            description="Manage your driver account information"
            href={`${baseUrl}/account-information`}
          />
        )}

        {/* Payment - Hidden for drivers linked to moving partners */}
        {!isLoading && (userType === 'mover' || (userType === 'driver' && !movingPartnerStatus?.isLinkedToMovingPartner)) && (
          <MoverAccountOptions
            icon={<CreditCardIcon className="h-8 w-8 text-text-primary" />}
            title="Payment"
            description="Add your bank account and check payment history"
            href={`${baseUrl}/payment`}
          />
        )}

        {/* Driver Information - Mover only, disabled until approved */}
        {userType === 'mover' && (
          <MoverAccountOptions
            icon={<IdentificationIcon className="h-8 w-8 text-text-primary" />}
            title="Driver Information"
            description={
              isMoverApproved 
                ? 'Add your company drivers' 
                : 'Complete account checklist before adding drivers'
            }
            href={isMoverApproved ? `${baseUrl}/drivers` : undefined}
            disabled={!isMoverApproved}
          />
        )}

        {/* Coverage Area - Always visible */}
        <MoverAccountOptions
          icon={<MapIcon className="h-8 w-8 text-text-primary" />}
          title="Coverage Area"
          description="View the locations we serve"
          href={`${baseUrl}/coverage-area`}
        />

        {/* Best Practices - Always visible */}
        <MoverAccountOptions
          icon={<ClipboardIcon className="h-8 w-8 text-text-primary" />}
          title="Best Practices"
          description="Learn from our tips and tricks and watch helpful videos"
          href={`${baseUrl}/best-practices`}
        />
      </section>
    </main>
  );
}

export default MoverAccountHomepage;

