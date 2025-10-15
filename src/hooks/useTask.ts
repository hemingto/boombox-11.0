/**
 * @fileoverview Custom hook for fetching admin task data
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/hooks/useTask.ts
 * 
 * HOOK FUNCTIONALITY:
 * - Fetches task data from /api/admin/tasks/[taskId] endpoint
 * - Manages loading and error states
 * - Supports various task types (feedback, cleaning, assignments, etc.)
 * 
 * @refactor Migrated from inline hooks folder to centralized hooks directory
 */

import { useState, useEffect } from 'react';

interface MovingPartner {
  name: string;
  email: string;
  phoneNumber: string;
  imageSrc?: string;
}

interface Driver {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePicture?: string;
}

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

interface Appointment {
  date: string;
  appointmentType: string;
  user: User;
}

interface Feedback {
  id: number;
  rating: number;
  comment: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  details: string;
  action: string;
  actionUrl?: string;
  color: 'cyan' | 'rose' | 'amber' | 'purple' | 'orange' | 'emerald';
  movingPartner?: MovingPartner;
  driver?: Driver;
  jobCode?: string;
  onfleetTaskIds?: string;
  customerName?: string;
  appointmentDate?: string;
  appointmentAddress?: string;
  appointment?: Appointment;
  feedback?: Feedback;
  storageUnitNumber?: string;
  appointmentId?: string;
  usageId?: number;
}

/**
 * Fetches and manages task data for admin workflows
 * @param taskId - Unique task identifier (e.g., "feedback-123", "storage-456")
 * @returns Object containing task data, loading state, and error state
 */
export function useTask(taskId: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setIsLoading(false);
        setError('No task ID provided');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/tasks/${taskId}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useTask] API error response:', errorText);
          throw new Error(`Failed to fetch task: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        if (data && data.task) {
          setTask(data.task);
        } else if (data && data.error) {
          console.error('[useTask] API returned an error:', data.error);
          setError(data.error);
        } else {
          console.warn('[useTask] Unexpected API response format');
          setError('Unexpected API response format');
        }
      } catch (error) {
        console.error('[useTask] Error fetching task:', error);
        setError(error instanceof Error ? error.message : 'Unknown error fetching task');
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    } else {
      setIsLoading(false);
      setError('No task ID provided');
    }
  }, [taskId]);

  return { task, isLoading, error };
}

