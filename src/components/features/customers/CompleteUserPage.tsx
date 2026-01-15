/**
 * @fileoverview CompleteUserPage - Main user dashboard container component
 * @source boombox-10.0/src/app/components/user-page/completeuserpage.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 * 
 * COMPONENT FUNCTIONALITY:
 * Top-level orchestration component for the user dashboard page.
 * Coordinates all dashboard sections including info cards, upcoming appointments,
 * packing supply orders, and storage units.
 * 
 * ARCHITECTURE:
 * - Uses centralized data hook (useCustomerHomePageData) for page-level loading
 * - Shows page-level skeleton during loading to prevent layout shift
 * - Passes fetched data as props to child components
 * - Conditionally renders sections only when data exists
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic text colors (text-text-primary, text-text-secondary)
 * - Updated button icon colors to use design system tokens
 * - Replaced hardcoded gray colors with semantic color classes
 */

'use client';

import { useRouter } from 'next/navigation';
import { CalendarDateRangeIcon, LockOpenIcon } from '@heroicons/react/20/solid';
import { UpcomingAppointments } from '@/components/features/customers/UpcomingAppointments';
import { UpcomingPackingSupplyOrders } from '@/components/features/customers/UpcomingPackingSupplyOrders';
import { UserPageInfoCards } from '@/components/features/customers/UserPageInfoCards';
import { YourStorageUnits } from '@/components/features/customers/YourStorageUnits';
import { CustomerHomePageSkeleton } from '@/components/features/customers/CustomerHomePageSkeleton';
import { InfoCard } from '@/components/ui/primitives/InfoCard';
import { useCustomerHomePageData } from '@/hooks/useCustomerHomePageData';

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
 * Uses page-level loading to prevent layout shift
 */
export const CompleteUserPage: React.FC<CompleteUserPageProps> = ({ userId }) => {
  const router = useRouter();
  
  const {
    appointments,
    packingSupplyOrders,
    storageUnits,
    hasActiveStorage,
    isLoading,
    error,
    setAppointments,
    setPackingSupplyOrders,
    setStorageUnits,
  } = useCustomerHomePageData({ userId });

  // Navigation handlers
  const handleAddStorageClick = () => {
    router.push(`/customer/${userId}/add-storage`);
  };

  const handleAccessStorageClick = () => {
    router.push(`/customer/${userId}/access-storage`);
  };

  // Show skeleton during initial load
  if (isLoading) {
    return <CustomerHomePageSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-5xl lg:px-16 px-6 mx-auto">
        <div
          className="bg-status-error/10 p-4 mb-4 border border-status-error rounded-md"
          role="alert"
        >
          <p className="text-sm text-status-error">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-status-error underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Determine what to show based on data
  const hasUpcomingItems = appointments.length > 0 || packingSupplyOrders.length > 0;
  const showInfoCards = !hasUpcomingItems;

  return (
    <>
      {/* User info cards section */}
      <UserPageInfoCards userId={userId} appointments={appointments} />
      
      {/* Main content section */}
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto sm:mb-8 mb-6">
        {/* Action cards - shown when no upcoming items */}
        {showInfoCards && (
          <div className="flex flex-col">
            <InfoCard
              title="Need more storage space?"
              description="No problem! We've got you covered. Book an appointment for a storage unit to be delivered right to your door."
              buttonText="Book a storage unit"
              buttonIcon={<CalendarDateRangeIcon className="w-5 h-5 text-text-primary" />}
              onButtonClick={handleAddStorageClick}
              showCloseIcon={false}
            />
            {hasActiveStorage && (
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

        {/* Upcoming section - only show if there are upcoming items */}
        {hasUpcomingItems && (
          <>
            <h2 className="text-2xl font-semibold sm:mb-4 mb-2 text-text-primary mt-8 sm:mt-8">
              Upcoming
            </h2>
            
            {/* Upcoming packing supply orders */}
            {packingSupplyOrders.length > 0 && (
              <UpcomingPackingSupplyOrders 
                userId={userId}
                orders={packingSupplyOrders}
                onOrdersChange={setPackingSupplyOrders}
              />
            )}
            
            {/* Upcoming appointments */}
            {appointments.length > 0 && (
              <UpcomingAppointments 
                userId={userId}
                appointments={appointments}
                hasActiveStorageUnits={hasActiveStorage}
                onAppointmentsChange={setAppointments}
              />
            )}
          </>
        )}
      </div>

      {/* Storage units section - only show if there are storage units */}
      {storageUnits.length > 0 && (
        <YourStorageUnits 
          userId={userId}
          storageUnits={storageUnits}
          onStorageUnitsChange={setStorageUnits}
        />
      )}
    </>
  );
};
