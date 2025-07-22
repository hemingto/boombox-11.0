/**
 * @fileoverview Onfleet driver instruction templates index
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts (ACCESS_TASK_NOTES)
 * @refactor Extracted inline driver notes into organized template system
 */

// Step 1 Pickup Templates
export * from './step1-pickup/diyPlan';
export * from './step1-pickup/fullServiceMovingPartner';
export * from './step1-pickup/fullServiceDriverNetwork';

// Step 2 Customer Delivery Templates
export * from './step2-customer/diyPlan';
export * from './step2-customer/fullServiceMovingPartner';
export * from './step2-customer/fullServiceDriverNetwork';

// Step 3 Return Templates
export * from './step3-return/diyPlan';
export * from './step3-return/fullService';

// Template selector functions for easy usage
export interface TaskInstructionContext {
  isDIY: boolean;
  isFirstUnit: boolean;
  step: 1 | 2 | 3;
}

export type InstructionVariables = 
  | import('./step1-pickup/diyPlan').PickupInstructionVariables
  | import('./step1-pickup/fullServiceMovingPartner').FullServicePickupInstructionVariables
  | import('./step1-pickup/fullServiceDriverNetwork').DriverNetworkPickupInstructionVariables
  | import('./step2-customer/diyPlan').CustomerDeliveryInstructionVariables
  | import('./step2-customer/fullServiceMovingPartner').FullServiceCustomerDeliveryInstructionVariables
  | import('./step2-customer/fullServiceDriverNetwork').DriverNetworkCustomerDeliveryInstructionVariables
  | import('./step3-return/diyPlan').ReturnInstructionVariables
  | import('./step3-return/fullService').FullServiceReturnInstructionVariables; 