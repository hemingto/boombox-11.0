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
import {
  calculateStepCostBreakdown,
  calculateTravelMetrics,
  BOOMBOX_DRIVER_SERVICE_TIME_ESTIMATES,
  WAREHOUSE_ADDRESS as CALC_WAREHOUSE_ADDRESS,
  type StepCostBreakdown,
} from '@/lib/services/payment-calculator';

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
  loadingHelpPrice?: number | null;
  storageUnitCount?: number | null;
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
 * Creates linked Onfleet tasks and saves them to the database
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts (lines 17-827, 830-959)
 * @refactor Extracted from monolithic API route into service function with optimizations
 */
export async function createOnfleetTasksWithDatabaseSave(payload: any) {
  const uniqueCallId = Math.random().toString(36).substring(2, 10);
  console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - createOnfleetTasksWithDatabaseSave called with payload:`, JSON.stringify(payload, null, 2));

  const apiKey = process.env.ONFLEET_API_KEY;
  if (!apiKey) {
    throw new Error('ONFLEET_API_KEY is not defined');
  }

  const ONFLEET_API_URL = 'https://onfleet.com/api/v2';
  const step1phonenumber = "+14153223135";
  const step3phonenumber = "+14153223134";

  // Import utilities
  const { calculateTaskTiming, buildTaskMetadata, buildTaskCustomFields, buildTaskNotes } = await import('@/lib/services/onfleet/taskBuilder');
  const { WAREHOUSE_ADDRESS } = await import('@/lib/utils/onfleetTaskUtils');

  const customerAddress = parseAddress(payload.address);
  const warehouseAddress = parseAddress(WAREHOUSE_ADDRESS);
  const appointmentTime = new Date(payload.appointmentDateTime);
  
  // Determine if this is an access appointment
  const isAccessAppointment = payload.appointmentType === "Storage Unit Access" || payload.appointmentType === "End Storage Term";
  const isAdditionalStorageAppointment = payload.appointmentType === "Additional Storage";
  
  // Get storage unit IDs from the payload
  let storageUnitIds: number[] = [];
  
  if (isAccessAppointment && payload.storageUnitIds) {
    storageUnitIds = Array.isArray(payload.storageUnitIds) 
      ? payload.storageUnitIds 
      : [payload.storageUnitIds];
      
    if (!payload.additionalUnitsOnly && payload.appointmentId) {
      // Fetch all storage units for this appointment (single query optimization)
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: parseInt(String(payload.appointmentId), 10) },
          include: {
            requestedStorageUnits: {
              include: {
                storageUnit: true
              }
            }
          }
        });

        if (appointment && appointment.requestedStorageUnits) {
          storageUnitIds = appointment.requestedStorageUnits.map(
            relation => relation.storageUnit.id
          );
        }
      } catch (error) {
        console.error('Error fetching storage units for appointment:', error);
      }
    }
  }
    
  // Determine unit count
  let unitCount = 0;
  if (isAccessAppointment && payload.storageUnitIds) {
    unitCount = storageUnitIds.length;
  } else if (isAdditionalStorageAppointment) {
    unitCount = payload.storageUnitCount || 0;
  } else {
    unitCount = payload.storageUnitCount || 0;
  }

  // Arrays to store all task IDs and short IDs
  const allTaskIds = {
    pickup: [] as string[],
    customer: [] as string[],
    return: [] as string[]
  };
  const allShortIds = {
    pickup: [] as string[],
    customer: [] as string[],
    return: [] as string[]
  };

  // Fetch existing tasks for this appointment (idempotency check)
  const existingTasks = await prisma.onfleetTask.findMany({
    where: { appointmentId: parseInt(String(payload.appointmentId), 10) },
    orderBy: [{ unitNumber: 'asc' }, { stepNumber: 'asc' }]
  });

  // Group existing tasks by step number
  const tasksByStep = {
    1: [] as any[],
    2: [] as any[],
    3: [] as any[]
  };

  existingTasks.forEach(task => {
    if (task.stepNumber && (task.stepNumber === 1 || task.stepNumber === 2 || task.stepNumber === 3)) {
      tasksByStep[task.stepNumber as 1 | 2 | 3].push(task);
    }
  });

  // Get the starting unit number (for additional units)
  const startingUnitNumber = payload.startingUnitNumber || 1;
  console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Starting unit number: ${startingUnitNumber}, unitCount: ${unitCount}`);

  // Get storage unit numbers for all units (single query optimization)
  const storageUnits = storageUnitIds.length > 0 
    ? await prisma.storageUnit.findMany({
        where: { id: { in: storageUnitIds } },
        select: { id: true, storageUnitNumber: true }
      })
    : [];

  const storageUnitNumbersMap: Record<number, string> = {};
  storageUnits.forEach(unit => {
    storageUnitNumbersMap[unit.id] = unit.storageUnitNumber || `Unit #${unit.id}`;
  });

  // Calculate cost breakdown for all 3 steps using Google Maps
  // This is done once before the loop since all units have the same distance
  console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Calculating cost breakdowns for address: ${payload.address}`);
  
  let stepCostBreakdowns: StepCostBreakdown[] = [];
  try {
    const customerAddressForCalc = payload.address || '';
    const appointmentTypeForCalc = payload.appointmentType || 'Initial Pickup';
    
    // Calculate cost breakdown for each step (defaults to boombox_driver, updated when driver assigned)
    const step1Breakdown = await calculateStepCostBreakdown(1, 'boombox_driver', customerAddressForCalc, appointmentTypeForCalc);
    const step2Breakdown = await calculateStepCostBreakdown(2, 'boombox_driver', customerAddressForCalc, appointmentTypeForCalc);
    const step3Breakdown = await calculateStepCostBreakdown(3, 'boombox_driver', customerAddressForCalc, appointmentTypeForCalc);
    
    stepCostBreakdowns = [step1Breakdown, step2Breakdown, step3Breakdown];
    
    console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Cost breakdowns calculated:`, {
      step1: { total: step1Breakdown.totalCost, fixed: step1Breakdown.fixedFeePay },
      step2: { total: step2Breakdown.totalCost, mileage: step2Breakdown.mileagePay, drive: step2Breakdown.driveTimePay, service: step2Breakdown.serviceTimePay },
      step3: { total: step3Breakdown.totalCost, mileage: step3Breakdown.mileagePay, drive: step3Breakdown.driveTimePay },
      distanceMiles: step2Breakdown.estimatedDistanceMiles,
      driveTimeMinutes: step2Breakdown.estimatedDriveTimeMinutes,
      serviceHours: step2Breakdown.estimatedServiceHours
    });
  } catch (costError) {
    console.error(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Error calculating cost breakdowns:`, costError);
    // Continue with empty breakdowns - will be calculated later
  }

  // Prepare bulk database writes
  const createdPrismaTasks: any[] = [];

  try {
    for (let i = 0; i < unitCount; i++) {
      const currentUnitIterationNumber = startingUnitNumber + i;
      console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Iteration ${i} for unit ${currentUnitIterationNumber}`);

      // Check if tasks for this specific unit number already exist (idempotency)
      const tasksForThisUnitNumber = existingTasks.filter(task => task.unitNumber === currentUnitIterationNumber);
      const step1ExistingTask = tasksForThisUnitNumber.find(task => task.stepNumber === 1 && task.taskId);
      const step2ExistingTask = tasksForThisUnitNumber.find(task => task.stepNumber === 2 && task.taskId);
      const step3ExistingTask = tasksForThisUnitNumber.find(task => task.stepNumber === 3 && task.taskId);

      if (step1ExistingTask && step2ExistingTask && step3ExistingTask) {
        console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Tasks for unit ${currentUnitIterationNumber} already exist. Skipping.`);
        
        allTaskIds.pickup.push(step1ExistingTask.taskId);
        allShortIds.pickup.push(step1ExistingTask.shortId);
        allTaskIds.customer.push(step2ExistingTask.taskId);
        allShortIds.customer.push(step2ExistingTask.shortId);
        allTaskIds.return.push(step3ExistingTask.taskId);
        allShortIds.return.push(step3ExistingTask.shortId);
        
        continue; // Skip to the next unit
      } else if (tasksForThisUnitNumber.length > 0) {
        console.warn(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Partial tasks found for unit ${currentUnitIterationNumber}. Proceeding with creation.`);
      }

      // Calculate time windows with offsets
      const existingUnitCount = Math.max(
        tasksByStep[1].length,
        tasksByStep[2].length,
        tasksByStep[3].length
      );
      
      const timing = calculateTaskTiming({
        appointmentTime,
        existingUnitCount,
        currentUnitIndex: i
      });

      // Get specific storage unit info
      const specificUnitId = payload.storageUnitIds && payload.storageUnitIds[i] 
        ? payload.storageUnitIds[i] 
        : null;

      const specificStorageUnitNumberLabel = specificUnitId && storageUnitNumbersMap[specificUnitId]
        ? storageUnitNumbersMap[specificUnitId]
        : specificUnitId ? `DB Unit ID #${specificUnitId}` : `Calculated Unit #${currentUnitIterationNumber}`;
      
      console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Creating tasks for unit: ${specificStorageUnitNumberLabel}`);
      
      // Get all unit numbers as a comma-separated string
      const allUnitNumbers = storageUnitIds.map((id: number) => 
        storageUnitNumbersMap[id] || id.toString()
      ).join(', ');
      
      // Determine team and plan type
      const isDIY = payload.selectedPlanName === 'Do It Yourself Plan' || !payload.selectedLabor;
      const teamId = isDIY || currentUnitIterationNumber > 1 
        ? process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID 
        : payload.selectedLabor?.onfleetTeamId || process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;

      // Build task notes using the factory
      const notes = buildTaskNotes(
        payload,
        specificStorageUnitNumberLabel,
        allUnitNumbers,
        isDIY,
        currentUnitIterationNumber === 1,
        isAccessAppointment
      );

      // Build metadata and custom fields using utilities
      const metadataConfig = {
        appointmentId: parseInt(String(payload.appointmentId), 10),
        userId: parseInt(String(payload.userId), 10),
        appointmentType: payload.appointmentType,
        monthlyStorageRate: payload.monthlyStorageRate,
        monthlyInsuranceRate: payload.monthlyInsuranceRate,
        stripeCustomerId: payload.stripeCustomerId,
        parsedLoadingHelpPrice: payload.parsedLoadingHelpPrice,
        insuranceCoverage: payload.selectedInsurance?.label,
        storageUnitCount: isAccessAppointment ? storageUnitIds.length : payload.storageUnitCount,
        movingPartnerName: payload.selectedLabor?.title || 'No Moving Partner',
        planType: payload.selectedPlanName || '',
        isAdditionalUnit: existingUnitCount > 0,
        stepNumber: 1,
        deliveryReason: payload.deliveryReason,
        storageUnitId: specificUnitId
      };

      // Create Step 1: Warehouse Pickup
      const pickupTaskPayload = {
        destination: { address: warehouseAddress },
        recipients: [{
          name: `STEP-1: Get Storage Unit`,
          phone: step1phonenumber,
          skipPhoneNumberValidation: true,
          notes: "",
        }],
        notes: notes.pickup,
        serviceTime: 20,
        completeAfter: timing.adjustedStartTime.getTime(),
        completeBefore: timing.adjustedStartTime.getTime() + (30 * 60 * 1000),
        quantity: 1,
        container: { type: "TEAM", team: teamId },
        recipientSkipSMSNotifications: true,
        pickupTask: true,
      // Note: dependencies omitted for first task (no dependencies)
      customFields: buildTaskCustomFields({
        appointmentId: parseInt(String(payload.appointmentId), 10),
        unitNumber: currentUnitIterationNumber,
        userId: parseInt(String(payload.userId), 10),
        customerName: `${payload.firstName} ${payload.lastName}`,
        stepLabel: "Step 1 - Warehouse Unit Pickup",
        storageUnitId: specificUnitId,
        storageUnitNumber: specificStorageUnitNumberLabel,
        isAccessAppointment
      }),
      metadata: buildTaskMetadata({ ...metadataConfig, stepNumber: 1 })
    };

      const pickupTaskResponse = await fetch(`${ONFLEET_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
        },
        body: JSON.stringify(pickupTaskPayload)
      });

      if (!pickupTaskResponse.ok) {
        const errorData = await pickupTaskResponse.json();
        console.error('Failed to create Onfleet pickup task:', errorData);
        throw new Error(`Failed to create Onfleet pickup task: ${JSON.stringify(errorData)}`);
      }

      const pickupTaskData = await pickupTaskResponse.json();
      allTaskIds.pickup.push(pickupTaskData.id);
      allShortIds.pickup.push(pickupTaskData.shortId);

      // Create Step 2: Customer Location
      const customerTaskPayload = {
        destination: { address: customerAddress },
        recipients: [{
          name: `${payload.firstName} ${payload.lastName}`,
          phone: payload.phoneNumber,
          notes: "",
        }],
        notes: notes.customer,
        completeAfter: timing.adjustedAppointmentTime.getTime(),
        completeBefore: timing.adjustedWindowEnd.getTime(),
        quantity: 1,
        container: { type: "TEAM", team: teamId },
        serviceTime: 90,
        dependencies: [pickupTaskData.id],
        pickupTask: true,
        // Require photo for Step 2 completion - photo is used for StorageUnitUsage.mainImage
        requirements: {
          photo: true
        },
        customFields: buildTaskCustomFields({
          appointmentId: parseInt(String(payload.appointmentId), 10),
          unitNumber: currentUnitIterationNumber,
          userId: parseInt(String(payload.userId), 10),
          customerName: `${payload.firstName} ${payload.lastName}`,
          stepLabel: "Step 2 - Customer Access",
          storageUnitId: specificUnitId,
          storageUnitNumber: specificStorageUnitNumberLabel,
          isAccessAppointment
        }),
        metadata: buildTaskMetadata({ ...metadataConfig, stepNumber: 2 })
      };

      const customerTaskResponse = await fetch(`${ONFLEET_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
        },
        body: JSON.stringify(customerTaskPayload)
      });

      if (!customerTaskResponse.ok) {
        const errorData = await customerTaskResponse.json();
        console.error('Onfleet customer task creation failed:', errorData);
        throw new Error(`Failed to create Onfleet customer task: ${JSON.stringify(errorData)}`);
      }

      const customerTaskData = await customerTaskResponse.json();
      allTaskIds.customer.push(customerTaskData.id);
      allShortIds.customer.push(customerTaskData.shortId);

      // Create Step 3: Return to Warehouse
      const returnTaskPayload = {
        destination: { address: warehouseAddress },
        recipients: [{
          name: `STEP-3: Return Storage Unit`,
          phone: step3phonenumber,
          skipPhoneNumberValidation: true,
          notes: "",
        }],
        notes: notes.return,
        quantity: 1,
        container: { type: "TEAM", team: teamId },
        completeBefore: timing.adjustedWindowEnd.getTime() + (60 * 60 * 1000),
        completeAfter: timing.adjustedWindowEnd.getTime(),
        dependencies: [customerTaskData.id],
        recipientSkipSMSNotifications: true,
        customFields: buildTaskCustomFields({
          appointmentId: parseInt(String(payload.appointmentId), 10),
          unitNumber: currentUnitIterationNumber,
          userId: parseInt(String(payload.userId), 10),
          customerName: `${payload.firstName} ${payload.lastName}`,
          stepLabel: "Step 3 - Return Storage Unit",
          storageUnitId: specificUnitId,
          storageUnitNumber: specificStorageUnitNumberLabel,
          isAccessAppointment
        }),
        metadata: buildTaskMetadata({ ...metadataConfig, stepNumber: 3 })
      };

      const returnTaskResponse = await fetch(`${ONFLEET_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
        },
        body: JSON.stringify(returnTaskPayload)
      });

      if (!returnTaskResponse.ok) {
        const errorData = await returnTaskResponse.json();
        console.error('Onfleet return task creation failed:', errorData);
        throw new Error(`Failed to create Onfleet return task: ${JSON.stringify(errorData)}`);
      }

      const returnTaskData = await returnTaskResponse.json();
      allTaskIds.return.push(returnTaskData.id);
      allShortIds.return.push(returnTaskData.shortId);

      // Get cost breakdowns for each step (pre-calculated above)
      const step1Cost = stepCostBreakdowns[0] || null;
      const step2Cost = stepCostBreakdowns[1] || null;
      const step3Cost = stepCostBreakdowns[2] || null;

      // Prepare database records for bulk insert with cost breakdown fields
      createdPrismaTasks.push(
        {
          appointmentId: parseInt(String(payload.appointmentId), 10),
          taskId: pickupTaskData.id,
          shortId: pickupTaskData.shortId,
          stepNumber: 1,
          unitNumber: currentUnitIterationNumber,
          storageUnitId: specificUnitId, // Link to storage unit in schema
          workerType: 'boombox_driver', // Default, updated when driver assigned
          // Cost breakdown fields for Step 1 (fixed fee only)
          estimatedCost: step1Cost?.totalCost || null,
          estimatedDistanceMiles: step1Cost?.estimatedDistanceMiles || null,
          estimatedDriveTimeMinutes: step1Cost?.estimatedDriveTimeMinutes || null,
          estimatedServiceHours: step1Cost?.estimatedServiceHours || null,
          fixedFeePay: step1Cost?.fixedFeePay || null,
          mileagePay: step1Cost?.mileagePay || null,
          driveTimePay: step1Cost?.driveTimePay || null,
          serviceTimePay: step1Cost?.serviceTimePay || null,
        },
        {
          appointmentId: parseInt(String(payload.appointmentId), 10),
          taskId: customerTaskData.id,
          shortId: customerTaskData.shortId,
          stepNumber: 2,
          unitNumber: currentUnitIterationNumber,
          storageUnitId: specificUnitId, // Link to storage unit in schema
          workerType: 'boombox_driver', // Default, updated when driver assigned
          // Cost breakdown fields for Step 2 (drive + service + mileage)
          estimatedCost: step2Cost?.totalCost || null,
          estimatedDistanceMiles: step2Cost?.estimatedDistanceMiles || null,
          estimatedDriveTimeMinutes: step2Cost?.estimatedDriveTimeMinutes || null,
          estimatedServiceHours: step2Cost?.estimatedServiceHours || null,
          fixedFeePay: step2Cost?.fixedFeePay || null,
          mileagePay: step2Cost?.mileagePay || null,
          driveTimePay: step2Cost?.driveTimePay || null,
          serviceTimePay: step2Cost?.serviceTimePay || null,
        },
        {
          appointmentId: parseInt(String(payload.appointmentId), 10),
          taskId: returnTaskData.id,
          shortId: returnTaskData.shortId,
          stepNumber: 3,
          unitNumber: currentUnitIterationNumber,
          storageUnitId: specificUnitId, // Link to storage unit in schema
          workerType: 'boombox_driver', // Default, updated when driver assigned
          // Cost breakdown fields for Step 3 (drive + mileage)
          estimatedCost: step3Cost?.totalCost || null,
          estimatedDistanceMiles: step3Cost?.estimatedDistanceMiles || null,
          estimatedDriveTimeMinutes: step3Cost?.estimatedDriveTimeMinutes || null,
          estimatedServiceHours: step3Cost?.estimatedServiceHours || null,
          fixedFeePay: step3Cost?.fixedFeePay || null,
          mileagePay: step3Cost?.mileagePay || null,
          driveTimePay: step3Cost?.driveTimePay || null,
          serviceTimePay: step3Cost?.serviceTimePay || null,
        }
      );

      console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Successfully created 3 Onfleet tasks for unit ${currentUnitIterationNumber}.`);
    }

    // Bulk insert all database records (optimization)
    if (createdPrismaTasks.length > 0) {
      await prisma.onfleetTask.createMany({
        data: createdPrismaTasks,
        skipDuplicates: true // Handle race conditions gracefully
      });
      console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Saved ${createdPrismaTasks.length} tasks to database`);
    }

    // Calculate and save total estimated cost on the appointment
    // Sum individual task costs: Step 1 (fixed) + Step 2 (drive+service+mileage) + Step 3 (drive+mileage)
    const totalEstimatedCost = stepCostBreakdowns.reduce((sum, step) => sum + (step?.totalCost || 0), 0) * unitCount;
    if (totalEstimatedCost > 0) {
      try {
        await prisma.appointment.update({
          where: { id: parseInt(String(payload.appointmentId), 10) },
          data: { totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100 }
        });
        console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Saved totalEstimatedCost: $${totalEstimatedCost.toFixed(2)} to appointment ${payload.appointmentId}`);
      } catch (updateError) {
        console.error(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Error saving totalEstimatedCost:`, updateError);
      }
    }

    // Cost breakdowns are now calculated and saved with task creation (above)
    console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - Cost breakdowns saved with tasks`);

    console.log(`ONFLEET_SERVICE: DEBUG [${uniqueCallId}] - createOnfleetTasksWithDatabaseSave finished successfully`);
    return {
      taskIds: allTaskIds,
      shortIds: allShortIds
    };
  } catch (error: any) {
    console.error('Error creating Onfleet tasks:', error);
    throw error;
  }
}

/**
 * NOTE: The AppointmentOnfleetService class has been replaced by the new orchestrator architecture:
 * - AppointmentUpdateOrchestrator handles appointment updates
 * - OnfleetTaskUpdateService handles low-level Onfleet API operations
 * - NotificationOrchestrator handles driver/mover notifications
 * 
 * The exported functions in this file (determineTeamAssignment, buildTaskPayload, etc.) 
 * are still used by the new orchestrator and remain fully functional.
 */
