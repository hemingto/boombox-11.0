/**
 * @fileoverview SMS template for notifying drivers of task cancellation
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (deleteOnfleetTasksForRemovedUnits)
 * @refactor Extracted to centralized template with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverTaskCancellationNotificationSms: MessageTemplate = {
  text: 'Boombox: Your task for the appointment on ${appointmentDate} has been cancelled. Reason: ${reason}. You are no longer assigned to this job.',
  requiredVariables: ['appointmentDate', 'reason'],
  channel: 'sms',
  domain: 'appointment',
};

