/**
 * @fileoverview SMS template for notifying drivers of job reassignment
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (inline SMS messages)
 * @refactor Extracted to centralized template with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverReassignmentNotificationSms: MessageTemplate = {
  text: 'Boombox: The appointment on ${appointmentDate} has been reassigned due to ${reason}. You are no longer assigned to this job.',
  requiredVariables: ['appointmentDate', 'reason'],
  channel: 'sms',
  domain: 'appointment',
};

