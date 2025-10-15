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
  if (appointmentType === 'Access Storage') {
    return (
      <AccessStorageProvider
        mode="edit"
        appointmentId={appointmentId || undefined}
      >
        <AccessStorageForm />
      </AccessStorageProvider>
    );
  }

  if (appointmentType === 'Additional Storage') {
    return (
      <AddStorageProvider>
        <AddStorageForm />
      </AddStorageProvider>
    );
  }

  // Default: Show error for unsupported appointment types
  return (
    <div className="min-h-[1200px] lg:px-16 px-6 max-w-7xl mx-auto py-12">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-6">
        <h1 className="text-2xl font-semibold text-amber-900 mb-2">
          Edit Appointment
        </h1>
        <p className="text-amber-800">
          Appointment Type: <strong>{appointmentType || 'Not specified'}</strong>
        </p>
        <p className="text-amber-700 mt-4">
          Editing is currently only supported for Access Storage and Additional
          Storage appointments. Please contact support for other appointment types.
        </p>
      </div>
    </div>
  );
}

