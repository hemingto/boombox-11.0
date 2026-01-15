/**
 * @fileoverview Container component that displays a list of upcoming appointments for a customer.
 * @source boombox-10.0/src/app/components/user-page/upcomingappointment.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Receives appointments as props from parent (page-level data fetching)
 * - Maps appointments to AppointmentCard components
 * - Handles appointment cancellation by updating parent state
 * - Formats dates and times for display
 *
 * ARCHITECTURE:
 * - Data is fetched at page level via useCustomerHomePageData hook
 * - Component receives data as props, no internal data fetching
 * - Parent handles conditional rendering (component only mounts when data exists)
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic spacing classes
 *
 * @refactor Migrated to page-level data fetching pattern, removed internal loading/fetching
 */

'use client';

import { AppointmentCard } from './AppointmentCard';
import { type CustomerAppointmentDisplay } from '@/lib/services/customerDataService';
import { addDateSuffix } from '@/lib/utils';

export interface UpcomingAppointmentsProps {
  userId: string;
  appointments: CustomerAppointmentDisplay[];
  hasActiveStorageUnits?: boolean;
  onAppointmentsChange: React.Dispatch<React.SetStateAction<CustomerAppointmentDisplay[]>>;
}

export function UpcomingAppointments({
  userId,
  appointments,
  onAppointmentsChange,
}: UpcomingAppointmentsProps) {
  const handleCancellation = (appointmentId: number) => {
    onAppointmentsChange((prev) => prev.filter((apt) => apt.id !== appointmentId));
  };

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
