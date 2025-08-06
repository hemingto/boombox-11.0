/**
 * @fileoverview Appointment Onfleet service for team assignment and task management
 * @source boombox-10.0/src/app/api/onfleet/update-task/route.ts (team assignment and business logic)
 * @refactor Extracted core appointment Onfleet operations into centralized service
 */

import { prisma } from '@/lib/database/prismaClient';
import { geocodeAddress } from '@/lib/services/geocodingService';
import {
  calculateTaskTimeWindows,
  updateStorageUnitNotes,
  buildTaskDestination,
  type TaskPayload,
  WAREHOUSE_ADDRESS,
} from '@/lib/utils/onfleetTaskUtils';
import { parseAddress } from '@/lib/utils/formatUtils';

export interface AppointmentUpdateData {
  id: number;
  appointmentType?: string | null;
  address?: string | null;
  zipcode?: string | null;
  date?: string | Date | null;
  time?: string | Date | null;
  description?: string | null;
  numberOfUnits?: number | null;
  planType?: string | null;
  movingPartnerId?: number | null;
  selectedLabor?: {
    onfleetTeamId?: string;
  } | null;
}

export interface OnfleetTaskData {
  id: number;
  taskId: string;
  shortId: string;
  stepNumber: number | null;
  unitNumber: number | null;
}

export interface StorageUnitMapping {
  storageUnitId: number;
  storageUnit: {
    storageUnitNumber?: string | null;
    id: number;
  };
}

/**
 * Determines the appropriate Onfleet team ID based on appointment data and task details
 * @param appointmentData - The appointment information
 * @param stepNumber - Task step number (1, 2, or 3)
 * @param unitNumber - Unit number for the task
 * @returns Team ID or null if no team assignment needed
 */
export async function determineTeamAssignment(
  appointmentData: AppointmentUpdateData,
  stepNumber: number,
  unitNumber: number
): Promise<string | null> {
  // Only update team for steps 1-3 and only for unitNumber === 1
  if (!(stepNumber >= 1 && stepNumber <= 3 && unitNumber === 1)) {
    return null;
  }

  // First check if we have selectedLabor with onfleetTeamId
  if (appointmentData.selectedLabor?.onfleetTeamId) {
    return appointmentData.selectedLabor.onfleetTeamId;
  }

  // Fall back to plan type logic
  const isDIY = appointmentData.planType === 'Do It Yourself Plan';

  if (isDIY || unitNumber > 1) {
    return process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || null;
  } else if (appointmentData.movingPartnerId) {
    // Get the moving partner's Onfleet team ID from the database
    try {
      const movingPartner = await prisma.movingPartner.findUnique({
        where: { id: appointmentData.movingPartnerId },
        select: { onfleetTeamId: true, name: true },
      });

      if (movingPartner?.onfleetTeamId) {
        return movingPartner.onfleetTeamId;
      } else {
        // No onfleetTeamId found for moving partner, use default team
        return process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || null;
      }
    } catch (error) {
      console.error(`❌ Error fetching moving partner: ${error}`);
      return process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || null;
    }
  } else {
    // Default to Boombox team if no moving partner
    return process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || null;
  }
}

/**
 * Builds the complete task payload for Onfleet API
 * @param originalNotes - The original task notes from Onfleet
 * @param appointmentData - Appointment information
 * @param stepNumber - Task step number
 * @param unitNumbers - Comma-separated storage unit numbers
 * @param actualUnitNumber - Specific unit number for this task
 * @param teamId - Team ID for assignment (optional)
 * @param coordinates - Address coordinates (optional)
 * @param warehouseCoordinates - Warehouse coordinates (optional)
 * @returns Complete task payload for Onfleet API
 */
export async function buildTaskPayload(
  originalNotes: string,
  appointmentData: AppointmentUpdateData,
  stepNumber: number,
  unitNumbers: string,
  actualUnitNumber: string,
  teamId?: string | null,
  coordinates?: [number, number] | null,
  warehouseCoordinates?: [number, number] | null
): Promise<TaskPayload> {
  // Calculate time windows
  const appointmentTime = appointmentData.time
    ? typeof appointmentData.time === 'string'
      ? new Date(appointmentData.time)
      : appointmentData.time
    : new Date();
  const timeWindows = calculateTaskTimeWindows(appointmentTime, stepNumber);

  // Update notes with current storage unit information
  const updatedNotes = updateStorageUnitNotes(
    originalNotes,
    unitNumbers,
    actualUnitNumber,
    appointmentData.numberOfUnits || 1
  );

  // Build base payload
  const payload: TaskPayload = {
    notes: updatedNotes,
    completeAfter: timeWindows.completeAfter,
    completeBefore: timeWindows.completeBefore,
    metadata: [
      {
        name: 'appointmentId',
        type: 'string',
        value: String(appointmentData.id),
        visibility: ['api'],
      },
      {
        name: 'updatedAt',
        type: 'string',
        value: new Date().toISOString(),
        visibility: ['api'],
      },
      {
        name: 'planType',
        type: 'string',
        value: String(appointmentData.planType || ''),
        visibility: ['api'],
      },
    ],
  };

  // Add team assignment if provided
  if (teamId) {
    payload.container = {
      type: 'TEAM',
      team: teamId,
    };
  }

  // Add destination if coordinates are available
  if (coordinates && appointmentData.address) {
    const parsedAddress = parseAddress(appointmentData.address);
    const destination = buildTaskDestination(
      stepNumber,
      parsedAddress,
      coordinates,
      warehouseCoordinates || null
    );

    if (destination) {
      payload.destination = destination;
    }
  }

  return payload;
}

/**
 * Gets storage unit mapping for an appointment
 * @param appointmentId - The appointment ID
 * @returns Array of storage unit mappings
 */
export async function getStorageUnitMapping(
  appointmentId: number
): Promise<StorageUnitMapping[]> {
  return await prisma.requestedAccessStorageUnit.findMany({
    where: { appointmentId },
    include: {
      storageUnit: {
        select: {
          id: true,
          storageUnitNumber: true,
        },
      },
    },
  });
}

/**
 * Fetches original task data from Onfleet API
 * @param taskId - Onfleet task ID
 * @returns Original task data or null if failed
 */
export async function fetchOriginalOnfleetTask(taskId: string): Promise<any> {
  try {
    const response = await fetch(`https://onfleet.com/api/v2/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.ONFLEET_API_KEY || '').toString('base64')}`,
      },
    });

    if (!response.ok) {
      console.error(
        `❌ Failed to fetch original task ${taskId}:`,
        response.status
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching original task ${taskId}:`, error);
    return null;
  }
}

/**
 * Updates a single Onfleet task
 * @param taskId - Onfleet task ID
 * @param payload - Task update payload
 * @returns Update result with success status
 */
export async function updateOnfleetTask(
  taskId: string,
  payload: TaskPayload
): Promise<{
  taskId: string;
  shortId?: string;
  success: boolean;
  status?: number;
  error?: any;
  updatedTask?: any;
}> {
  try {
    const response = await fetch(`https://onfleet.com/api/v2/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(process.env.ONFLEET_API_KEY || '').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        taskId,
        success: false,
        status: response.status,
        error: responseData,
      };
    }

    return {
      taskId,
      success: true,
      status: response.status,
      updatedTask: responseData,
    };
  } catch (error) {
    return {
      taskId,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Legacy function for create-task route compatibility
 * @REFACTOR-P9-TEMP: Replace with proper Onfleet task creation when create-task route is refactored
 * Priority: High | Est: 6h | Dependencies: API_004_ONFLEET_DOMAIN
 */
export async function createOnfleetTasksWithDatabaseSave(payload: any) {
  // @REFACTOR-P9-TEMP: Replace mock implementation with actual Onfleet API calls and database saves
  // Priority: High | Est: 4h | Dependencies: API_004_ONFLEET_DOMAIN
  console.log(
    'PLACEHOLDER: Legacy createOnfleetTasksWithDatabaseSave called for appointment:',
    payload.appointmentId
  );

  return {
    taskIds: {
      pickup: [`pickup-${payload.appointmentId}`],
      customer: [`customer-${payload.appointmentId}`],
      return: [`return-${payload.appointmentId}`],
    },
    shortIds: {
      pickup: [`P-${payload.appointmentId}`],
      customer: [`C-${payload.appointmentId}`],
      return: [`R-${payload.appointmentId}`],
    },
  };
}

/**
 * AppointmentOnfleetService class for managing appointment-related Onfleet operations
 * @source boombox-10.0 (legacy appointment onfleet operations)
 * @refactor Consolidates appointment onfleet logic into a service class
 */
export class AppointmentOnfleetService {
  /**
   * Update appointment tasks in Onfleet
   */
  async updateAppointmentTasks(
    appointmentId: number,
    updates: AppointmentUpdateData
  ) {
    // @REFACTOR-P9-TEMP: Mock implementation
    console.log(
      'PLACEHOLDER: AppointmentOnfleetService.updateAppointmentTasks called',
      { appointmentId, updates }
    );
    return { success: true, message: 'Mock update completed' };
  }

  /**
   * Create new Onfleet tasks for appointment
   */
  async createAppointmentTasks(appointmentId: number, taskData: any) {
    // @REFACTOR-P9-TEMP: Mock implementation
    console.log(
      'PLACEHOLDER: AppointmentOnfleetService.createAppointmentTasks called',
      { appointmentId, taskData }
    );
    return { success: true, taskIds: [`task-${appointmentId}`] };
  }
}
