/**
 * @fileoverview Onfleet driver instructions for Step 1 Pickup - DIY Plan
 * @source boombox-10.0/src/app/lib/onfleet/constants.ts (TASK_NOTES.DIY_PLAN.PICKUP)
 */

export interface PickupInstructionVariables {
  firstName: string;
  lastName: string;
  appointmentId: number;
}

export function generatePickupInstructions(_variables: PickupInstructionVariables): string { // eslint-disable-line @typescript-eslint/no-unused-vars
  return `You are picking up 1 storage unit and the customer will load the unit themselves.

Storage unit pickup is through the gate in the back of the warehouse. Check in with warehouse crew when you arrive. Let them know the customer name and appointment id. The warehouse crew will assist you in placing the storage unit trailer onto your vehicle. Once the storage trailer is loaded to your vehicle, take photo of Storage Unit ID number (Ex. SFBB103) on the side of unit. Make sure the photo is clear and shows the entire storage unit id number.`;
} 