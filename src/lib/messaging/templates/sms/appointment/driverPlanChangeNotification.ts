/**
 * @fileoverview SMS template for driver plan change notifications (DIY to Full Service)
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 515)
 * @refactor Extracted inline message into template-based system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverPlanChangeNotificationSms: MessageTemplate = {
  text: 'Boombox: The appointment on ${appointmentDate} has been reassigned due to plan upgrade to Full Service. You are no longer assigned to this job.',
  requiredVariables: [
    'appointmentDate'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to drivers when customer changes from DIY to Full Service plan',
}; 