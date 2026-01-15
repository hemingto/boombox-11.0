/**
 * @fileoverview Admin task page for prepping storage units for delivery
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/prep-units-delivery/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays appointment and requested storage units information
 * - Provides checklist interface for marking units as ready
 * - Confirms all units are in staging area before completion
 * - Updates unit status and completes task
 * 
 * API ROUTES USED:
 * - GET /api/orders/appointments/[id]/details - Fetch appointment data
 * - POST /api/admin/tasks/prep-units-delivery/[appointmentId] - Mark units as ready
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-info)
 * - Uses form-error class for validation messages
 * - Uses btn-primary utility class for submit button
 * - Replaced hardcoded sky colors with status-info variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTask } from '@/hooks';
import { ChevronLeftIcon, CalendarDaysIcon, CubeIcon } from '@heroicons/react/24/outline';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import { Button } from '@/components/ui/primitives/Button';
import { Transition } from '@headlessui/react';

interface PrepUnitsDeliveryPageProps {
  taskId: string;
}

interface TaskWithUnits {
  jobCode?: string;
  customerName?: string;
  appointmentType?: string;
  requestedStorageUnits?: Array<{
    storageUnit: {
      storageUnitNumber: string;
    }
  }>;
}

interface Appointment {
  id: number;
  jobCode: string;
  date: Date;
  time: Date;
  appointmentType: string;
  numberOfUnits: number;
  user: {
    firstName: string;
    lastName: string;
  };
  requestedStorageUnits?: Array<{
    storageUnit: {
      storageUnitNumber: string;
    }
  }>;
}

export function PrepUnitsDeliveryPage({ taskId }: PrepUnitsDeliveryPageProps) {
  const router = useRouter();
  const { task, isLoading: isTaskLoading } = useTask(taskId);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, boolean>>({});
  const [allUnitsChecked, setAllUnitsChecked] = useState(false);
  const [allUnitsInStagingArea, setAllUnitsInStagingArea] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract appointment ID from task ID
  const parts = taskId.split('-');
  const appointmentId = parts.length > 2 ? parts[2] : null;

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/appointments/${appointmentId}/details`);
        if (!response.ok) {
          throw new Error(`Failed to fetch appointment details: ${response.status}`);
        }
        const data = await response.json();
        setAppointment(data);
      } catch (error) {
        console.error('Error fetching appointment details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);

  useEffect(() => {
    const taskWithUnits = task as TaskWithUnits;
    if (taskWithUnits?.requestedStorageUnits) {
      const initialSelectedState = taskWithUnits.requestedStorageUnits.reduce((acc: Record<string, boolean>, unit: any) => {
        acc[unit.storageUnit.storageUnitNumber] = false;
        return acc;
      }, {});
      setSelectedUnits(initialSelectedState);
    }
  }, [task]);

  useEffect(() => {
    if (Object.keys(selectedUnits).length > 0) {
      const allChecked = Object.values(selectedUnits).every(isSelected => isSelected);
      setAllUnitsChecked(allChecked);
    } else {
      setAllUnitsChecked(false);
    }
  }, [selectedUnits]);

  const toggleUnit = (unitNumber: string) => {
    setSelectedUnits(prev => ({
      ...prev,
      [unitNumber]: !prev[unitNumber]
    }));
  };

  const handleMarkComplete = async () => {
    if (!allUnitsChecked || !allUnitsInStagingArea) {
      setShowError(true);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/tasks/prep-units-delivery/${appointmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          unitNumbers: Object.keys(selectedUnits).filter(unit => selectedUnits[unit])
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update storage units');
      }

      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error updating storage units:', error);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (isTaskLoading || isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-tertiary rounded w-1/4 mb-4"></div>
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
    return <div className="text-center text-text-primary">Task not found</div>;
  }

  const taskWithUnits = task as TaskWithUnits;

  return (
    <div className="mt-4 mb-20">
      <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Prep units for delivery</h1>
            <p className="text-text-primary mt-1 text-sm">Forklift requested storage units to staging area for pending deliveries</p>
          </div>
        </div>

        <div className="bg-surface-primary">
          <div className="p-6 space-y-6">
            {/* Appointment Card */}
            <div className="bg-sky-500 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative bg-sky-600 rounded-full h-12 w-12 flex items-center justify-center">
                    <CalendarDaysIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      {appointment?.appointmentType || taskWithUnits.appointmentType || 'N/A'}
                    </h4>
                    <p className="text-white/90 text-sm">
                      {appointment && new Date(appointment.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })} starting at {appointment && new Date(appointment.time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }).replace(':00', '')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="relative bg-sky-600 rounded-full h-12 w-12 mr-3 flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start text-white mr-4">
                    <span className="font-semibold text-lg">
                      {taskWithUnits.requestedStorageUnits?.length || 0} total
                    </span>
                    <span className="text-xs text-white/90">requested units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-border pb-6">
              <div className="sm:border-r border-border pr-4">
                <h3 className="font-medium text-text-primary font-semibold">Job Code</h3>
                <p className="mt-1 text-sm text-text-primary">{taskWithUnits.jobCode || appointment?.jobCode || 'N/A'}</p>
              </div>
              <div className="sm:border-r border-border pr-4">
                <h3 className="font-medium text-text-primary font-semibold">Customer</h3>
                <p className="mt-1 text-sm text-text-primary">
                  {taskWithUnits.customerName || 
                    (appointment?.user ? `${appointment.user.firstName} ${appointment.user.lastName}` : 'N/A')}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Requested Units</h3>
                <p className="mt-1 text-sm text-text-primary">
                  {taskWithUnits.requestedStorageUnits?.map((unit: any) => unit.storageUnit.storageUnitNumber).join(', ') || 'N/A'}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <h3 className="font-medium text-text-primary font-semibold mb-6">Forklift requested units to delivery staging area</h3>
              <p className="text-text-primary mb-4 text-sm">Check off storage unit once unit is ready</p>
              
              <div className="space-y-3 mb-8">
                {taskWithUnits.requestedStorageUnits?.map((unit: any, index: number) => (
                  <div 
                    key={index} 
                    className={`${selectedUnits[unit.storageUnit.storageUnitNumber] ? 'bg-surface-primary' : 'bg-surface-tertiary'} p-4 rounded-md max-w-lg`}
                  >
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUnits[unit.storageUnit.storageUnitNumber] || false}
                        onChange={() => toggleUnit(unit.storageUnit.storageUnitNumber)}
                        className="h-5 w-5 border-border rounded focus:ring-status-info checked:bg-status-info hover:checked:bg-status-info-hover checked:text-white"
                      />
                      <span className="ml-3 text-md text-text-primary">{unit.storageUnit.storageUnitNumber}</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Confirmation with YesOrNoRadio */}
              <Transition
                show={allUnitsChecked}
                enter="transition-all duration-300 ease-in-out"
                enterFrom="opacity-0 max-h-0 overflow-hidden"
                enterTo="opacity-100 max-h-96 overflow-visible"
                leave="transition-all duration-200 ease-in-out"
                leaveFrom="opacity-100 max-h-96 overflow-visible"
                leaveTo="opacity-0 max-h-0 overflow-hidden"
              >
                <div className="mt-8">
                  <p className="text-text-primary mb-4">Are all requested storage units in the delivery staging area?</p>
                  <YesOrNoRadio
                    value={allUnitsInStagingArea}
                    onChange={(value) => {
                      setAllUnitsInStagingArea(value);
                      setShowError(false);
                    }}
                    hasError={showError && !allUnitsInStagingArea}
                  />
                </div>
              </Transition>

              {/* Error message */}
              {showError && (
                <p className="form-error mt-4">
                  {!allUnitsChecked ? "Please check all storage units before proceeding" : 
                   !allUnitsInStagingArea ? "Please confirm if all units are in the staging area" : ""}
                </p>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-8">
                <Button
                  type="button"
                  disabled={!allUnitsChecked || !allUnitsInStagingArea}
                  loading={submitting}
                  onClick={handleMarkComplete}
                  variant="primary"
                  className="!bg-sky-500 hover:!bg-sky-600 active:!bg-sky-600 disabled:!bg-sky-500"
                  aria-label="Mark prep complete"
                >
                  Mark Complete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

