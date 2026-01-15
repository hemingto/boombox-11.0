/**
 * @fileoverview Onfleet task utility functions for time calculations and payload building
 * @source boombox-10.0/src/app/api/onfleet/update-task/route.ts (various inline functions)
 * @refactor Extracted time window calculations and utility functions
 */

import { parseAddress } from '@/lib/utils/formatUtils';

// Warehouse address constant
export const WAREHOUSE_ADDRESS = "105 Associated Road, South San Francisco, CA 94080";

export interface TaskTimeWindows {
  completeAfter: number;
  completeBefore: number;
}

export interface TaskPayload {
  notes: string;
  completeAfter: number;
  completeBefore: number;
  metadata: Array<{
    name: string;
    type: string;
    value: string;
    visibility: string[];
  }>;
  container?: {
    type: string;
    team: string;
  };
  destination?: {
    address: any;
    location: [number, number];
  };
}

/**
 * Calculates time windows for different task steps
 * @param appointmentTime - The appointment date/time
 * @param stepNumber - The step number (1, 2, or 3)
 * @returns Time window object with completeAfter and completeBefore timestamps
 */
export function calculateTaskTimeWindows(appointmentTime: Date, stepNumber: number): TaskTimeWindows {
  const time = new Date(appointmentTime);
  
  switch (stepNumber) {
    case 1: // Get Storage Unit (1 hour before to 30 mins before appointment)
      const completeAfter1 = new Date(time);
      completeAfter1.setHours(completeAfter1.getHours() - 1);
      const completeBefore1 = new Date(time);
      completeBefore1.setMinutes(completeBefore1.getMinutes() - 30);
      return {
        completeAfter: completeAfter1.getTime(),
        completeBefore: completeBefore1.getTime()
      };
      
    case 2: // Customer Appointment (at appointment time to 1 hour after)
      const completeAfter2 = new Date(time);
      const completeBefore2 = new Date(time);
      completeBefore2.setHours(completeBefore2.getHours() + 1);
      return {
        completeAfter: completeAfter2.getTime(),
        completeBefore: completeBefore2.getTime()
      };
      
    case 3: // Return Storage Unit (1 hour after to 2 hours after appointment)
      const completeAfter3 = new Date(time);
      completeAfter3.setHours(completeAfter3.getHours() + 1);
      const completeBefore3 = new Date(time);
      completeBefore3.setHours(completeBefore3.getHours() + 2);
      return {
        completeAfter: completeAfter3.getTime(),
        completeBefore: completeBefore3.getTime()
      };
      
    default:
      throw new Error(`Invalid step number: ${stepNumber}`);
  }
}

/**
 * Updates storage unit information in task notes
 * @param notes - Original task notes
 * @param unitNumbers - Comma-separated unit numbers
 * @param actualUnitNumber - Specific unit number for this task
 * @param storageUnitCount - Total number of storage units
 * @returns Updated notes with current unit information
 */
export function updateStorageUnitNotes(
  notes: string, 
  unitNumbers: string, 
  actualUnitNumber: string,
  storageUnitCount: number
): string {
  let updatedNotes = notes;
  
  // Update "All requested units" section for pickup tasks
  if (updatedNotes.includes('All requested units:')) {
    const notesLines = updatedNotes.split('\n');
    const allUnitsLineIndex = notesLines.findIndex((line: string) => line.includes('All requested units:'));
    
    if (allUnitsLineIndex >= 0) {
      notesLines[allUnitsLineIndex] = `All requested units: ${unitNumbers}`;
      updatedNotes = notesLines.join('\n');
    }
  }
  
  // Update storage unit count in loading references
  if (updatedNotes.includes('loading')) {
    updatedNotes = updatedNotes.replace(/loading \d+ in total/g, `loading ${storageUnitCount} in total`);
    updatedNotes = updatedNotes.replace(/loading \d+ storage units?/g, 
      `loading ${storageUnitCount} storage unit${storageUnitCount > 1 ? 's' : ''}`);
    updatedNotes = updatedNotes.replace(/\d+ storage units?/g, 
      `${storageUnitCount} storage unit${storageUnitCount > 1 ? 's' : ''}`);
  }
  
  // Update specific unit number for this task
  if (actualUnitNumber) {
    updatedNotes = updatedNotes.replace(/Storage Unit Access: .+/g, `Storage Unit Access: ${actualUnitNumber}`);
    updatedNotes = updatedNotes.replace(/storage unit #.+\./g, `storage unit ${actualUnitNumber}.`);
    updatedNotes = updatedNotes.replace(/retrieve unit #.+/g, `retrieve unit ${actualUnitNumber}`);
  }
  
  return updatedNotes;
}

/**
 * Format parsed address for Onfleet API
 * Onfleet expects: { street, city, state, postalCode, country }
 * parseAddress returns: { number, street, city, state, postalCode, country }
 */
function formatAddressForOnfleet(parsedAddress: {
  number: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}) {
  return {
    street: `${parsedAddress.number} ${parsedAddress.street}`.trim(),
    city: parsedAddress.city,
    state: parsedAddress.state,
    postalCode: parsedAddress.postalCode,
    country: parsedAddress.country,
  };
}

/**
 * Builds task destination object based on step number and coordinates
 * @param stepNumber - The step number (1, 2, or 3)
 * @param customerAddress - Parsed customer address
 * @param customerCoordinates - Customer address coordinates
 * @param warehouseCoordinates - Warehouse coordinates
 * @returns Destination object or undefined
 */
export function buildTaskDestination(
  stepNumber: number,
  customerAddress: any,
  customerCoordinates: [number, number] | null,
  warehouseCoordinates: [number, number] | null
) {
  if (stepNumber === 2 && customerCoordinates) {
    // Customer tasks (step 2) use customer's address
    // Format address for Onfleet API requirements
    return {
      address: formatAddressForOnfleet(customerAddress),
      location: customerCoordinates
    };
  } else if ((stepNumber === 1 || stepNumber === 3) && warehouseCoordinates) {
    // Warehouse tasks (steps 1, 3) use warehouse address
    const parsedWarehouseAddress = parseAddress(WAREHOUSE_ADDRESS);
    if (parsedWarehouseAddress) {
      return {
        address: formatAddressForOnfleet(parsedWarehouseAddress),
        location: warehouseCoordinates
      };
    }
  }
  
  return undefined;
} 