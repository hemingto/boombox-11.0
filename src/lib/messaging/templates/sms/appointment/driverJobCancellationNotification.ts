/**
 * @fileoverview SMS template for driver job cancellation notifications
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 288)
 * @refactor Extracted inline message into template-based system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverJobCancellationNotificationSms: MessageTemplate = {
  text: 'Boombox: Job cancellation - Unit ${unitNumber} for your appointment on ${appointmentDate} has been cancelled due to customer reducing storage units needed.',
  requiredVariables: [
    'unitNumber',
    'appointmentDate'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to drivers when their assigned unit is cancelled due to customer reducing storage units',
}; 