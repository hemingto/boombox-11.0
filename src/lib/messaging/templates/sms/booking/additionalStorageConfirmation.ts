/**
 * @fileoverview SMS template for additional storage appointment confirmations
 * @source boombox-10.0/src/app/api/addAdditionalStorage/route.ts (sendAdditionalStorageConfirmationSms function)
 * @refactor Extracted inline message logic into centralized template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const additionalStorageConfirmationSms: MessageTemplate = {
  text: `Hi \${firstName}, this is a confirmation that your additional storage appointment is scheduled for \${appointmentDate} at \${appointmentTime}. We look forward to seeing you!`,
  requiredVariables: [
    'firstName',
    'appointmentDate', 
    'appointmentTime'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS confirmation sent when customer schedules additional storage appointment'
}; 