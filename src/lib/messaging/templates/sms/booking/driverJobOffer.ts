/**
 * @fileoverview SMS template for driver job offers
 * @source boombox-10.0/src/lib/twilio.ts (driver notification patterns)
 * @refactor Extracted into template-based system with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverJobOfferSms: MessageTemplate = {
  text: 'Boombox: ${appointmentType} Job ${formattedTime} ${formattedDate} at ${shortAddress}. Est Pay: ~${paymentEstimate}. Text YES to Accept or NO to Decline. Details: ${webViewUrl}',
  requiredVariables: [
    'appointmentType',
    'formattedTime',
    'formattedDate',
    'shortAddress',
    'paymentEstimate',
    'webViewUrl',
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to drivers offering them a job opportunity',
};
