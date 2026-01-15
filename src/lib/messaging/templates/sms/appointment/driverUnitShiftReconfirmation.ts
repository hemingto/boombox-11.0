/**
 * @fileoverview SMS template for driver unit shift reconfirmation request
 * 
 * Sent when a driver is shifted to a different unit during appointment edits
 * and needs to confirm the new time works for them.
 * 
 * Example scenario: DIY → Full Service upgrade where Boombox driver moves 
 * from Unit 1 (9:00 AM) to Unit 2 (9:45 AM). The driver receives a single
 * text asking them to confirm the new time works.
 */

import { MessageTemplate } from '@/lib/messaging/types';

/**
 * SMS template for unit shift reconfirmation request
 * Includes the new unit, new arrival time, and reconfirmation link
 */
export const driverUnitShiftReconfirmationSms: MessageTemplate = {
  text: 'Boombox: Your ${appointmentDate} job has been updated. You\'ve been moved to Unit ${newUnit} with a new arrival time of ${newArrivalTime}. Please confirm this works: Text YES to Confirm or NO to Decline. Details: ${webViewUrl}',
  requiredVariables: [
    'appointmentDate',
    'newUnit',
    'newArrivalTime',
    'webViewUrl'
  ],
  channel: 'sms',
  domain: 'appointment',
  description: 'SMS sent to drivers when they are shifted to a different unit and need to reconfirm the new time',
};

