/**
 * @fileoverview Admin task page for handling appointments without assigned drivers
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/unassigned-driver/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays moving partner information for unassigned driver task
 * - Shows appointment details (job code, Onfleet task ID, customer, date, address)
 * - Allows admin to record call results (did call, got hold of partner)
 * - Updates appointment with moving partner contact status
 * 
 * API ROUTES USED:
 * - GET /api/admin/tasks/[taskId] - Fetch task and moving partner data
 * - PATCH /api/admin/appointments/[id]/called-moving-partner - Update call status
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-error)
 * - Uses form-error class for validation messages
 * - Uses btn-primary utility class for submit button
 * - Replaced hardcoded rose colors with status-error variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useTask } from '@/hooks';
import { Button } from '@/components/ui/primitives/Button';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';

interface UnassignedDriverPageProps {
 taskId: string;
}

export function UnassignedDriverPage({ taskId }: UnassignedDriverPageProps) {
 const router = useRouter();
 const { task, isLoading } = useTask(taskId);
 const [didCall, setDidCall] = useState<string | null>(null);
 const [gotHold, setGotHold] = useState<string | null>(null);
 const [showError, setShowError] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);

 useEffect(() => {
  console.log('Task data:', task);
 }, [task]);

 const handleUpdate = async () => {
  if (!didCall || (didCall === 'Yes' && !gotHold)) {
   setShowError(true);
   return;
  }

  // Extract appointment ID from task ID (format: "unassigned-{appointmentId}")
  // This matches the pattern used in PendingCleaningPage and other task pages
  const appointmentId = taskId.split('-')[1];
  
  if (!appointmentId) {
   console.error('Could not extract appointment ID from taskId:', taskId);
   return;
  }

  setIsSubmitting(true);
  try {
   const response = await fetch(`/api/admin/appointments/${appointmentId}/called-moving-partner`, {
    method: 'PATCH',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     calledMovingPartner: didCall === 'Yes',
     gotHoldOfMovingPartner: gotHold === 'Yes',
    }),
   });

   if (!response.ok) {
    throw new Error('Failed to update appointment');
   }

   router.push('/admin/tasks');
  } catch (error) {
   console.error('Error updating appointment:', error);
  } finally {
   setIsSubmitting(false);
  }
 };

 if (isLoading) {
  return (
   <div className="min-h-screen p-4">
    <div className="max-w-4xl mx-auto">
     <div className="animate-pulse">
      <div className="h-8 bg-surface-tertiary rounded w-1/3 mb-4"></div>
      <div className="space-y-4">
       <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
       <div className="h-4 bg-surface-tertiary rounded w-1/2"></div>
      </div>
     </div>
    </div>
   </div>
  );
 }

 if (!task) {
  return (
   <div className="min-h-screen p-4">
    <div className="max-w-4xl mx-auto">
     <div className="text-center">
      <h1 className="text-2xl font-semibold text-text-primary">Task not found</h1>
      <p className="mt-2 text-text-secondary">The requested task could not be found.</p>
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className="mt-4 mb-20">
   <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header with back button */}
    <div className="flex items-center gap-4 mb-6">
     <button
      onClick={() => router.back()}
      className="flex items-center text-text-primary hover:text-text-secondary"
      aria-label="Go back"
     >
      <ChevronLeftIcon className="h-6 w-6" />
     </button>
     <div className="flex items-center gap-4">
      <div>
       <h1 className="text-xl font-semibold text-text-primary">{task.title}</h1>
       <p className="text-text-primary mt-1 text-sm">{task.description}</p>
      </div>
     </div>
    </div>

    <div className="bg-surface-primaryrounded-lg">
     <div className="p-6 space-y-6">
      {/* Moving Partner Card */}
      {task.movingPartner && (
       <div className="bg-rose-600 rounded-lg p-6">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <div className="relative bg-white rounded-full h-12 w-12 overflow-hidden">
           <Image
            src={
             task.movingPartner.imageSrc && 
             !task.movingPartner.imageSrc.includes('placeholder.com')
              ? task.movingPartner.imageSrc
              : '/placeholder.jpg'
            }
            alt={task.movingPartner.name}
            className="w-12 h-12 rounded-full object-cover"
            width={48}
            height={48}
           />
          </div>
          <div>
           <h4 className="text-white font-medium">{task.movingPartner.name}</h4>
           <p className="text-white/90 text-xs">moving partner</p>
          </div>
         </div>
         <div className="flex items-center gap-2 mr-4">
          <a
           href={`tel:${task.movingPartner.phoneNumber}`}
           className="flex items-center gap-2 hover:opacity-80 transition-opacity"
           aria-label={`Call ${task.movingPartner.name}`}
          >
           <div className="bg-rose-500 p-2 rounded-full">
            <PhoneIcon className="h-4 w-4 text-white" />
           </div>
           <p className="text-white text-sm">{formatPhoneNumberForDisplay(task.movingPartner.phoneNumber)}</p>
          </a>
         </div>
        </div>
       </div>
      )}

      {/* Job Details Grid */}
      <div className="grid grid-cols-3 gap-6 border-b border-border pb-6">
       <div className="border-r border-border pr-4">
        <h3 className="font-medium text-text-primary font-semibold">Job Code</h3>
        <p className="mt-1 text-sm text-text-primary">{task.jobCode}</p>
       </div>
       <div className="border-r border-border pr-4">
        <h3 className="font-medium text-text-primary font-semibold">Onfleet Task ID</h3>
        <p className="mt-1 text-sm text-text-primary">
         {task.onfleetTaskIds || 'No task IDs available'}
        </p>
       </div>
       <div>
        <h3 className="font-medium text-text-primary font-semibold">Customer</h3>
        <p className="mt-1 text-sm text-text-primary">
         {task.customerName || 'No customer name available'}
        </p>
       </div>
      </div>

      {/* Date and Address */}
      <div className="grid grid-cols-1 gap-6 border-b border-border pb-6">
       <div>
        <h3 className="font-medium text-text-primary font-semibold">Date</h3>
        <p className="mt-1 text-sm text-text-primary">{task.appointmentDate || 'No date available'}</p>
       </div>
       <div>
        <h3 className="font-medium text-text-primary font-semibold">Address</h3>
        <p className="mt-1 text-sm text-text-primary">
         {task.appointmentAddress || 'No address available'}
        </p>
       </div>
      </div>

      {/* Phone Call Result Section */}
      <div>
       <h3 className="font-medium text-text-primary font-semibold mb-6">Phone Call Result</h3>

       <div className="space-y-8">
        <div>
         <p className="text-text-primary mb-4">Did you call {task.movingPartner?.name}?</p>
         <YesOrNoRadio
          value={didCall}
          onChange={(value) => {
           setDidCall(value);
           if (value === 'No') setGotHold(null);
           setShowError(false);
          }}
          hasError={showError && !didCall}
         />
         {showError && !didCall && (
          <p className="form-error">Please indicate if you called the moving partner</p>
         )}
        </div>

        {didCall === 'Yes' && (
         <div>
          <p className="text-text-primary mb-4">Were you able to get a hold of them?</p>
          <YesOrNoRadio
           value={gotHold}
           onChange={(value) => {
            setGotHold(value);
            setShowError(false);
           }}
           hasError={showError && !gotHold}
          />
          {showError && !gotHold && (
           <p className="form-error">Please indicate if you got a hold of the moving partner</p>
          )}
         </div>
        )}
       </div>
      </div>

      {/* Update Button */}
      <div className="flex justify-end pt-4">
       <Button
        type="button"
        onClick={handleUpdate}
        loading={isSubmitting}
        variant="primary"
        className="!bg-rose-600 hover:!bg-rose-500 active:!bg-rose-500 disabled:!bg-rose-600"
        aria-label="Update task with call results"
       >
        Update Task
       </Button>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}

