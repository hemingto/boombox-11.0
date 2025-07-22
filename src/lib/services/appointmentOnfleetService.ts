/**
 * @fileoverview Appointment Onfleet service for task creation and management
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts (createLinkedOnfleetTasks, createLinkedOnfleetTasksDirectly)
 * @refactor Extracted main orchestration logic from monolithic route function
 */

import { prisma } from '@/lib/database/prismaClient';
import { calculateTaskTiming, processStorageUnits } from '@/lib/utils/onfleetUtils';
import {
  generatePickupInstructions,
  generateCustomerDeliveryInstructions as generateDiyCustomerInstructions,
  generateReturnInstructions,
  generateFullServicePickupInstructions,
  generateFullServiceCustomerDeliveryInstructions,
  generateDriverNetworkPickupInstructions,
  generateDriverNetworkCustomerDeliveryInstructions,
  generateFullServiceReturnInstructions,
} from '@/lib/messaging/onfleet-notes';

export interface CreateTaskPayload {
  appointmentId: string | number;
  userId: string | number;
  appointmentType: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  selectedPlanName?: string;
  selectedLabor?: {
    title: string;
    onfleetTeamId: string;
  };
  storageUnitCount: number;
  storageUnitIds?: number[];
  deliveryReason?: string;
  description?: string;
  appointmentDateTime: string;
  address: string;
  startingUnitNumber?: number;
  additionalUnitsOnly?: boolean;
}

// Temporary placeholder implementations until dependencies are migrated
const WAREHOUSE_ADDRESS = "105 Associated Road, South San Francisco, CA 94080";

const parseAddress = (address: string) => ({
  address,
  unparsed: address,
  // Temporary implementation - will be replaced with real parseAddress function
});

const calculateAndSaveAppointmentCosts = async (appointmentId: string | number) => {
  // Temporary implementation - will be replaced with real cost calculation
  console.log(`Calculating costs for appointment ${appointmentId}`);
  return { totalEstimatedCost: 0 };
};

/**
 * Generate task notes based on appointment type and plan
 */
function generateTaskNotes(
  payload: CreateTaskPayload,
  isAccessAppointment: boolean,
  isDIY: boolean,
  isFirstUnit: boolean,
  unitInfo?: {
    unitId?: number;
    unitNumber?: string;
    allUnitNumbers?: string;
  }
): { pickup: string; customer: string; return: string } {
  
  if (isAccessAppointment && unitInfo) {
    // For access appointments, use more detailed customer-specific notes
    const customerName = `${payload.firstName} ${payload.lastName}`;
    
    if (isDIY) {
      return {
        pickup: `STEP 1: WAREHOUSE PICKUP

Customer needs access to storage unit ${unitInfo.unitNumber}.

All requested units: ${unitInfo.allUnitNumbers}

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Reason: ${payload.deliveryReason || 'Storage access'}
Plan: Do It Yourself Plan (Customer will handle loading/unloading)

Instructions: Please locate and retrieve unit ${unitInfo.unitNumber}`,

        customer: `STEP 2: CUSTOMER DELIVERY

Storage Unit Access: ${unitInfo.unitNumber}

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Plan: Do It Yourself Plan (Customer will handle loading/unloading)

Instructions: Customer will handle loading/unloading. Please wait for them to complete.
Additional Notes: ${payload.description || 'No added info'}`,

        return: `STEP 3: RETURN TO WAREHOUSE

Return storage unit #${unitInfo.unitNumber} to warehouse.

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Instructions: Return unit to warehouse, ensure unit is secure.`
      };
    } else {
      // Full Service Access Appointments
      if (isFirstUnit) {
        return {
          pickup: `STEP 1: WAREHOUSE PICKUP

Customer needs access to storage unit #${unitInfo.unitNumber}.

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Reason: ${payload.deliveryReason || 'Storage access'}
Plan: Full Service Plan (Moving partner will assist with loading/unloading)

Instructions: Please locate and retrieve unit #${unitInfo.unitId}`,

          customer: `STEP 2: CUSTOMER DELIVERY

Storage Unit Access: #${unitInfo.unitNumber}

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Plan: Full Service (Moving partner will assist with loading/unloading)

Partner: ${payload.selectedLabor?.title || 'Moving Partner'}
Instructions: Assist customer with loading/unloading as needed.
Additional Notes: ${payload.description || 'No added info'}`,

          return: `STEP 3: RETURN TO WAREHOUSE

Return storage unit #${unitInfo.unitNumber} to warehouse.

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Instructions: Return unit to warehouse, ensure unit is secure.`
        };
      } else {
        // Additional units for full service access
        return {
          pickup: `STEP 1: WAREHOUSE PICKUP

Customer needs access to storage unit #${unitInfo.unitNumber}.

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Reason: ${payload.deliveryReason || 'Storage access'}
Plan: Full Service Plan (Additional unit)

Instructions: Please locate and retrieve unit #${unitInfo.unitId}`,

          customer: `STEP 2: CUSTOMER DELIVERY (Additional Unit)

Storage Unit Access: #${unitInfo.unitNumber}

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Instructions: This is an additional unit for this customer. Deliver to customer location.
Additional Notes: ${payload.description || 'No added info'}`,

          return: `STEP 3: RETURN TO WAREHOUSE

Return storage unit #${unitInfo.unitNumber} to warehouse.

Customer Name: ${customerName}
Phone: ${payload.phoneNumber}
Instructions: Return unit to warehouse, ensure unit is secure.`
        };
      }
    }
  } else {
    // For regular storage appointments, use standard templates from constants
    if (isDIY) {
      return {
        pickup: generatePickupInstructions({
          firstName: payload.firstName,
          lastName: payload.lastName,
          appointmentId: typeof payload.appointmentId === 'string' ? parseInt(payload.appointmentId) : payload.appointmentId
        }),
        customer: generateDiyCustomerInstructions(),
        return: generateReturnInstructions()
      };
    } else {
      if (isFirstUnit) {
        return {
          pickup: generateFullServicePickupInstructions({
            storageUnitCount: payload.storageUnitCount,
            firstName: payload.firstName,
            lastName: payload.lastName,
            appointmentId: typeof payload.appointmentId === 'string' ? parseInt(payload.appointmentId) : payload.appointmentId
          }),
          customer: generateFullServiceCustomerDeliveryInstructions({
            storageUnitCount: payload.storageUnitCount
          }),
          return: generateFullServiceReturnInstructions()
        };
      } else {
        // Additional units use driver network templates
        return {
          pickup: generateDriverNetworkPickupInstructions({
            firstName: payload.firstName,
            lastName: payload.lastName,
            appointmentId: typeof payload.appointmentId === 'string' ? parseInt(payload.appointmentId) : payload.appointmentId
          }),
          customer: generateDriverNetworkCustomerDeliveryInstructions(),
          return: generateFullServiceReturnInstructions()
        };
      }
    }
  }
}

/**
 * Create linked Onfleet tasks for an appointment
 */
export async function createLinkedOnfleetTasks(payload: CreateTaskPayload) {
  try {
    console.log('Creating Onfleet tasks for appointment:', payload.appointmentId);
    
    // Determine appointment type
    const isAccessAppointment = payload.appointmentType === "Storage Unit Access" || payload.appointmentType === "End Storage Term";
    const isDIY = payload.selectedPlanName === 'Do It Yourself Plan' || !payload.selectedLabor;
    
    // Process storage units
    const storageUnitIds = payload.storageUnitIds || [];
    const unitProcessingResult = await processStorageUnits(
      storageUnitIds,
      isAccessAppointment,
      payload.storageUnitCount
    );
    const { storageUnitNumbersMap, allUnitNumbers } = unitProcessingResult;
    
    // Calculate timing
    const existingTasks = await prisma.onfleetTask.findMany({
      where: { appointmentId: typeof payload.appointmentId === 'string' ? parseInt(payload.appointmentId) : payload.appointmentId },
      orderBy: [{ unitNumber: 'asc' }, { stepNumber: 'asc' }]
    });
    
    const existingUnitCount = Math.max(...[1, 2, 3].map(step => 
      existingTasks.filter(t => t.stepNumber === step).length
    ));
    
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
    
    // Create tasks for each unit
    const startingUnitNumber = payload.startingUnitNumber || 1;
    
    for (let i = 0; i < payload.storageUnitCount; i++) {
      const currentUnitNumber = startingUnitNumber + i;
      const isFirstUnit = currentUnitNumber === 1;
      
      // Check if tasks already exist
      const existingTasksForUnit = existingTasks.filter(t => t.unitNumber === currentUnitNumber);
      if (existingTasksForUnit.length === 3) {
        console.log(`Tasks for unit ${currentUnitNumber} already exist, skipping`);
        continue;
      }
      
      // Get unit info
      const specificUnitId = storageUnitIds[i];
      const specificUnitNumber = specificUnitId ? storageUnitNumbersMap[specificUnitId] : `Unit #${currentUnitNumber}`;
      
      // Calculate timing
      const timingResult = calculateTaskTiming({
        appointmentTime: new Date(payload.appointmentDateTime),
        existingUnitCount,
        currentUnitIndex: i
      });
      
      // Generate notes
      const notes = generateTaskNotes(
        payload,
        isAccessAppointment,
        isDIY,
        isFirstUnit,
        {
          unitId: specificUnitId,
          unitNumber: specificUnitNumber,
          allUnitNumbers
        }
      );
      
      // Build task payloads (using temporary implementation)
      const customerAddress = parseAddress(payload.address);
      const warehouseAddress = parseAddress(WAREHOUSE_ADDRESS);
      
      // Temporary mock task creation - will be replaced with real Onfleet API calls
      console.log(`Creating tasks for unit ${currentUnitNumber}:`, {
        pickup: notes.pickup,
        customer: notes.customer,  
        return: notes.return,
        timing: timingResult,
        customerAddress,
        warehouseAddress
      });
      
      // Add to results (temporary mock)
      allTaskIds.pickup.push(`pickup-${currentUnitNumber}`);
      allTaskIds.customer.push(`customer-${currentUnitNumber}`);
      allTaskIds.return.push(`return-${currentUnitNumber}`);
      
      allShortIds.pickup.push(`P${currentUnitNumber}`);
      allShortIds.customer.push(`C${currentUnitNumber}`);
      allShortIds.return.push(`R${currentUnitNumber}`);
    }
    
    // Calculate costs
    await calculateAndSaveAppointmentCosts(payload.appointmentId);
    
    return {
      taskIds: allTaskIds,
      shortIds: allShortIds
    };
    
  } catch (error) {
    console.error('Error creating Onfleet tasks:', error);
    throw error;
  }
}

/**
 * Create linked Onfleet tasks directly (without HTTP request)
 */
export async function createLinkedOnfleetTasksDirectly(payload: CreateTaskPayload) {
  return createLinkedOnfleetTasks(payload);
} 