/**
 * @fileoverview UserPageInfoCards component - Displays info cards for customer actions
 * @source boombox-10.0/src/app/components/user-page/userpageinfocards.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 *
 * COMPONENT FUNCTIONALITY:
 * - Receives appointments as props from parent (page-level data fetching)
 * - Displays packing supplies order card for active appointments
 * - Shows move details collection cards for scheduled appointments
 * - Opens MoveDetailsForm modal for providing additional appointment info
 *
 * ARCHITECTURE:
 * - Data is fetched at page level via useCustomerHomePageData hook
 * - Component receives data as props, no internal data fetching
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerAppointmentDisplay } from '@/lib/services/customerDataService';
import { addDateSuffix } from '@/lib/utils';
import { InfoCard } from '@/components/ui/primitives/InfoCard';
import { ClipboardIcon } from '@/components/icons/ClipboardIcon';
import { PackingSuppliesIcon } from '@/components/icons/PackingSuppliesIcon';
import { MoveDetailsForm } from '@/components/features/customers';

export interface UserPageInfoCardsProps {
  userId: string;
  appointments: CustomerAppointmentDisplay[];
}

/**
 * UserPageInfoCards - Container component for displaying action cards
 * 
 * Features:
 * - Displays packing supplies order card for active appointments
 * - Shows move details collection cards for scheduled appointments
 * - Opens MoveDetailsForm modal for providing additional appointment info
 */
export const UserPageInfoCards: React.FC<UserPageInfoCardsProps> = ({ 
  userId,
  appointments,
}) => {
  const [activeAppointmentId, setActiveAppointmentId] = useState<number | null>(null);
  const [showPackingSuppliesCard, setShowPackingSuppliesCard] = useState(true);
  const [localAppointments, setLocalAppointments] = useState(appointments);
  const router = useRouter();

  // Filter for scheduled appointments without additional information
  const scheduledAppointments = localAppointments.filter(
    (apt) => !['Complete', 'Canceled', 'Awaiting Admin Check In'].includes(apt.status) && !apt.hasAdditionalInfo
  );

  const handleUpdateAppointmentInfo = (appointmentId: number) => {
    setLocalAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, hasAdditionalInfo: true } : apt
      )
    );
  };

  const handleMoreInfoClick = (appointmentId: number) => {
    setActiveAppointmentId(appointmentId);
  };

  const handlePackingSuppliesClick = () => {
    router.push(`/customer/${userId}/packing-supplies`);
  };

  const handleFormClose = () => {
    setActiveAppointmentId(null);
  };

  const handleClosePackingSuppliesCard = () => {
    setShowPackingSuppliesCard(false);
  };

  return (
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-8">

      {showPackingSuppliesCard && appointments.some((apt) => 
        !['Complete', 'Canceled', 'Awaiting Admin Check In'].includes(apt.status)
      ) && (
        <InfoCard
          title="Need packing supplies?"
          description="Shop our selection of packing supplies to make sure your items are stored safely and securely. We'll deliver them right to your door when you need them."
          buttonText="Order packing supplies"
          buttonIcon={<PackingSuppliesIcon className="w-5 h-5 text-primary" />}
          onButtonClick={handlePackingSuppliesClick}
          onClose={handleClosePackingSuppliesCard}
          showCloseIcon={true}
          variant='info'
        />
      )}

      {scheduledAppointments.map((appointment) => (
        <div key={appointment.id}>
          {appointment.appointmentType !== 'Storage Unit Access' &&
          appointment.appointmentType !== 'End Storage Term' && (
          <InfoCard
            title={`Make sure your pickup goes smoothly`}
            description={
              <>
                Please provide us with additional information about your upcoming appointment on{' '}
                <span className="font-bold">
                  {(() => {
                    const date = new Date(appointment.date);
                    const day = date.getDate();
                    const suffixDay = addDateSuffix(day);
                    const month = date.toLocaleDateString('en-US', { month: 'short' });
                    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
                    return `${weekday}, ${month} ${suffixDay}`;
                  })()}
                </span>. This helps us ensure we&apos;ve scheduled enough hours and movers for your job.
              </>
            }
            buttonText={`Tell us more about your ${appointment.appointmentType.toLowerCase()}`}
            buttonIcon={<ClipboardIcon className="w-5 h-5 text-primary" />}
            onButtonClick={() => handleMoreInfoClick(appointment.id)}
          />
        )}

          {activeAppointmentId === appointment.id && (
            <MoveDetailsForm
              isOpen={true}
              appointmentId={appointment.id}
              onClose={handleFormClose}
              onUpdateAppointment={handleUpdateAppointmentInfo}
            />
          )}
        </div>
      ))}

    </div>
  );
};
