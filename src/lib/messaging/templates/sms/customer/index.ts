/**
 * @fileoverview Customer SMS template exports
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts - extracted inline messages
 * @refactor Centralized customer messaging templates for Twilio inbound webhook
 */

export { customerNotFoundTemplate } from './customerNotFound';
export { noPendingMoverChangeTemplate } from './noPendingMoverChange';
export { moverChangeAlreadyProcessedTemplate } from './moverChangeAlreadyProcessed';
export { moverChangeProcessingErrorTemplate } from './moverChangeProcessingError';
export { moverChangeAcceptedTemplate } from './moverChangeAccepted';
export { moverChangeDiyTemplate } from './moverChangeDiy';
export { unexpectedErrorTemplate } from './unexpectedError';
export { 
  generalSupportTemplate, 
  moverChangeAmbiguousTemplate, 
  generalAmbiguousTemplate 
} from './generalSupportMessage';