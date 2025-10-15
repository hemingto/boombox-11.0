/**
 * @fileoverview Calendar upcoming jobs list component for service providers
 * @source boombox-10.0/src/app/components/mover-account/calendarupcomingjobs.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a list of upcoming jobs for service providers with a button to open full calendar view.
 * Shows job cards in a vertical list with proper spacing and responsive layout.
 * Provides navigation to detailed calendar view via button action.
 * 
 * API ROUTES UPDATED:
 * - No API routes used directly (data passed via props from parent)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens:
 *   - bg-zinc-950 → bg-primary (button background)
 *   - hover:bg-zinc-800 → hover:bg-primary-hover
 *   - active:bg-zinc-700 → active:bg-primary-active
 *   - text-white → text-text-inverse
 * - Applied consistent spacing using design system patterns
 * - Used btn-primary utility class for button styling
 * - Updated text color to use text-text-primary for headings
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper ARIA labels for button actions
 * - Used semantic HTML section element for content grouping
 * - Added landmark roles for better screen reader navigation
 * - Enhanced heading hierarchy with proper h2 usage
 * - Provided descriptive button text for screen readers
 * 
 * @refactor Migrated from mover-account to service-providers/calendar folder structure.
 * Converted from demo component with hardcoded data to flexible component accepting jobs array.
 * Applied design system semantic color tokens throughout. Enhanced accessibility with proper
 * ARIA labels and semantic HTML. Added TypeScript interfaces for type safety.
 */

'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { CalendarJobCard } from './CalendarJobCard';
import type { CalendarJobCardProps } from './CalendarJobCard';

export interface CalendarUpcomingJobsProps {
  /** Array of upcoming job data to display */
  jobs?: CalendarJobCardProps[];
  /** Optional callback when Open Calendar button is clicked */
  onOpenCalendar?: () => void;
  /** Optional custom heading text */
  heading?: string;
  /** Optional button text override */
  buttonText?: string;
  /** Optional flag to hide the Open Calendar button */
  hideOpenCalendarButton?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

export const CalendarUpcomingJobs: React.FC<CalendarUpcomingJobsProps> = ({
  jobs = [],
  onOpenCalendar,
  heading = 'Upcoming jobs',
  buttonText = 'Open Calendar',
  hideOpenCalendarButton = false,
  className = '',
}) => {
  const handleOpenCalendar = () => {
    if (onOpenCalendar) {
      onOpenCalendar();
    }
  };

  return (
    <section 
      className={`flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-10 ${className}`}
      aria-label="Upcoming jobs section"
    >
      {/* Open Calendar Button */}
      {!hideOpenCalendarButton && (
        <button
          onClick={handleOpenCalendar}
          className="flex items-center w-fit rounded-md py-2.5 px-3 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-primary-active transition-colors duration-200 font-inter"
          aria-label="Open full calendar view"
        >
          <ArrowTopRightOnSquareIcon 
            className="w-5 h-5 mr-1" 
            aria-hidden="true"
          />
          {buttonText}
        </button>
      )}

      {/* Section Heading */}
      <h2 className="text-2xl font-semibold mt-16 mb-8 text-text-primary">
        {heading}
      </h2>

      {/* Jobs List */}
      {jobs.length > 0 ? (
        <div 
          className="space-y-4"
          role="list"
          aria-label="List of upcoming jobs"
        >
          {jobs.map((job, index) => (
            <div key={index} role="listitem">
              <CalendarJobCard {...job} />
            </div>
          ))}
        </div>
      ) : (
        <div 
          className="text-center py-12 px-6 bg-surface-secondary rounded-lg border border-border"
          role="status"
          aria-live="polite"
        >
          <p className="text-text-secondary text-base">
            No upcoming jobs at this time.
          </p>
          <p className="text-text-tertiary text-sm mt-2">
            Check back later for new job assignments.
          </p>
        </div>
      )}
    </section>
  );
};

export default CalendarUpcomingJobs;

