/**
 * @fileoverview CompleteUserPage - Main user dashboard container component
 * @source boombox-10.0/src/app/components/user-page/completeuserpage.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 * 
 * COMPONENT FUNCTIONALITY:
 * Top-level orchestration component for the user dashboard page.
 * Coordinates all dashboard sections including info cards, upcoming appointments,
 * packing supply orders, and storage units. Manages state and navigation for the entire page.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic text colors (text-text-primary, text-text-secondary)
 * - Updated button icon colors to use design system tokens
 * - Replaced hardcoded gray colors with semantic color classes
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Uses migrated child components from Phase 1-3
 * - Centralized storage unit checking via customerUtils
 * - Proper TypeScript interfaces for all props and callbacks
 * - State management with proper loading handling
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDateRangeIcon, LockOpenIcon } from '@heroicons/react/20/solid';
import { UpcomingAppointments } from '@/components/features/customers/UpcomingAppointments';
import { UpcomingPackingSupplyOrders } from '@/components/features/customers/UpcomingPackingSupplyOrders';
import { UserPageInfoCards } from '@/components/features/customers/UserPageInfoCards';
import { YourStorageUnits } from '@/components/features/customers/YourStorageUnits';
import { InfoCard } from '@/components/ui/primitives/InfoCard';
import { hasActiveStorageUnits } from '@/lib/utils/customerUtils';

export interface CompleteUserPageProps {
  userId: string;
}

/**
 * CompleteUserPage - Main user dashboard container
 * 
 * Orchestrates all sections of the user dashboard:
 * - Info cards for actions (add storage, access storage)
 * - Upcoming appointments section
 * - Upcoming packing supply orders
 * - Active storage units
 * 
 * Manages loading states and conditional rendering based on user data
 */
export const CompleteUserPage: React.FC<CompleteUserPageProps> = ({ userId }) => {
  const router = useRouter();
  const [hasStorage, setHasStorage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPackingSupplyOrders, setHasPackingSupplyOrders] = useState(false);
  const [hasAppointments, setHasAppointments] = useState(false);
  const [packingSupplyLoading, setPackingSupplyLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  // Check if user has active storage units
  useEffect(() => {
    const checkStorageUnits = async () => {
      try {
        const hasUnits = await hasActiveStorageUnits(userId);
        setHasStorage(hasUnits);
      } catch (error) {
        console.error('Error checking storage units:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStorageUnits();
  }, [userId]);

  // Callback handlers for child component state updates
  const handlePackingSupplyOrdersState = (hasOrders: boolean, loading: boolean) => {
    setHasPackingSupplyOrders(hasOrders);
    setPackingSupplyLoading(loading);
  };

  const handleAppointmentsState = (hasAppts: boolean, loading: boolean) => {
    setHasAppointments(hasAppts);
    setAppointmentsLoading(loading);
  };

  // Navigation handlers
  const handleAddStorageClick = () => {
    router.push(`/user-page/${userId}/add-storage`);
  };

  const handleAccessStorageClick = () => {
    router.push(`/user-page/${userId}/access-storage`);
  };

  // Conditional rendering logic
  const showNoUpcomingMessage = 
    !packingSupplyLoading && 
    !appointmentsLoading && 
    !hasPackingSupplyOrders && 
    !hasAppointments;

  const showInfoCards = 
    !packingSupplyLoading && 
    !appointmentsLoading && 
    !hasPackingSupplyOrders && 
    !hasAppointments;

  return (
    <>
      {/* User info cards section */}
      <UserPageInfoCards userId={userId} />
      
      {/* Main content section */}
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto sm:mb-8 mb-6">
        {/* Action cards - shown when no upcoming items */}
        {showInfoCards && (
          <div className="flex flex-col sm:mb-10 mb-8">
            <InfoCard
              title="Need more storage space?"
              description="No problem! We've got you covered. Book an appointment for a storage unit to be delivered right to your door."
              buttonText="Book a storage unit"
              buttonIcon={<CalendarDateRangeIcon className="w-5 h-5 text-text-primary" />}
              onButtonClick={handleAddStorageClick}
              showCloseIcon={false}
            />
            {hasStorage && (
              <InfoCard
                title="Need access to your storage unit?"
                description="Sure thing! We'll bring your storage unit to you, so you can add or remove items as needed."
                buttonText="Access your storage unit"
                buttonIcon={<LockOpenIcon className="w-5 h-5 text-text-primary" />}
                onButtonClick={handleAccessStorageClick}
                showCloseIcon={false}
              />
            )}
          </div>
        )}

        {/* Upcoming section header */}
        <h2 className="text-2xl font-semibold sm:mb-4 mb-2 text-text-primary">
          Upcoming
        </h2>
        
        {/* Empty state message */}
        {showNoUpcomingMessage && (
          <p className="text-text-secondary sm:mb-4 mb-2">
            You have no upcoming appointments.
          </p>
        )}
        
        {/* Upcoming packing supply orders */}
        <UpcomingPackingSupplyOrders 
          userId={userId} 
          onStateChange={handlePackingSupplyOrdersState}
        />
        
        {/* Upcoming appointments */}
        <UpcomingAppointments 
          userId={userId} 
          hasActiveStorageUnits={hasStorage}
          onStateChange={handleAppointmentsState}
        />
      </div>

      {/* Storage units section */}
      <YourStorageUnits userId={userId} />
    </>
  );
};

