/**
 * @fileoverview Container component that displays a list of upcoming appointments for a customer.
 * @source boombox-10.0/src/app/components/user-page/upcomingappointment.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Fetches active appointments from server action.
 * - Displays loading state with skeleton cards.
 * - Maps appointments to AppointmentCard components.
 * - Handles appointment cancellation by filtering from list.
 * - Notifies parent component of state changes via callback.
 * - Formats dates and times for display.
 * - Returns null when no appointments exist.
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses SkeletonCard primitive directly for loading state (no custom skeleton component).
 * - Uses semantic spacing classes.
 *
 * @refactor Migrated to boombox-11.0 customer features, replaced custom skeleton with primitives, and extracted date utility function.
 */

'use client';

import { useState, useEffect } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { getActiveCustomerAppointments, type CustomerAppointmentDisplay } from '@/lib/utils/customerUtils';
import { SkeletonCard, SkeletonTitle, SkeletonText } from '@/components/ui/primitives/Skeleton';
import { addDateSuffix } from '@/lib/utils/dateUtils';

export interface UpcomingAppointmentsProps {
  userId: string;
  hasActiveStorageUnits: boolean;
  onStateChange?: (hasAppointments: boolean, loading: boolean) => void;
}

export function UpcomingAppointments({
  userId,
  hasActiveStorageUnits,
  onStateChange,
}: UpcomingAppointmentsProps) {
  const [appointments, setAppointments] = useState<CustomerAppointmentDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Notify parent component about state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(appointments.length > 0, isLoading);
    }
  }, [appointments.length, isLoading, onStateChange]);

  const handleCancellation = (appointmentId: number) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col sm:mb-4 mb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mt-4">
            <SkeletonCard className="p-6">
              <div className="mb-4 h-32 bg-surface-tertiary rounded-t-md"></div>
              <SkeletonTitle />
              <SkeletonText className="mb-2" />
              <SkeletonText className="mb-2" />
              <SkeletonText className="w-1/2" />
            </SkeletonCard>
          </div>
        ))}
      </div>
    );
  }

  // Return null if no appointments, let parent handle InfoCards
  if (appointments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:mb-4 mb-2">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="mt-4">
          <AppointmentCard
            appointmentId={appointment.id}
            title={`${appointment.appointmentType}`}
            description={`${
              (appointment.appointmentType === 'Storage Unit Access' ||
                appointment.appointmentType === 'End Storage Term') &&
              appointment.requestedStorageUnits.length > 0
                ? appointment.requestedStorageUnits
                    .map((unit) => `Boombox ${unit.storageUnitNumber}`)
                    .join(', ')
                : appointment.movingPartnerName
                ? appointment.movingPartnerName
                : appointment.thirdPartyTitle
                ? appointment.thirdPartyTitle
                : appointment.planType || 'No plan type'
            }${appointment.insuranceCoverage ? ` with ${appointment.insuranceCoverage}` : ''}`}
            displaydate={`${new Date(appointment.date).toLocaleDateString('en-US', {
              weekday: 'long',
            })}, ${new Date(appointment.date).toLocaleDateString('en-US', {
              month: 'short',
            })} ${addDateSuffix(new Date(appointment.date).getDate())}`}
            time={`arriving between ${new Date(appointment.time)
              .toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })
              .replace(' ', '')
              .toLowerCase()} - ${new Date(new Date(appointment.time).getTime() + 60 * 60 * 1000)
              .toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })
              .replace(' ', '')
              .toLowerCase()}`}
            location={appointment.address}
            date={appointment.date}
            userId={userId}
            appointmentType={appointment.appointmentType}
            numberOfUnits={appointment.numberOfUnits}
            loadingHelpPrice={appointment.loadingHelpPrice}
            monthlyStorageRate={appointment.monthlyStorageRate}
            monthlyInsuranceRate={appointment.monthlyInsuranceRate}
            onCancellation={handleCancellation}
            movingPartnerName={appointment.movingPartnerName}
            thirdPartyTitle={appointment.thirdPartyTitle}
            planType={appointment.planType ?? undefined}
            insuranceCoverage={appointment.insuranceCoverage ?? undefined}
            status={appointment.status}
            trackingUrl={appointment.trackingUrl}
            requestedStorageUnits={appointment.requestedStorageUnits}
          />
        </div>
      ))}
    </div>
  );
}

