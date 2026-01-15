/**
 * @fileoverview Edit appointment page - customer modifies appointment details
 * @source boombox-10.0/src/app/user-page/[id]/edit-appointment/page.tsx
 * @refactor Migrated to (dashboard)/customer route group with unified form components
 */

'use client';

import { useSearchParams } from 'next/navigation';
import AccessStorageForm from '@/components/features/orders/AccessStorageForm';
import AddStorageForm from '@/components/features/orders/AddStorageForm';
import { AccessStorageProvider } from '@/components/features/orders/AccessStorageProvider';
import { AddStorageProvider } from '@/components/features/orders/AddStorageProvider';
import { useUser } from '@/contexts/UserContext';

export default function EditAppointment() {
  const searchParams = useSearchParams();
  const appointmentType = searchParams.get('appointmentType');
  const appointmentId = searchParams.get('appointmentId');
  const userId = useUser();

  // Determine which form to show based on appointment type
  // Handle both 'Access Storage' and 'Storage Unit Access' for backwards compatibility
  if (appointmentType === 'Access Storage' || 
      appointmentType === 'Storage Unit Access' || 
      appointmentType === 'End Storage Term') {
    return (
      <AccessStorageProvider
        mode="edit"
        appointmentId={appointmentId || undefined}
      >
        <AccessStorageForm />
      </AccessStorageProvider>
    );
  }

  // Handle both 'Additional Storage' and 'Initial Pickup' appointments
  if (appointmentType === 'Additional Storage' || appointmentType === 'Initial Pickup') {
    return (
      <AddStorageProvider
        mode="edit"
        appointmentId={appointmentId || undefined}
      >
        <AddStorageForm />
      </AddStorageProvider>
    );
  }

  // Default: Show error for unsupported appointment types
  return (
    <div className="min-h-[1200px] lg:px-16 px-6 max-w-7xl mx-auto py-12">
      <div className="bg-amber-100 rounded-md p-6">
        <h1 className="text-2xl font-semibold text-amber-500 mb-4">
          Edit Appointment
        </h1>
        <p className="text-amber-500 mb-2">
          Appointment Type: <strong>{appointmentType || 'Not specified'}</strong>
        </p>
        <p className="text-amber-500">
          Editing is currently only supported for Access Storage, Initial Pickup, and Additional
          Storage appointments. Please contact support for other appointment types.
        </p>
      </div>
    </div>
  );
}

