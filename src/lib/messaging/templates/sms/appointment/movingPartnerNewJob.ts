/**
 * @fileoverview SMS template for notifying moving partners about new job assignments
 * @source boombox-10.0/src/app/api/driver-assign/route.ts (notifyMovingPartner function)
 * @refactor Extracted into template-based system with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

/**
 * SMS sent to moving partners when a new job is assigned to them with a driver already assigned
 */
export const movingPartnerNewJobWithDriverSms: MessageTemplate = {
  text: 'Boombox Job Update: Customer ${customerName}, ${appointmentType} on ${appointmentDate} at ${appointmentTime}. Address: ${address}. Appt ID: ${appointmentId}. ${driverName} assigned. Edit in Onfleet.',
  requiredVariables: [
    'customerName',
    'appointmentType',
    'appointmentDate',
    'appointmentTime',
    'address',
    'appointmentId',
    'driverName',
  ],
  channel: 'sms',
  domain: 'appointment',
  description: 'SMS sent to moving partners when a new job is assigned with a driver already selected',
};

/**
 * SMS sent to moving partners when a new job is assigned and they need to assign a driver
 */
export const movingPartnerNewJobSms: MessageTemplate = {
  text: 'New Boombox Job: Customer ${customerName}, ${appointmentType} on ${appointmentDate} at ${appointmentTime}. Address: ${address}. Please assign driver in Onfleet. Appt ID: ${appointmentId}.',
  requiredVariables: [
    'customerName',
    'appointmentType',
    'appointmentDate',
    'appointmentTime',
    'address',
    'appointmentId',
  ],
  channel: 'sms',
  domain: 'appointment',
  description: 'SMS sent to moving partners when a new job is assigned and they need to select a driver',
};
