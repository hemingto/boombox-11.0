/**
 * @fileoverview SMS template for driver reassignment offers
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (line 601: message variable)
 */

import { MessageTemplate } from '../../../types';

export const driverReassignmentOfferTemplate: MessageTemplate = {
  text: `Boombox Storage: A previously assigned job is now available for \${formattedTime} \${formattedDate} at \${address}. Reply YES to accept or NO to decline. Details: \${webViewUrl}`,
  requiredVariables: [
    'formattedTime',
    'formattedDate', 
    'address',
    'webViewUrl'
  ],
  channel: 'sms',
  domain: 'booking'
}; 