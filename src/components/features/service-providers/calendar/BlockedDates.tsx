/**
 * @fileoverview Blocked dates management component for service providers (drivers and moving partners)
 * @source boombox-10.0/src/app/components/mover-account/blockdates.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Display list of blocked dates for drivers or moving partners
 * - Add new blocked dates using custom date picker
 * - Remove existing blocked dates
 * - Real-time date synchronization with backend
 * - Empty state with informative message
 * 
 * API ROUTES UPDATED:
 * - Old: GET /api/${userType}/${userId}/blocked-dates
 * - New: GET /api/drivers/[id]/blocked-dates (for drivers)
 * - New: GET /api/moving-partners/[id]/blocked-dates (for movers)
 * 
 * - Old: POST /api/${userType}/${userId}/blocked-dates
 * - New: POST /api/drivers/[id]/blocked-dates (for drivers)
 * - New: POST /api/moving-partners/[id]/blocked-dates (for movers)
 * 
 * - Old: DELETE /api/${userType}/${userId}/blocked-dates/${id}
 * - New: DELETE /api/drivers/[id]/blocked-dates/[dateId] (for drivers)
 * - New: DELETE /api/moving-partners/[id]/blocked-dates/[dateId] (for movers)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (bg-zinc-950, bg-slate-100) with design system tokens (bg-primary, bg-surface-secondary)
 * - Applied semantic button patterns with btn-primary utility classes
 * - Used design system loading skeleton components
 * - Consistent border colors using border-border tokens
 * - Applied text hierarchy with text-text-primary and text-text-secondary
 * 
 * @refactor Migrated to service-providers/calendar folder, updated API routes to domain-based structure, enhanced accessibility with ARIA labels
 */

'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import CustomDatePicker from '@/components/forms/CustomDatePicker';
import { Button } from '@/components/ui/primitives/Button';
import { Skeleton } from '@/components/ui/primitives/Skeleton';
import { CalendarDateRangeIcon } from '@heroicons/react/24/outline';

export interface BlockedDatesProps {
  /** Type of user: 'driver' or 'mover' (moving partner) */
  userType: 'driver' | 'mover';
  /** User ID for fetching blocked dates */
  userId: string;
}

interface BlockedDate {
  id: number;
  blockedDate: string;
}

const BlockedDates: React.FC<BlockedDatesProps> = ({ userType, userId }) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateObject, setSelectedDateObject] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Construct API path based on userType
  const getApiPath = useCallback((path: string) => {
    const basePath = userType === 'driver' ? 'drivers' : 'moving-partners';
    return `/api/${basePath}/${userId}/${path}`;
  }, [userType, userId]);

  const fetchBlockedDates = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(getApiPath('blocked-dates'));
      if (!response.ok) {
        throw new Error('Failed to fetch blocked dates');
      }
      const data = await response.json();
      setBlockedDates(data);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      setError('Unable to load blocked dates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getApiPath]);

  useEffect(() => {
    fetchBlockedDates();
  }, [fetchBlockedDates]);

  const handleAddBlockedDate = async () => {
    if (!selectedDate) return;

    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(getApiPath('blocked-dates'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blockedDate: selectedDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add blocked date');
      }
      
      const newBlockedDate = await response.json();
      setBlockedDates([...blockedDates, newBlockedDate]);
      setSelectedDate('');
      setSelectedDateObject(null);
    } catch (error) {
      console.error('Error adding blocked date:', error);
      setError(error instanceof Error ? error.message : 'Failed to add blocked date. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBlockedDate = async (id: number) => {
    try {
      setError(null);
      const response = await fetch(getApiPath(`blocked-dates/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove blocked date');
      }
      
      setBlockedDates(blockedDates.filter((date) => date.id !== id));
    } catch (error) {
      console.error('Error removing blocked date:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove blocked date. Please try again.');
    }
  };

  const handleDateChange = (formattedDate: string, dateObject: Date | null) => {
    setSelectedDate(formattedDate);
    setSelectedDateObject(dateObject);
    setError(null); // Clear error when user selects a new date
  };

  return (
    <div className="mt-12 max-w-5xl w-full mx-auto">
      {/* Section Header */}
      <div className="grid grid-cols-[1fr,auto] gap-8 border-b border-border pb-4">
        <h3 className="text-xl font-semibold text-text-primary">Block Specific Dates</h3>
        <div className="w-16" aria-hidden="true"></div>
      </div>

      {/* Add Blocked Date Form */}
      <div className="pt-4 border-b border-border">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="max-w-xl flex-1 min-w-[250px]">
            <CustomDatePicker
              value={selectedDateObject}
              onDateChange={handleDateChange}
              placeholder="Select a date to block"
              aria-label="Select date to block"
              aria-describedby={error ? 'blocked-dates-error' : undefined}
              allowPastDates={false}
            />
          </div>
          <Button
            onClick={handleAddBlockedDate}
            disabled={isSaving || !selectedDate}
            variant="primary"
            className="sm:mb-4 mb-2"
            aria-label={isSaving ? 'Adding blocked date...' : 'Block selected date'}
          >
            {isSaving ? 'Adding...' : 'Block Date'}
          </Button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div 
            id="blocked-dates-error"
            className="mt-2 mb-4 text-status-error text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>

      {/* Blocked Dates List */}
      {isLoading ? (
        <div className="pt-4 space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <div className="pt-4">
          {blockedDates.length === 0 ? (
            <div 
              className="text-center min-h-48 flex flex-col items-center justify-center bg-surface-secondary rounded-md"
              role="status"
              aria-label="No blocked dates"
            >
              <CalendarDateRangeIcon 
                className="mx-auto w-8 h-8 text-text-tertiary mb-2" 
                aria-hidden="true"
              />
              <p className="text-text-tertiary">No blocked dates</p>
            </div>
          ) : (
            <div 
              className="space-y-2"
              role="list"
              aria-label="Blocked dates list"
            >
              {blockedDates.map((date) => (
                <div
                  key={date.id}
                  className="sm:p-4 p-2 flex justify-between border-b border-border items-center rounded-md hover:bg-surface-secondary transition-colors"
                  role="listitem"
                >
                  <span className="text-text-primary font-medium">
                    {format(new Date(date.blockedDate), 'MMMM d, yyyy')}
                  </span>
                  <Button
                    onClick={() => handleRemoveBlockedDate(date.id)}
                    variant="secondary"
                    size="sm"
                    aria-label={`Remove blocked date: ${format(new Date(date.blockedDate), 'MMMM d, yyyy')}`}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informational Note */}
      <div className="mt-6">
        <p className="text-text-secondary border border-border rounded-md p-3 text-sm bg-surface-secondary">
          <strong className="text-text-primary">Note:</strong> Blocked dates will prevent any bookings on those specific days, regardless of your weekly availability settings.
        </p>
      </div>
    </div>
  );
};

export default BlockedDates;

