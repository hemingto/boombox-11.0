/**
 * @fileoverview UserPageInfoCards component - Displays info cards for customer actions
 * @source boombox-10.0/src/app/components/user-page/userpageinfocards.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getActiveCustomerAppointments, 
  CustomerAppointmentDisplay 
} from '@/lib/utils/customerUtils';
import { addDateSuffix } from '@/lib/utils/dateUtils';
import { InfoCard } from '@/components/ui/primitives/InfoCard';
import { ClipboardIcon } from '@/components/icons/ClipboardIcon';
import { PackingSuppliesIcon } from '@/components/icons/PackingSuppliesIcon';
import { MoveDetailsForm } from '@/components/features/customers';
import { 
  SkeletonCard, 
  SkeletonTitle, 
  SkeletonText 
} from '@/components/ui/primitives/Skeleton';

export interface UserPageInfoCardsProps {
  userId: string;
}

/**
 * UserPageInfoCards - Container component for displaying action cards
 * 
 * Features:
 * - Displays packing supplies order card for active appointments
 * - Shows move details collection cards for scheduled appointments
 * - Opens MoveDetailsForm modal for providing additional appointment info
 * - Uses skeleton primitives for loading state
 */
export const UserPageInfoCards: React.FC<UserPageInfoCardsProps> = ({ userId }) => {
  const [activeAppointmentId, setActiveAppointmentId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<CustomerAppointmentDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const activeAppointments = await getActiveCustomerAppointments(userId);
        setAppointments(activeAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [userId]);

  // Filter for scheduled appointments without additional information
  const scheduledAppointments = appointments.filter(
    (apt) => !['Complete', 'Canceled', 'Awaiting Admin Check In'].includes(apt.status) && !apt.hasAdditionalInfo
  );

  const handleUpdateAppointmentInfo = (appointmentId: number) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, hasAdditionalInfo: true } : apt
      )
    );
  };

  const handleMoreInfoClick = (appointmentId: number) => {
    setActiveAppointmentId(appointmentId);
  };

  const handlePackingSuppliesClick = () => {
    router.push(`/user-page/${userId}/packing-supplies`);
  };

  const handleFormClose = () => {
    setActiveAppointmentId(null);
  };

  // Loading state with skeleton primitives
  if (isLoading) {
    return (
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto space-y-4">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto">

      {appointments.some((apt) => 
        !['Complete', 'Canceled', 'Awaiting Admin Check In'].includes(apt.status)
      ) && (
        <InfoCard
          title="Need packing supplies?"
          description="Shop our selection of packing supplies to make sure your items are stored safely and securely. We'll deliver them right to your door when you need them."
          buttonText="Order packing supplies"
          buttonIcon={<PackingSuppliesIcon className="w-5 h-5 text-primary" />}
          onButtonClick={handlePackingSuppliesClick}
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
                </span>. This helps us ensure we've scheduled enough hours and movers for your job.
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

