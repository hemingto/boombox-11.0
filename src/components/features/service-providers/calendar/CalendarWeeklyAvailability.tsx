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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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
    type: 'startTime' | 'endTime',
    dayIndex: number
  ): string[] => {
    const currentDayAvailability = availability[dayIndex];
    
    if (type === 'startTime') {
      const endTimeNum = timeToNumber(currentDayAvailability.endTime);
      return timeOptions.filter(time => timeToNumber(time) < endTimeNum);
    } else {
      const startTimeNum = timeToNumber(currentDayAvailability.startTime);
      return timeOptions.filter(time => timeToNumber(time) > startTimeNum);
    }
  };

  const handleTimeChange = (
    index: number,
    type: 'startTime' | 'endTime',
    value: string
  ) => {
    const updatedAvailability = [...availability];
    const currentDay = updatedAvailability[index];

    if (type === 'startTime') {
      const startTimeNum = timeToNumber(value);
      const endTimeNum = timeToNumber(currentDay.endTime);
      
      // If start time is >= end time, update end time to next valid option
      if (startTimeNum >= endTimeNum) {
        const nextValidEndTime = timeOptions.find(time => 
          timeToNumber(time) > startTimeNum
        );
        if (nextValidEndTime) {
          currentDay.endTime = nextValidEndTime;
        }
      }
    }

    currentDay[type] = value;
    setAvailability(updatedAvailability);
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
  };

  const toggleBlockDay = (index: number) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index].isBlocked = !updatedAvailability[index].isBlocked;
    setAvailability(updatedAvailability);
  };

  const handleCapacityChange = (index: number, value: string) => {
    const updatedAvailability = [...availability];
    const capacity = parseInt(value);
    if (capacity >= 1 && capacity <= 10) {
      updatedAvailability[index].maxCapacity = capacity;
      setAvailability(updatedAvailability);
    }
  };

  const handleSave = async (index: number) => {
    if (!userId) {
      setEditingIndex(null);
      return;
    }

    setIsSaving(true);
    const dayData = availability[index];
    
    try {
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
          id: dayData.id,
          dayOfWeek: dayData.day,
          startTime: uiTimeToDBTime(dayData.startTime),
          endTime: uiTimeToDBTime(dayData.endTime),
          isBlocked: dayData.isBlocked || false,
          maxCapacity: dayData.maxCapacity || 1
        }),
      });

      if (!response.ok) throw new Error(`Failed to save ${userType} availability`);
      
      const result = await response.json();
      
      if (result.availability && result.availability.id) {
        const updatedAvailability = [...availability];
        updatedAvailability[index].id = result.availability.id;
        setAvailability(updatedAvailability);
      }

    } catch (error) {
      console.error(`Error saving ${userType} availability:`, error);
    } finally {
      setIsSaving(false);
      setEditingIndex(null);
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
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6" role="alert">
          <p className="text-amber-700 text-sm">
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
          <h3 className="text-xl text-text-primary text-right">
            <span className="hidden sm:inline">Time Available</span>
            <span className="sm:hidden">Time</span>
          </h3>
          {userType === 'mover' && (
            <h3 className="text-xl text-text-primary text-right">
              <span className="hidden sm:inline">Job Capacity</span>
              <span className="sm:hidden"># of Jobs</span>
            </h3>
          )}
          <div className="w-16"></div>
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
              <div className="h-6 w-16 bg-surface-tertiary rounded animate-pulse"></div>
            </div>
          ))
        ) : (
          // Availability Rows
          availability.map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-[1fr,1fr,1fr,auto] gap-8 p-4 items-center border-b border-border last:border-b-0 ${
                item.isBlocked ? 'bg-surface-tertiary' : ''
              }`}
            >
              {editingIndex === index ? (
                <>
                  {/* Editing Mode */}
                  <div className={item.isBlocked ? 'text-text-tertiary' : 'text-text-primary'}>
                    {item.day}
                  </div>
                  {userType === 'driver' && <div />} {/* Blank div for driver layout */}
                  
                  {item.isBlocked ? (
                    <>
                      <div className="flex gap-2 items-center justify-end">
                        <div className="flex items-center mr-2">
                          <input
                            type="checkbox"
                            id={`block-${index}`}
                            checked={item.isBlocked}
                            onChange={() => toggleBlockDay(index)}
                            className="mr-2 w-4 h-4 accent-primary cursor-pointer"
                            aria-label={`Unblock ${item.day}`}
                          />
                          <label className="cursor-pointer whitespace-nowrap text-text-primary" htmlFor={`block-${index}`}>
                            Unblock Date
                          </label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2 items-center justify-end">
                        <div className="flex items-center mr-2">
                          <input
                            type="checkbox"
                            id={`block-${index}`}
                            checked={item.isBlocked}
                            onChange={() => toggleBlockDay(index)}
                            className="mr-2 w-4 h-4 accent-primary cursor-pointer"
                            aria-label={`Block ${item.day}`}
                          />
                          <label className="cursor-pointer whitespace-nowrap text-text-primary" htmlFor={`block-${index}`}>
                            Block Date
                          </label>
                        </div>
                        <div className="-mb-2 sm:-mb-4">
                          <Select
                            value={item.startTime}
                            onChange={(value) => handleTimeChange(index, 'startTime', value)}
                            options={timeOptionsToSelectOptions(
                              getFilteredTimeOptions(item.startTime, 'startTime', index)
                            )}
                            placeholder="Start Time"
                            size="sm"
                            aria-label={`${item.day} start time`}
                          />
                        </div>
                        <div className="-mb-2 sm:-mb-4">
                          <Select
                            value={item.endTime}
                            onChange={(value) => handleTimeChange(index, 'endTime', value)}
                            options={timeOptionsToSelectOptions(
                              getFilteredTimeOptions(item.endTime, 'endTime', index)
                            )}
                            placeholder="End Time"
                            size="sm"
                            aria-label={`${item.day} end time`}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {userType === 'mover' && !item.isBlocked && (
                    <div className="flex items-center gap-2 justify-end">
                      <label className="text-text-primary">Jobs</label>
                      <div className="-mb-2 sm:-mb-4">
                        <Select
                          value={item.maxCapacity?.toString() || '1'}
                          onChange={(value) => handleCapacityChange(index, value)}
                          options={capacityOptions}
                          size="sm"
                          aria-label={`${item.day} job capacity`}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSave(index)}
                    disabled={isSaving}
                    className={`${
                      isSaving 
                        ? 'bg-surface-disabled cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary-hover'
                    } text-text-inverse px-4 py-2 rounded-md transition-colors`}
                    aria-label={`Save ${item.day} availability`}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <div className={item.isBlocked ? 'text-text-tertiary' : 'text-text-primary'}>
                    {item.day}
                  </div>
                  {userType === 'driver' && <div />} {/* Blank div for driver layout */}
                  
                  <span className="text-text-primary text-sm text-right">
                    {item.isBlocked ? (
                      <span className="text-text-tertiary">Not Available</span>
                    ) : (
                      `${item.startTime} - ${item.endTime}`
                    )}
                  </span>
                  
                  {userType === 'mover' && !item.isBlocked && (
                    <span className="text-text-primary text-sm text-right">
                      {item.maxCapacity || 1} job{(item.maxCapacity || 1) > 1 ? 's' : ''} per time slot
                    </span>
                  )}
                  
                  <button 
                    onClick={() => handleEditClick(index)} 
                    className="justify-self-end px-4 py-2 text-center"
                    aria-label={`Edit ${item.day} availability`}
                  >
                    <p className="decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm text-text-primary">
                      Edit
                    </p>
                  </button>
                </>
              )}
            </div>
          ))
        )}

        {/* Informational Note */}
        <div className="mt-6">
          <p className="text-text-secondary border border-border rounded-md p-3 text-sm">
            <strong className="text-text-primary">Note:</strong> The hours you set are times a customer can book an appointment with you, not the length of your work hours. For example, if you have an available time set for 5pm, a customer can book an appointment with you for 5pm but you won&apos;t be finished working till after that job is complete.
          </p>
        </div>
      </div>
    </>
  );
};

export default CalendarWeeklyAvailability;

