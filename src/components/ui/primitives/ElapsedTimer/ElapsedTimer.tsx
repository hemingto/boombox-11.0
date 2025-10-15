/**
 * @fileoverview ElapsedTimer component for displaying elapsed time between start and end times
 * @source boombox-10.0/src/app/components/reusablecomponents/elapsedtimer.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays elapsed time in MM:SS format between two timestamps
 * - Supports both live timer mode (no end time) and static duration display (with end time)
 * - Handles Unix timestamp inputs (milliseconds)
 * - Updates every second for live timers
 * - Displays "00:00" when no start time provided
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses design system text colors (text-text-primary, text-text-secondary)
 * - Added proper semantic HTML with time element
 * - Improved accessibility with ARIA labels and semantic markup
 * - Uses consistent typography classes from design system
 * 
 * @refactor 
 * - Enhanced TypeScript interfaces with proper JSDoc
 * - Added accessibility features (ARIA labels, semantic HTML)
 * - Improved error handling and edge cases
 * - Added design system color compliance
 * - Extracted time formatting logic for reusability
 * - Added proper component naming (PascalCase)
 * - Removed console.log statements for production readiness
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ElapsedTimerProps {
  /** Start time as Unix timestamp (milliseconds) or ISO string */
  startTime: string | number;
  /** Optional end time as Unix timestamp (milliseconds) or ISO string. If provided, shows static duration */
  endTime?: string | number;
  /** Additional CSS classes for styling */
  className?: string;
  /** Show milliseconds precision (default: false) */
  showMilliseconds?: boolean;
  /** Custom format function for time display */
  formatTime?: (minutes: number, seconds: number, milliseconds?: number) => string;
  /** Aria label for accessibility */
  'aria-label'?: string;
  /** Whether to auto-start the timer (default: true) */
  autoStart?: boolean;
}

/**
 * Format elapsed time into MM:SS or MM:SS.mmm format
 */
function formatElapsedTime(
  milliseconds: number, 
  showMilliseconds: boolean = false,
  customFormatter?: (minutes: number, seconds: number, ms?: number) => string
): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 10); // Two decimal places for milliseconds

  if (customFormatter) {
    return customFormatter(minutes, seconds, showMilliseconds ? ms : undefined);
  }

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  return showMilliseconds 
    ? `${formattedTime}.${String(ms).padStart(2, '0')}`
    : formattedTime;
}

/**
 * Parse timestamp input to Date object
 */
function parseTimestamp(timestamp: string | number): Date {
  if (typeof timestamp === 'string') {
    // Handle both ISO strings and string numbers
    const parsed = parseInt(timestamp);
    return isNaN(parsed) ? new Date(timestamp) : new Date(parsed);
  }
  return new Date(timestamp);
}

/**
 * ElapsedTimer - A primitive component for displaying elapsed time
 * 
 * Displays time elapsed between a start time and either the current time (live mode)
 * or a specified end time (static mode). Supports millisecond precision and custom formatting.
 */
export function ElapsedTimer({
  startTime,
  endTime,
  className,
  showMilliseconds = false,
  formatTime: customFormatter,
  'aria-label': ariaLabel,
  autoStart = true,
}: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState('00:00');
  const [isRunning, setIsRunning] = useState(false);

  /**
   * Calculate elapsed time between start and current/end time
   */
  const calculateElapsed = useCallback(() => {
    if (!startTime || !autoStart) {
      return '00:00';
    }

    try {
      const start = parseTimestamp(startTime).getTime();
      
      // Check if start timestamp is valid
      if (isNaN(start)) {
        return '00:00';
      }
      
      const end = endTime ? parseTimestamp(endTime).getTime() : Date.now();
      
      // Check if end timestamp is valid
      if (endTime && isNaN(end)) {
        return '00:00';
      }
      
      const diff = Math.max(0, end - start); // Ensure non-negative
      
      return formatElapsedTime(diff, showMilliseconds, customFormatter);
    } catch (error) {
      // Graceful fallback for invalid timestamps
      return '00:00';
    }
  }, [startTime, endTime, showMilliseconds, customFormatter, autoStart]);

  useEffect(() => {
    if (!startTime || !autoStart) {
      setElapsed('00:00');
      setIsRunning(false);
      return;
    }

    if (endTime) {
      // Static mode: calculate final duration once
      setElapsed(calculateElapsed());
      setIsRunning(false);
    } else {
      // Live mode: update every second (or 100ms for milliseconds)
      setIsRunning(true);
      setElapsed(calculateElapsed());
      
      const interval = setInterval(() => {
        setElapsed(calculateElapsed());
      }, showMilliseconds ? 100 : 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, endTime, calculateElapsed, showMilliseconds, autoStart]);

  const defaultAriaLabel = `Elapsed time: ${elapsed}${isRunning ? ' and counting' : ''}`;

  return (
    <time
      className={cn(
        // Design system text styles
        'text-text-primary font-mono text-sm tabular-nums',
        // Accessibility and visual states
        'select-none',
        isRunning && 'animate-pulse',
        className
      )}
      dateTime={`PT${elapsed.replace(':', 'M').replace('.', '.')}S`}
      aria-label={ariaLabel || defaultAriaLabel}
      role="timer"
      aria-live={isRunning ? 'polite' : 'off'}
      aria-atomic="true"
    >
      {elapsed}
    </time>
  );
}

export default ElapsedTimer;
