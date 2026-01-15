/**
 * @fileoverview SMS template for notifying moving partners about new jobs when manual assignment mode is enabled
 * Sent when a job is booked and the moving partner needs to manually assign a driver through their account
 */

import { MessageTemplate } from '@/lib/messaging/types';

/**
 * SMS sent to moving partners when a new job is booked and they need to manually assign a driver
 * This is used when the moving partner has driverAssignmentMode set to MANUAL
 */
export const movingPartnerNewJobManualAssignSms: MessageTemplate = {
  text: 'Boombox: New job booked! ${appointmentType} on ${appointmentDate} at ${appointmentTime}. Customer: ${customerName}. Address: ${address}. Please assign a driver through your Jobs page in your Boombox account.',
  requiredVariables: [
    'appointmentType',
    'appointmentDate',
    'appointmentTime',
    'customerName',
    'address',
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to moving partners when a new job is booked and they need to manually assign a driver through their Boombox account',
};
