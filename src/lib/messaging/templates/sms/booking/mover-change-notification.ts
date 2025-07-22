/**
 * @fileoverview SMS template for customer mover change notifications
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (line 140: message variable)
 */

import { MessageTemplate } from '../../../types';

export const moverChangeNotificationTemplate: MessageTemplate = {
  text: `Your moving partner for \${formattedDate} at \${formattedTime} has cancelled. We've found \${suggestedMoverName} as a replacement (\${priceText}). Reply "ACCEPT" to confirm or "DIY" to switch to DIY plan. Details: \${webViewUrl}`,
  requiredVariables: [
    'formattedDate',
    'formattedTime',
    'suggestedMoverName',
    'priceText',
    'webViewUrl'
  ],
  channel: 'sms',
  domain: 'booking'
}; 