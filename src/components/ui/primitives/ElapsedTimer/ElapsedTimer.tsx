/**
 * @fileoverview ElapsedTimer component for displaying elapsed time between start and end times
 * @source boombox-10.0/src/app/components/reusablecomponents/elapsedtimer.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays elapsed time in MM:SS format between two timestamps
 * - Supports both live timer mode (no end time) and static duration display (with end time)
 * - Handles Unix timestamp inputs (seconds or milliseconds) and ISO strings
 * - Updates every second for live timers
 * - Displays "00:00" when no start time provided
 */

'use client';

import { useState, useEffect } from 'react';

export interface ElapsedTimerProps {
  /** Start time as Unix timestamp string (seconds or milliseconds) or ISO string */
  startTime: string;
  /** Optional end time as Unix timestamp string (seconds or milliseconds) or ISO string. If provided, shows static duration */
  endTime?: string;
}

/**
 * Parse a timestamp string to milliseconds
 * Handles: Unix seconds, Unix milliseconds, and ISO date strings
 */
function parseTimestamp(timestamp: string): number {
  const parsed = parseInt(timestamp);
  
  // If it's not a valid number, try parsing as ISO date string
  if (isNaN(parsed)) {
    return new Date(timestamp).getTime();
  }
  
  // If the timestamp is less than a reasonable millisecond value (before year 2001 in ms),
  // it's likely in seconds, so convert to milliseconds
  // Year 2001 in ms = 978307200000 (10 digits starts around here)
  // Timestamps in seconds from 2020+ are around 1.6-1.7 billion (10 digits)
  // Timestamps in milliseconds from 2020+ are around 1.6-1.7 trillion (13 digits)
  if (parsed < 10000000000) {
    // Likely seconds (10 digits or less), convert to milliseconds
    return parsed * 1000;
  }
  
  // Already in milliseconds (13 digits)
  return parsed;
}

/**
 * ElapsedTimer - Displays elapsed time between start and end times
 * 
 * Matches boombox-10.0 implementation with improved timestamp parsing.
 */
export function ElapsedTimer({ startTime, endTime }: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!startTime) {
      return;
    }

    if (endTime) {
      // If we have an end time, calculate the final duration
      const start = parseTimestamp(startTime);
      const end = parseTimestamp(endTime);
      const diff = end - start;

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setElapsed(formattedTime);
    } else {
      // If no end time, run as a live timer
      const calculateElapsed = () => {
        const start = parseTimestamp(startTime);
        const now = Date.now();
        const diff = now - start;

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      };

      setElapsed(calculateElapsed());

      const timer = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startTime, endTime]);

  return elapsed;
}

export default ElapsedTimer;
