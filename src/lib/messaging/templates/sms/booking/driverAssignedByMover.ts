/**
 * @fileoverview SMS template for driver assignment by moving partner
 * Sent when a moving partner manually assigns a driver to a job
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverAssignedByMoverSms: MessageTemplate = {
  text: 'Boombox: You have been assigned to a ${appointmentType} job on ${formattedDate} at ${formattedTime}. Address: ${address}. Contact your dispatcher for details.',
  requiredVariables: [
    'appointmentType',
    'formattedDate',
    'formattedTime',
    'address',
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to drivers when they are assigned to a job by their moving partner',
};
