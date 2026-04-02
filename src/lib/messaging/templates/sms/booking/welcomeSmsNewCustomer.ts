/**
 * @fileoverview Welcome SMS template for new customer appointment booking
 * @source boombox-10.0/src/app/api/submitQuote/route.ts (sendWelcomeSms function)
 * @refactor Extracted inline SMS content into centralized template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const welcomeSmsNewCustomer: MessageTemplate = {
  text: `Welcome to Boombox, \${firstName}! Your \${appointmentType} is scheduled for \${appointmentDate} at \${appointmentTime}. Address: \${address}. Prepare for your appointment by reviewing our checklist: https://boombox-11-0.vercel.app/checklist. See you soon!`,
  requiredVariables: [
    'firstName',
    'appointmentType',
    'appointmentDate',
    'appointmentTime',
    'address',
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'Welcome SMS sent to new customers after appointment booking',
};
