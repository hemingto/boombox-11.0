/**
 * @fileoverview Weekly availability management component for service providers
 * Allows drivers and moving partners to set their weekly working hours, block specific days,
 * and configure job capacity per time slot (for moving partners)
 * 
 * @source boombox-10.0/src/app/components/mover-account/calendarweeklyavailability.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays weekly availability grid (Monday-Sunday)
 * - Inline editing of start/end times for each day
 * - Block/unblock specific days of the week
 * - Moving partners can set max job capacity per day
 * - Automatic validation of time ranges (start must be before end)
 * - Fetches and saves availability to database per user type
 * - Shows informational message for users who haven't set availability
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/availability → New: /api/drivers/[id]/availability/route.ts
 * - Old: /api/movers/${userId}/availability → New: /api/moving-partners/[id]/availability/route.ts
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom DropdownSelect with @/components/ui/primitives/Select
 * - Applied semantic color tokens (text-primary, text-secondary, surface-tertiary, etc.)
 * - Updated button styling to use btn-primary/btn-secondary patterns
 * - Replaced hardcoded colors with design system tokens
 * - Updated form styling to match design system patterns
 * - Improved loading skeleton with consistent styling
 * 
 * @refactor 
 * - Replaced DropdownSelect with design system Select component
 * - Applied comprehensive design system colors throughout
 * - Enhanced accessibility with proper ARIA labels and roles
 * - Improved component structure and TypeScript interfaces
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, SelectOption } from '@/components/ui/primitives/Select';
import { Button } from '@/components/ui/primitives/Button';
import { Modal } from '@/components/ui/primitives/Modal';

interface DayAvailability {
  id?: number; // ID for existing database records
  day: string;
  startTime: string;
  endTime: string;
  isBlocked?: boolean;
  maxCapacity?: number; // For moving partners only
  createdAt?: Date;
  updatedAt?: Date;
}

interface CalendarWeeklyAvailabilityProps {
  userType: 'driver' | 'mover';
  userId: string;
}

const initialAvailability: DayAvailability[] = [
  { day: 'Monday', startTime: '8am', endTime: '5pm', isBlocked: false, maxCapacity: 1 },
  { day: 'Tuesday', startTime: '8am', endTime: '5pm', isBlocked: false, maxCapacity: 1 },
  { day: 'Wednesday', startTime: '8am', endTime: '5pm', isBlocked: false, maxCapacity: 1 },
  { day: 'Thursday', startTime: '8am', endTime: '5pm', isBlocked: false, maxCapacity: 1 },
  { day: 'Friday', startTime: '8am', endTime: '5pm', isBlocked: false, maxCapacity: 1 },
  { day: 'Saturday', startTime: '8am', endTime: '5pm', isBlocked: false, maxCapacity: 1 },
  { day: 'Sunday', startTime: '8am', endTime: '5pm', isBlocked: false, maxCapacity: 1 },
];

const timeOptions = [
  '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm',
];

const timeToNumber = (time: string): number => {
  const hour = parseInt(time.replace(/[ap]m/, ''));
  return time.includes('pm') && hour !== 12 ? hour + 12 : hour;
};

// Convert database time format (HH:MM) to UI format (Ham/Hpm)
const dbTimeToUITime = (dbTime: string): string => {
  const [hours] = dbTime.split(':').map(Number);
  if (hours === 0) return '12am';
  if (hours === 12) return '12pm';
  return hours > 12 ? `${hours - 12}pm` : `${hours}am`;
};

// Convert UI time format (Ham/Hpm) to database format (HH:MM)
const uiTimeToDBTime = (uiTime: string): string => {
  const hour = parseInt(uiTime.replace(/[ap]m/, ''));
  const isPM = uiTime.includes('pm') && hour !== 12;
  const is12AM = uiTime.includes('am') && hour === 12;
  const hours = is12AM ? 0 : isPM ? hour + 12 : hour;
  return `${hours.toString().padStart(2, '0')}:00`;
};

// Convert time strings to SelectOption format
const timeOptionsToSelectOptions = (times: string[]): SelectOption[] => {
  return times.map(time => ({
    value: time,
    label: time,
  }));
};

export const CalendarWeeklyAvailability: React.FC<CalendarWeeklyAvailabilityProps> = ({ 
  userType, 
  userId 
}) => {
  const [availability, setAvailability] = useState<DayAvailability[]>(initialAvailability);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDay, setEditingDay] = useState<DayAvailability | null>(null);
  const [tempEditData, setTempEditData] = useState<DayAvailability | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showMessage, setShowMessage] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Updated API route
      const endpoint = userType === 'driver'
        ? `/api/drivers/${userId}/availability`
        : `/api/moving-partners/${userId}/availability`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch availability');
      
      const data = await response.json();
      
      if (data.availability && data.availability.length > 0) {
        // Map database records to UI format
        const formattedAvailability = data.availability.map((item: any) => ({
          id: item.id,
          day: item.dayOfWeek,
          startTime: dbTimeToUITime(item.startTime),
          endTime: dbTimeToUITime(item.endTime),
          isBlocked: item.isBlocked || false,
          maxCapacity: item.maxCapacity || 1,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
        
        setAvailability(formattedAvailability);

        // Check if all records are unchanged (first time setup)
        const allUnchanged = formattedAvailability.length === 7 && formattedAvailability.every(
          (record: DayAvailability) => 
            new Date(record.createdAt!).getTime() === new Date(record.updatedAt!).getTime()
        );
        setShowMessage(allUnchanged);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  useEffect(() => {
    if (userId) {
      fetchAvailability();
    } else {
      setIsLoading(false);
    }
  }, [userId, fetchAvailability]);

  const getFilteredTimeOptions = (
    currentTime: string,
    type: 'startTime' | 'endTime'
  ): string[] => {
    if (!tempEditData) return timeOptions;
    
    if (type === 'startTime') {
      const endTimeNum = timeToNumber(tempEditData.endTime);
      return timeOptions.filter(time => timeToNumber(time) < endTimeNum);
    } else {
      const startTimeNum = timeToNumber(tempEditData.startTime);
      return timeOptions.filter(time => timeToNumber(time) > startTimeNum);
    }
  };

  const handleTimeChange = (
    type: 'startTime' | 'endTime',
    value: string
  ) => {
    if (!tempEditData) return;

    const updatedData = { ...tempEditData };

    if (type === 'startTime') {
      const startTimeNum = timeToNumber(value);
      const endTimeNum = timeToNumber(updatedData.endTime);
      
      // If start time is >= end time, update end time to next valid option
      if (startTimeNum >= endTimeNum) {
        const nextValidEndTime = timeOptions.find(time => 
          timeToNumber(time) > startTimeNum
        );
        if (nextValidEndTime) {
          updatedData.endTime = nextValidEndTime;
        }
      }
    }

    updatedData[type] = value;
    setTempEditData(updatedData);
  };

  const handleEditClick = (index: number) => {
    const dayData = availability[index];
    setEditingDay({ ...dayData });
    setTempEditData({ ...dayData });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDay(null);
    setTempEditData(null);
  };

  const toggleBlockDay = () => {
    if (!tempEditData) return;
    setTempEditData({
      ...tempEditData,
      isBlocked: !tempEditData.isBlocked,
    });
  };

  const handleCapacityChange = (value: string) => {
    if (!tempEditData) return;
    const capacity = parseInt(value);
    if (capacity >= 1 && capacity <= 10) {
      setTempEditData({
        ...tempEditData,
        maxCapacity: capacity,
      });
    }
  };

  const handleModalSave = async () => {
    if (!userId || !tempEditData || !editingDay) {
      handleModalClose();
      return;
    }

    setIsSaving(true);
    
    try {
      // Use the isBlocked state directly from tempEditData as it's now controlled by the checkbox
      const shouldBeBlocked = tempEditData.isBlocked || false;
      
      // Updated API route
      const endpoint = userType === 'driver' 
        ? `/api/drivers/${userId}/availability` 
        : `/api/moving-partners/${userId}/availability`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: tempEditData.id,
          dayOfWeek: tempEditData.day,
          startTime: uiTimeToDBTime(tempEditData.startTime),
          endTime: uiTimeToDBTime(tempEditData.endTime),
          isBlocked: shouldBeBlocked,
          maxCapacity: tempEditData.maxCapacity || 1
        }),
      });

      if (!response.ok) throw new Error(`Failed to save ${userType} availability`);
      
      const result = await response.json();
      
      // Update the availability array with the saved data from the API response
      const updatedAvailability = availability.map(day => 
        day.day === tempEditData.day 
          ? { 
              ...day,
              id: result.availability.id || day.id,
              startTime: tempEditData.startTime,
              endTime: tempEditData.endTime,
              isBlocked: result.availability.isBlocked,
              maxCapacity: tempEditData.maxCapacity || 1,
              updatedAt: new Date()
            }
          : day
      );
      
      setAvailability(updatedAvailability);
      setShowMessage(false); // Hide warning after user has actively set their availability
      handleModalClose();

    } catch (error) {
      console.error(`Error saving ${userType} availability:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate capacity options for moving partners
  const capacityOptions: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString(),
  }));

  return (
    <>
      {showMessage && (
        <div className="bg-status-bg-warning border border-border-warning rounded-lg p-4 mb-8" role="alert">
          <p className="text-status-warning">
            To activate your {userType === 'driver' ? 'driver' : 'moving partner'} account please set your calendar with dates and times you&rsquo;ll be available to work
          </p>
        </div>
      )}
      
      <div>
        {/* Header Row */}
        <div className="grid grid-cols-[1fr,1fr,1fr,auto] gap-8 border-b border-border p-4">
          <h3 className="text-xl text-text-primary">
            <span className="hidden sm:inline">Day of Week</span>
            <span className="sm:hidden">Day</span>
          </h3>
          {userType === 'driver' && <div />} {/* Blank div for driver layout */}
          <h3 className="text-xl text-text-primary text-center">
            <span className="hidden sm:inline">Time Available</span>
            <span className="sm:hidden">Time</span>
          </h3>
          {userType === 'mover' && (
            <h3 className="text-xl text-text-primary text-right">
              <span className="hidden sm:inline">Job Capacity</span>
              <span className="sm:hidden"># of Jobs</span>
            </h3>
          )}
          <div className="w-10"></div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          [...Array(7)].map((_, index) => (
            <div 
              key={index} 
              className="grid grid-cols-[1fr,1fr,1fr,auto] gap-8 p-4 items-center border-b border-border last:border-b-0"
              role="status"
              aria-label={`Loading day ${index + 1} availability`}
            >
              <div className="h-6 bg-surface-tertiary rounded animate-pulse"></div>
              <div className="h-6 bg-surface-tertiary rounded animate-pulse"></div>
              <div className="h-6 bg-surface-tertiary rounded animate-pulse"></div>
              {userType === 'mover' && <div className="h-6 bg-surface-tertiary rounded animate-pulse"></div>}
              <div className="h-6 w-10 bg-surface-tertiary rounded animate-pulse"></div>
            </div>
          ))
        ) : (
          // Availability Rows (View Mode Only)
          availability.map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-[1fr,1fr,1fr,auto] gap-8 p-4 items-center border-b border-border last:border-b-0 ${
                item.isBlocked ? 'bg-surface-tertiary' : ''
              }`}
            >
              <div className={item.isBlocked ? 'text-text-secondary' : 'text-text-primary'}>
                {item.day}
              </div>
              {userType === 'driver' && <div />} {/* Blank div for driver layout */}
              
              <span className={`text-sm text-center ${item.isBlocked ? 'text-text-secondary' : 'text-text-primary'}`}>
                {item.isBlocked ? (
                  'Not Available'
                ) : (
                  `${item.startTime} - ${item.endTime}`
                )}
              </span>
              
              {userType === 'mover' && (
                <span className={`text-sm text-right ${item.isBlocked ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {item.isBlocked ? '---' : `${item.maxCapacity || 1} job${(item.maxCapacity || 1) > 1 ? 's' : ''} per time slot`}
                </span>
              )}
              
              <Button
                onClick={() => handleEditClick(index)}
                variant="ghost"
                size="sm"
                className="justify-self-end underline decoration-dotted hover:decoration-solid underline-offset-2 hover:bg-transparent focus:bg-transparent active:bg-transparent"
                aria-label={`Edit ${item.day} availability`}
              >
                Edit
              </Button>
            </div>
          ))
        )}

        {/* Informational Note */}
        <div className="mt-6">
          <p className="text-text-primary border border-border rounded-md p-3 text-sm">
            <strong>Note:</strong> The hours you set are times a customer can book an appointment with you, not the length of your work hours. For example, if you have an available time set for 5pm, a customer can book an appointment with you for 5pm but you won&apos;t be finished working till after that job is complete.
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title={tempEditData ? `Edit ${tempEditData.day} availability` : ''}
        size="md"
        className="sm:max-w-md lg:max-w-lg"
        showCloseButton={true}
        closeOnOverlayClick={true}
      >
        {tempEditData && (
          <div className="space-y-6">
            {/* Time Selection Section - Always visible, disabled when blocked */}
            <div className="space-y-6">
              <div>
                <label className={`block text-base font-medium mb-4 ${tempEditData.isBlocked ? 'text-text-disabled' : 'text-text-primary'}`}>
                  Available Hours
                </label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className={`block text-xs mb-1 ${tempEditData.isBlocked ? 'text-text-disabled' : 'text-text-primary'}`}>
                      Start Time
                    </label>
                    <Select
                      value={tempEditData.startTime}
                      onChange={(value) => handleTimeChange('startTime', value)}
                      options={timeOptionsToSelectOptions(
                        getFilteredTimeOptions(tempEditData.startTime, 'startTime')
                      )}
                      placeholder="Start Time"
                      size="sm"
                      disabled={tempEditData.isBlocked}
                      aria-label={`${tempEditData.day} start time`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`block text-xs mb-1 ${tempEditData.isBlocked ? 'text-text-disabled' : 'text-text-primary'}`}>
                      End Time
                    </label>
                    <Select
                      value={tempEditData.endTime}
                      onChange={(value) => handleTimeChange('endTime', value)}
                      options={timeOptionsToSelectOptions(
                        getFilteredTimeOptions(tempEditData.endTime, 'endTime')
                      )}
                      placeholder="End Time"
                      size="sm"
                      disabled={tempEditData.isBlocked}
                      aria-label={`${tempEditData.day} end time`}
                    />
                  </div>
                </div>
              </div>

              {/* Job Capacity for Movers */}
              {userType === 'mover' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${tempEditData.isBlocked ? 'text-text-disabled' : 'text-text-primary'}`}>
                    Job Capacity
                  </label>
                  <div className="flex items-center gap-3">
                    <Select
                      value={tempEditData.maxCapacity?.toString() || '1'}
                      onChange={(value) => handleCapacityChange(value)}
                      options={capacityOptions}
                      size="sm"
                      disabled={tempEditData.isBlocked}
                      aria-label={`${tempEditData.day} job capacity`}
                    />
                    <span className={`text-sm ${tempEditData.isBlocked ? 'text-text-disabled' : 'text-text-primary'}`}>
                      {(tempEditData.maxCapacity || 1) === 1 ? 'job' : 'jobs'} per time slot
                    </span>
                  </div>
                  <p className={`border border-border rounded-md p-3 text-xs mt-4 ${tempEditData.isBlocked ? 'text-text-disabled' : 'text-text-primary'}`}>
                    The number of jobs per time slot is determined by how many crews you have available per day. For example, if two jobs were booked at 9am, and you set your job capacity to 2, that means you have two crews available at 9am.
                  </p>
                </div>
              )}

              {/* Block/Unblock This Day Checkbox - Always visible */}
              <div className="mb-6">
                <p className="block text-base font-medium text-text-primary mb-4">
                  {tempEditData.isBlocked ? 'Unblock' : 'Block'} {tempEditData.day} availability
                </p>
                <div className="bg-status-bg-warning border border-border-warning rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer text-status-warning">
                    <input
                      type="checkbox"
                      id="block-day-modal"
                      checked={tempEditData.isBlocked}
                      onChange={toggleBlockDay}
                      className="w-4 h-4 appearance-none bg-amber-50 rounded border border-status-warning checked:bg-status-warning checked:border-status-warning cursor-pointer focus:ring-2 focus:ring-status-warning focus:ring-offset-0 relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
                      aria-label={`${tempEditData.isBlocked ? 'Unblock' : 'Block'} ${tempEditData.day}`}
                    />
                    <span className="text-status-warning">
                      {tempEditData.isBlocked ? 'Unblock this day' : 'Block this day'}
                    </span>
                    </label>
                  </div>
                  {tempEditData.isBlocked && (
                    <p className="border border-border rounded-md p-3 text-xs mt-4 text-text-primary">
                      Currently this day is blocked and you cannot book jobs on {tempEditData.day}.
                    </p>
                  )}
                </div>
              </div>

            {/* Modal Footer with Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleModalClose}
                variant="ghost"
                size="sm"
                disabled={isSaving}
              >
                Close
              </Button>
              <Button
                onClick={handleModalSave}
                variant="primary"
                size="sm"
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CalendarWeeklyAvailability;

