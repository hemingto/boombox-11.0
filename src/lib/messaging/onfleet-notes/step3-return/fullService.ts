/**
 * @fileoverview Onfleet driver instructions for Step 3 Return - Full Service Plan (All Types)
 * @source boombox-10.0/src/app/lib/onfleet/constants.ts (TASK_NOTES.FULL_SERVICE_PLAN.RETURN)
 */

export type FullServiceReturnInstructionVariables = Record<string, never>;

export function generateFullServiceReturnInstructions(_variables?: FullServiceReturnInstructionVariables): string { // eslint-disable-line @typescript-eslint/no-unused-vars
  return `Return the storage unit back to the Boombox storage facility. Check in with the warehouse crew. Make sure the storage unit is removed from the trailer before you unhitch the trailer from your vehicle.`;
} 