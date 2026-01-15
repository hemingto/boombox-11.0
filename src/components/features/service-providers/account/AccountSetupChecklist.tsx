/**
 * @fileoverview Account setup checklist for service providers
 * @source boombox-10.0/src/app/components/mover-account/accountsetupchecklist.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays account setup progress checklist for both drivers and moving partners.
 * Shows different checklists based on user type and approval status.
 * Auto-updates application complete status when checklist is finished.
 * 
 * ACCOUNT TYPES SUPPORTED:
 * - Driver accounts (userType="driver")
 * - Moving partner accounts (userType="mover")
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced amber-* colors with status-warning semantic tokens
 * - Replaced emerald-* colors with status-success semantic tokens
 * - Replaced red-* colors with status-error semantic tokens
 * - Applied semantic surface and text colors throughout
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/[id] → New: /api/drivers/[id]/profile
 * - Old: /api/movers/[id] → New: /api/moving-partners/[id]/profile
 * - Old: /api/drivers/[id]/application-complete → New: /api/drivers/[id]/application-complete
 * - Old: /api/movers/[id]/application-complete → New: /api/moving-partners/[id]/application-complete
 * - Old: /api/movers/[id]/approved-drivers → New: /api/moving-partners/[id]/approved-drivers
 * - Old: /api/movers/[id]/update-status → New: /api/moving-partners/[id]/update-status
 * 
 * @refactor Migrated to service-providers structure with extracted business logic
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useAccountSetupChecklist } from '@/hooks/useAccountSetupChecklist';
import {
  isMoverChecklist,
  isDriverChecklist,
  isChecklistComplete as checkIfChecklistComplete,
} from '@/lib/services/accountSetupChecklistUtils';
import { TermsOfServicePopup } from '@/components/features/service-providers/shared/TermsOfServicePopup';

interface AccountSetupChecklistProps {
  userId: string;
  userType: 'driver' | 'mover';
}

export function AccountSetupChecklist({
  userId,
  userType,
}: AccountSetupChecklistProps) {
  const [isTermsPopupOpen, setIsTermsPopupOpen] = useState(false);

  const {
    checklistStatus,
    isApproved,
    status,
    hasMovingPartner,
    activeMessageShown,
    isLoading,
    error,
    refetch,
  } = useAccountSetupChecklist({ userId, userType });

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTermsPopupOpen(true);
  };

  const handleTermsAgree = async () => {
    setIsTermsPopupOpen(false);
    // Refetch to update checklist status
    await refetch();
  };

  // If driver is approved, don't render the checklist
  if (isApproved && userType === 'driver') {
    return null;
  }

  // Check if checklist is complete
  const isChecklistComplete = checklistStatus
    ? checkIfChecklistComplete(checklistStatus, userType, isApproved, hasMovingPartner)
    : false;

  // Loading state - return null to show nothing while loading
  if (isLoading) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-status-bg-error border border-border-error rounded-xl p-8 mb-8">
        <h2 className="text-status-error text-xl mb-2">
          Error loading checklist
        </h2>
        <p className="text-status-error">{error}</p>
      </div>
    );
  }

  // Completion states for movers
  if (isChecklistComplete && userType === 'mover') {
    // Active status - show message only if not yet shown
    if (status === 'ACTIVE' && !activeMessageShown) {
      return (
        <div className="bg-status-bg-success rounded-xl p-6 mb-8 animate-slideDown">
          <h2 className="text-status-success text-base font-semibold mb-1">
            Your account is now active!
          </h2>
          <p className="text-status-success text-base">
            You can now start accepting jobs on Boombox!
          </p>
        </div>
      );
    }

    // Active status without showing message - hide checklist since account is active
    if (status === 'ACTIVE' && activeMessageShown) {
      return null;
    }

    // Approved status - needs to add drivers
    if (status === 'APPROVED') {
      return (
        <div className="bg-status-bg-warning border border-border-warning rounded-xl p-6 mb-8 animate-slideDown">
          <h2 className="text-status-warning text-base font-semibold mb-1">
            Last Step
          </h2>
          <p className="text-status-warning text-base">
            Add drivers to start accepting jobs on Boombox
          </p>
        </div>
      );
    }

    // Pending status - under review
    if (status === 'PENDING') {
      return (
        <div className="bg-status-bg-info border border-border-info rounded-xl p-6 mb-8 animate-slideDown">
          <h2 className="text-status-info text-base font-semibold mb-1">
            Account Status Pending
          </h2>
          <p className="text-status-info text-base">
            We are looking over your application and will respond within the next
            few days
          </p>
        </div>
      );
    }

    // Inactive status with complete checklist - auto-update to ACTIVE should trigger
    // Don't show any message - let the auto-update handle the transition
    if (status === 'INACTIVE' && isApproved) {
      return null;
    }
  }

  // Completion state for drivers
  if (isChecklistComplete && userType === 'driver') {
    return (
      <div className="bg-status-bg-success rounded-xl p-6 mb-8 animate-slideDown">
        <h2 className="text-status-success text-base font-semibold mb-1">
          You&rsquo;re all set!
        </h2>
        <p className="text-status-success text-base">
          You have completed your application. We will review your application and
          get back to you within the next few days
        </p>
      </div>
    );
  }

  // Render checklist
  if (!checklistStatus) {
    return null;
  }

  return (
    <div className="bg-status-bg-warning border border-border-warning rounded-xl p-6 mb-8 animate-slideDown">
      {/* Header */}
      {userType === 'mover' && isMoverChecklist(checklistStatus) ? (
        <>
          {isApproved ? (
            <>
              <h2 className="text-status-warning text-base font-semibold mb-1">
                Last Step
              </h2>
              <p className="text-status-warning mb-4">
                Add drivers to start accepting jobs on Boombox
              </p>
            </>
          ) : (
            <>
              <h2 className="text-status-warning text-base font-semibold mb-1">
                Account Setup Checklist
              </h2>
              <p className="text-status-warning text-base mb-4">
                Complete the tasks below in order to activate your account
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <h2 className="text-status-warning text-base font-semibold mb-1">
            Account Setup Checklist
          </h2>
          <p className="text-status-warning text-base mb-4">
            Complete the tasks below in order to activate your account
          </p>
        </>
      )}

      {/* Checklist Items */}
      <div className="space-y-3">
        {userType === 'mover' && isMoverChecklist(checklistStatus) ? (
          <>
            {isApproved ? (
              <ChecklistItem
                completed={checklistStatus.approvedDrivers}
                label="Add approved drivers"
                href={`/service-provider/${userType}/${userId}/drivers`}
              />
            ) : (
              <>
                <ChecklistItem
                  completed={checklistStatus.companyDescription}
                  label="Add a company description"
                  href={`/service-provider/${userType}/${userId}/account-information`}
                />
                <ChecklistItem
                  completed={checklistStatus.companyPicture}
                  label="Add company picture or logo"
                  href={`/service-provider/${userType}/${userId}/account-information`}
                />
                <ChecklistItem
                  completed={checklistStatus.phoneVerified}
                  label="Verify your phone number"
                  href={`/service-provider/${userType}/${userId}/account-information`}
                />
                <ChecklistItem
                  completed={checklistStatus.hourlyRate}
                  label="Set your hourly rate"
                  href={`/service-provider/${userType}/${userId}/account-information`}
                />
                <ChecklistItem
                  completed={checklistStatus.approvedVehicles}
                  label="Add approved vehicles"
                  href={`/service-provider/${userType}/${userId}/vehicle`}
                />
                <ChecklistItem
                  completed={checklistStatus.calendarSet}
                  label="Set your calendar and team capacity"
                  href={`/service-provider/${userType}/${userId}/calendar`}
                />
                <ChecklistItem
                  completed={checklistStatus.bankAccountLinked}
                  label="Link your bank account"
                  href={`/service-provider/${userType}/${userId}/payment`}
                />
                <ChecklistItem
                  completed={checklistStatus.termsOfServiceReviewed}
                  label={
                    <>
                      Review{' '}
                      <Link
                        href="/terms-of-service"
                        onClick={handleTermsClick}
                        className="text-status-warning underline decoration-dotted hover:decoration-solid underline-offset-4"
                      >
                        terms of service
                      </Link>
                    </>
                  }
                />
              </>
            )}
          </>
        ) : (
          isDriverChecklist(checklistStatus) && (
            <>
              <ChecklistItem
                completed={checklistStatus.profilePicture}
                label="Add a profile picture"
                href={`/service-provider/${userType}/${userId}/account-information`}
              />
              <ChecklistItem
                completed={checklistStatus.driversLicense}
                label="Add driver&rsquo;s license photos"
                href={`/service-provider/${userType}/${userId}/account-information`}
              />
              <ChecklistItem
                completed={checklistStatus.phoneVerified}
                label="Verify your phone number"
                href={`/service-provider/${userType}/${userId}/account-information`}
              />
              {!hasMovingPartner && (
                <>
                  <ChecklistItem
                    completed={checklistStatus.approvedVehicle || false}
                    label="Add an approved vehicle"
                    href={`/service-provider/${userType}/${userId}/vehicle`}
                  />
                  <ChecklistItem
                    completed={checklistStatus.workSchedule || false}
                    label="Set your work schedule"
                    href={`/service-provider/${userType}/${userId}/calendar`}
                  />
                  <ChecklistItem
                    completed={checklistStatus.bankAccountLinked || false}
                    label="Link your bank account"
                    href={`/service-provider/${userType}/${userId}/payment`}
                  />
                </>
              )}
              <ChecklistItem
                completed={checklistStatus.termsOfServiceReviewed}
                label={
                  <>
                    Review{' '}
                    <Link
                      href="/terms-of-service"
                      onClick={handleTermsClick}
                      className="text-status-warning underline decoration-dotted underline-offset-4"
                    >
                      terms of service
                    </Link>
                  </>
                }
              />
            </>
          )
        )}
      </div>

      {/* Terms of Service Popup */}
      <TermsOfServicePopup
        isOpen={isTermsPopupOpen}
        onClose={() => setIsTermsPopupOpen(false)}
        onAgree={handleTermsAgree}
        userId={userId}
        userType={userType}
      />
    </div>
  );
}

/**
 * Checklist item component
 */
interface ChecklistItemProps {
  completed: boolean;
  label: React.ReactNode;
  href?: string;
}

function ChecklistItem({ completed, label, href }: ChecklistItemProps) {
  const content = (
    <>
      {completed ? (
        <div className="w-5 h-5 bg-status-warning rounded-full flex items-center justify-center mr-4 shrink-0">
          <CheckIcon className="h-4 w-4 text-white" />
        </div>
      ) : (
        <div className="h-5 w-5 border-2 border-status-warning rounded-full mr-4 shrink-0"></div>
      )}
      <span
        className={`text-sm text-status-warning ${
          completed ? 'line-through' : ''
        }`}
      >
        {label}
      </span>
    </>
  );

  // Render as plain div if completed or no href
  if (!href || completed) {
    return <div className="flex items-start">{content}</div>;
  }

  // Render as interactive link only when incomplete
  return (
    <Link
      href={href}
      className="flex items-start hover:underline decoration-dotted text-status-warning focus:decoration-solid underline-offset-4"
    >
      {content}
    </Link>
  );
}

