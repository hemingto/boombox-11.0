/**
 * @fileoverview SMS template for driver unit shift notifications
 * 
 * Sent when a driver is shifted to a different unit during appointment edits
 * (e.g., DIY → Full Service upgrade where Boombox driver moves from Unit 1 to Unit 2).
 * 
 * The driver keeps the job but arrives at a different time due to unit staggering.
 */

import { MessageTemplate } from '@/lib/messaging/types';

/**
 * SMS notification for when a driver is shifted to a different unit
 * Includes the new arrival time since units are staggered by 45 minutes
 */
export const driverUnitShiftNotificationSms: MessageTemplate = {
  text: 'Boombox: Your assignment for ${appointmentDate} has been updated. You are now handling Unit ${newUnit} (arrive at ${arrivalTime}) instead of Unit ${oldUnit}.',
  requiredVariables: [
    'appointmentDate',
    'newUnit',
    'arrivalTime',
    'oldUnit'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to drivers when they are shifted to a different unit during appointment edits',
};

