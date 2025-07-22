/**
 * @fileoverview SMS template for storage access appointment confirmations
 * @source boombox-10.0/src/app/api/accessStorageUnit/route.ts (sendAccessStorageConfirmationSms function)
 * @refactor Extracted inline message logic into centralized template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const accessStorageConfirmationSms: MessageTemplate = {
  text: `Hi \${firstName}, this is a confirmation that your storage access appointment is scheduled for \${appointmentDate} at \${appointmentTime}. We look forward to seeing you!`,
  requiredVariables: [
    'firstName',
    'appointmentDate', 
    'appointmentTime'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS confirmation sent when customer schedules storage unit access appointment'
}; 