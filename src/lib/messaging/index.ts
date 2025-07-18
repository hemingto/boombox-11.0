/**
 * @fileoverview Messaging integrations - Twilio SMS, SendGrid Email, and centralized MessageService
 * @source Consolidated messaging services for centralized communication
 */

// Legacy SMS and Email clients (preserved for existing usage)
export * from './twilioClient';
export * from './sendgridClient';

// New centralized messaging system
export { MessageService } from './MessageService';
export * from './types';

// Template exports (example templates)
export { driverJobOfferSms } from './templates/sms/booking/driverJobOffer';
export { packingSupplyOrderConfirmationSms } from './templates/sms/logistics/packingSupplyOrderConfirmation';
export { driverInvitationEmail } from './templates/email/auth/driverInvitation';
