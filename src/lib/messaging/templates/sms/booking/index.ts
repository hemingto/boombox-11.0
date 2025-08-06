/**
 * @fileoverview Booking SMS templates index
 * @refactor Centralized exports for booking-related SMS templates
 */

export { moverChangeToDiyTemplate } from './moverChangeToDiy';
export { moverChangeAutoAssignedTemplate } from './moverChangeAutoAssigned';
export { thirdPartyMoverTimeoutTemplate } from './thirdPartyMoverTimeout';
export { packingSupplyOrderConfirmationSms } from '../orders/packingSupplyOrderConfirmation';
export { packingSupplyOrderCancellationSms } from './packingSupplyOrderCancellation';
export { packingSupplyStartedTemplate } from './packing-supply-started';
export { packingSupplyArrivalTemplate } from './packing-supply-arrival';
export { packingSupplyCompletedTemplate } from './packing-supply-completed';
export { packingSupplyFailedTemplate } from './packing-supply-failed';
export { storagePickupStartedTemplate } from './storage-pickup-started';
export { storageDeliveryStartedTemplate } from './storage-delivery-started';
export { storageServiceArrivalTemplate } from './storage-service-arrival'; 
export { storageLoadingCompletedTemplate } from './storage-loading-completed';
export { storageTermEndedTemplate } from './storage-term-ended';
export { storageAccessCompletedTemplate } from './storage-access-completed'; 