/**
 * @fileoverview Onfleet task building utilities for creating tasks with proper metadata and timing
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts (lines 17-348)
 * @refactor Extracted task building logic from 1,156-line monolith into reusable utilities
 */

import { parseAddress } from '@/lib/utils/formatUtils';
import { WAREHOUSE_ADDRESS } from '@/lib/utils/onfleetTaskUtils';

// ===== TASK TIMING UTILITIES =====

export interface TaskTimingConfig {
  appointmentTime: Date;
  existingUnitCount: number;
  currentUnitIndex: number;
}

export interface TaskTimingResult {
  adjustedStartTime: Date;
  adjustedAppointmentTime: Date;
  adjustedWindowEnd: Date;
}

/**
 * Calculates task timing with offsets for multiple units
 * Ensures times are not in the past
 */
export function calculateTaskTiming(config: TaskTimingConfig): TaskTimingResult {
  const { appointmentTime, existingUnitCount, currentUnitIndex } = config;
  
  const routeStartTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000); // 1 hour before
  const windowEnd = new Date(appointmentTime.getTime() + 60 * 60 * 1000); // 1 hour after
  
  // Calculate time offset based on how many units already exist plus current new unit index
  // This ensures new units get properly sequenced after existing ones
  // Each unit gets 45 minute offset
  const timeOffset = (existingUnitCount + currentUnitIndex) * 45 * 60 * 1000;
  
  let adjustedStartTime = new Date(routeStartTime.getTime() + timeOffset);
  let adjustedAppointmentTime = new Date(appointmentTime.getTime() + timeOffset);
  let adjustedWindowEnd = new Date(windowEnd.getTime() + timeOffset);
  
  // Validate timestamps are not in the past
  const now = new Date().getTime();
  
  if (adjustedStartTime.getTime() < now) {
    console.warn(`Warning: adjustedStartTime is in the past. Using now + 1 hour instead.`);
    adjustedStartTime = new Date(now + 60 * 60 * 1000);
  }
  
  if (adjustedAppointmentTime.getTime() < now) {
    console.warn(`Warning: adjustedAppointmentTime is in the past. Using now + 2 hours instead.`);
    adjustedAppointmentTime = new Date(now + 2 * 60 * 60 * 1000);
  }
  
  if (adjustedWindowEnd.getTime() < now) {
    console.warn(`Warning: adjustedWindowEnd is in the past. Using now + 3 hours instead.`);
    adjustedWindowEnd = new Date(now + 3 * 60 * 60 * 1000);
  }
  
  return {
    adjustedStartTime,
    adjustedAppointmentTime,
    adjustedWindowEnd,
  };
}

// ===== TASK METADATA & CUSTOM FIELDS =====

export interface TaskMetadataConfig {
  appointmentId: number;
  userId: number;
  appointmentType: string;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  stripeCustomerId?: string;
  parsedLoadingHelpPrice?: number;
  insuranceCoverage?: string;
  storageUnitCount: number;
  movingPartnerName?: string;
  planType: string;
  isAdditionalUnit: boolean;
  stepNumber: number;
  deliveryReason?: string;
  storageUnitId?: number;
}

/**
 * Builds Onfleet metadata array
 */
export function buildTaskMetadata(config: TaskMetadataConfig) {
  const baseMetadata = [
    {
      name: 'step',
      type: 'number' as const,
      value: config.stepNumber,
      visibility: ['api' as const],
    },
    {
      name: 'appointmentType',
      type: 'string' as const,
      value: String(config.appointmentType),
      visibility: ['api' as const],
    },
    {
      name: 'monthlyStorageRate',
      type: 'number' as const,
      value: Number(config.monthlyStorageRate) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'monthlyInsuranceRate',
      type: 'number' as const,
      value: Number(config.monthlyInsuranceRate) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'stripeCustomerId',
      type: 'string' as const,
      value: config.stripeCustomerId ? String(config.stripeCustomerId) : '',
      visibility: ['api' as const],
    },
    {
      name: 'parsedLoadingHelpPrice',
      type: 'number' as const,
      value: Number(config.parsedLoadingHelpPrice) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'insuranceCoverage',
      type: 'string' as const,
      value: String(config.insuranceCoverage || 'No Insurance'),
      visibility: ['api' as const],
    },
    {
      name: 'storageUnitCount',
      type: 'number' as const,
      value: Number(config.storageUnitCount) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'movingPartnerName',
      type: 'string' as const,
      value: String(config.movingPartnerName || 'No Moving Partner'),
      visibility: ['api' as const],
    },
    {
      name: 'planType',
      type: 'string' as const,
      value: String(config.planType || ''),
      visibility: ['api' as const],
    },
    {
      name: 'additionalUnit',
      type: 'boolean' as const,
      value: config.isAdditionalUnit,
      visibility: ['api' as const],
    },
  ];

  // Add delivery reason and storage unit ID for access appointments
  const isAccessAppointment =
    config.appointmentType === 'Storage Unit Access' ||
    config.appointmentType === 'End Storage Term';

  if (isAccessAppointment && config.deliveryReason) {
    baseMetadata.push({
      name: 'deliveryReason',
      type: 'string' as const,
      value: String(config.deliveryReason),
      visibility: ['api' as const],
    });
  }

  if (isAccessAppointment && config.storageUnitId) {
    baseMetadata.push({
      name: 'storageUnitId',
      type: 'string' as const,
      value: String(config.storageUnitId),
      visibility: ['api' as const],
    });
  }

  return baseMetadata;
}

/**
 * Builds Onfleet custom fields array
 */
export function buildTaskCustomFields(config: {
  appointmentId: number;
  unitNumber: number;
  userId: number;
  customerName: string;
  stepLabel: string;
  storageUnitId?: number;
  storageUnitNumber?: string; // Add this to pass the actual storage unit number (e.g., "SFBB004")
  isAccessAppointment: boolean;
}) {
  const baseFields = [
    {
      key: 'boomboxAppointmentId',
      value: config.appointmentId,
    },
    {
      key: 'boomboxUnitNumber',
      value: config.storageUnitNumber || `Unit #${config.unitNumber}`, // Use actual storage unit number or fallback
    },
    {
      key: 'boomboxUserId',
      value: config.userId,
    },
    {
      key: 'customerName',
      value: config.customerName,
    },
    {
      key: 'step',
      value: config.stepLabel,
    },
  ];

  // Add storage unit ID for access appointments
  if (config.isAccessAppointment && config.storageUnitId) {
    baseFields.push({
      key: 'storageUnitId',
      value: config.storageUnitId,
    });
  }

  return baseFields;
}

// ===== TASK NOTES BUILDERS =====

export interface TaskNotesPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  deliveryReason?: string;
  description?: string;
  parsedLoadingHelpPrice?: number;
  selectedLabor?: {
    title?: string;
  };
}

/**
 * Builds task notes for DIY Plan - Pickup step
 */
export function buildDiyPickupNotes(
  payload: TaskNotesPayload,
  unitNumber: string,
  allUnits: string
): string {
  return `STEP 1: WAREHOUSE PICKUP

Customer needs access to storage unit ${unitNumber}.

All requested units: ${allUnits}

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Reason: ${payload.deliveryReason || 'Initial Storage'}
Plan: Do It Yourself Plan (Customer will handle loading/unloading)

Instructions: Please locate and retrieve unit ${unitNumber}`;
}

/**
 * Builds task notes for DIY Plan - Customer delivery step
 */
export function buildDiyCustomerNotes(
  payload: TaskNotesPayload,
  unitNumber: string
): string {
  return `STEP 2: CUSTOMER DELIVERY

Storage Unit Access: ${unitNumber}

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Plan: Do It Yourself Plan (Customer will handle loading/unloading)

Instructions: Customer will handle loading/unloading. Please wait for them to complete.
Additional Notes: ${payload.description || 'No added info'}`;
}

/**
 * Builds task notes for DIY Plan - Return step
 */
export function buildDiyReturnNotes(
  payload: TaskNotesPayload,
  unitNumber: string
): string {
  return `STEP 3: RETURN TO WAREHOUSE

Return storage unit #${unitNumber} to warehouse.

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Instructions: Return unit to warehouse, ensure unit is secure.`;
}

/**
 * Builds task notes for Full Service Plan - Pickup step (with moving partner)
 */
export function buildFullServicePickupNotes(
  payload: TaskNotesPayload,
  unitNumber: string
): string {
  return `STEP 1: WAREHOUSE PICKUP

Customer needs access to storage unit #${unitNumber}.

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Reason: ${payload.deliveryReason || 'Initial Storage'}
Plan: Full Service Plan (Moving partner will assist with loading/unloading)

Instructions: Please locate and retrieve unit #${unitNumber}`;
}

/**
 * Builds task notes for Full Service Plan - Customer delivery step (with moving partner)
 */
export function buildFullServiceCustomerNotes(
  payload: TaskNotesPayload,
  unitNumber: string
): string {
  return `STEP 2: CUSTOMER DELIVERY

Storage Unit Access: #${unitNumber}

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Plan: Full Service (Moving partner will assist with loading/unloading)

Partner: ${payload.selectedLabor?.title || 'Moving Partner'}
Rate: ${payload.parsedLoadingHelpPrice}/hr

Instructions: Assist customer with loading/unloading as needed.
Additional Notes: ${payload.description || 'No added info'}`;
}

/**
 * Builds task notes for Full Service Plan - Additional units (driver network)
 */
export function buildDriverNetworkPickupNotes(
  payload: TaskNotesPayload,
  unitNumber: string
): string {
  return `STEP 1: WAREHOUSE PICKUP

Customer needs access to storage unit #${unitNumber}.

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Reason: ${payload.deliveryReason || 'Initial Storage'}
Plan: Full Service Plan (Additional unit)

Instructions: Please locate and retrieve unit #${unitNumber}`;
}

/**
 * Builds task notes for Full Service Plan - Additional units customer delivery
 */
export function buildDriverNetworkCustomerNotes(
  payload: TaskNotesPayload,
  unitNumber: string
): string {
  return `STEP 2: CUSTOMER DELIVERY (Additional Unit)

Storage Unit Access: #${unitNumber}

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Instructions: This is an additional unit for this customer. Deliver to customer location.
Additional Notes: ${payload.description || 'No added info'}`;
}

/**
 * Builds task notes for Return step (both DIY and Full Service)
 */
export function buildReturnNotes(
  payload: TaskNotesPayload,
  unitNumber: string
): string {
  return `STEP 3: RETURN TO WAREHOUSE

Return storage unit #${unitNumber} to warehouse.

Customer Name: ${payload.firstName} ${payload.lastName}
Phone: ${payload.phoneNumber}
Instructions: Return unit to warehouse, ensure unit is secure.`;
}

/**
 * Factory function to build all 3 task notes based on plan type and unit number
 */
export function buildTaskNotes(
  payload: TaskNotesPayload,
  unitNumber: string,
  allUnits: string,
  isDIY: boolean,
  isFirstUnit: boolean,
  isAccessAppointment: boolean
) {
  if (isAccessAppointment) {
    if (isDIY) {
      return {
        pickup: buildDiyPickupNotes(payload, unitNumber, allUnits),
        customer: buildDiyCustomerNotes(payload, unitNumber),
        return: buildDiyReturnNotes(payload, unitNumber),
      };
    } else {
      // Full Service Plan
      if (isFirstUnit) {
        return {
          pickup: buildFullServicePickupNotes(payload, unitNumber),
          customer: buildFullServiceCustomerNotes(payload, unitNumber),
          return: buildReturnNotes(payload, unitNumber),
        };
      } else {
        // Additional units
        return {
          pickup: buildDriverNetworkPickupNotes(payload, unitNumber),
          customer: buildDriverNetworkCustomerNotes(payload, unitNumber),
          return: buildReturnNotes(payload, unitNumber),
        };
      }
    }
  } else {
    // Standard appointment (not access)
    if (isDIY) {
      return {
        pickup: buildDiyPickupNotes(payload, unitNumber, allUnits),
        customer: buildDiyCustomerNotes(payload, unitNumber),
        return: buildDiyReturnNotes(payload, unitNumber),
      };
    } else {
      if (isFirstUnit) {
        return {
          pickup: buildFullServicePickupNotes(payload, unitNumber),
          customer: buildFullServiceCustomerNotes(payload, unitNumber),
          return: buildReturnNotes(payload, unitNumber),
        };
      } else {
        return {
          pickup: buildDriverNetworkPickupNotes(payload, unitNumber),
          customer: buildDriverNetworkCustomerNotes(payload, unitNumber),
          return: buildReturnNotes(payload, unitNumber),
        };
      }
    }
  }
}

