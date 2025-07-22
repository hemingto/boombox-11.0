/**
 * @fileoverview SMS template for moving partner plan change notifications (Full Service to DIY)
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 604)
 * @refactor Extracted inline message into template-based system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const movingPartnerPlanChangeNotificationSms: MessageTemplate = {
  text: 'Boombox: Job ${appointmentId} on ${appointmentDate} has been cancelled. Customer changed to DIY plan - no moving services needed.',
  requiredVariables: [
    'appointmentId',
    'appointmentDate'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to moving partners when customer changes from Full Service to DIY plan',
}; 