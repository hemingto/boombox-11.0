/**
 * @fileoverview Onfleet driver instructions for Step 2 Customer Delivery - Full Service Moving Partner
 * @source boombox-10.0/src/app/lib/onfleet/constants.ts (TASK_NOTES.FULL_SERVICE_PLAN.CUSTOMER_MOVING_PARTNER)
 */

export interface FullServiceCustomerDeliveryInstructionVariables {
  storageUnitCount: number;
}

export function generateFullServiceCustomerDeliveryInstructions(variables: FullServiceCustomerDeliveryInstructionVariables): string {
  return `LOAD ALL STORAGE UNITS BEFORE COMPLETING THIS TASK.

You are loading ${variables.storageUnitCount} in total with a 2 person crew.

The other storage units are scheduled to arrive staggered every 30-45 minutes after you have arrived on site. After loading is complete, make sure to take photo of storage unit you are transporting with the door open so full opening of the door and the contents are visible. You do not need to take photos of the other storage units you loaded just the one you are transporting.`;
} 