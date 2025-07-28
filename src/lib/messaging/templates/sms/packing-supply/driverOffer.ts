/**
 * @fileoverview SMS template for packing supply route driver offers
 * @source boombox-10.0/src/app/api/packing-supplies/driver-offer/route.ts (SMS message construction)
 * @refactor Extracted inline SMS message to centralized template system
 */

import { MessageTemplate } from '../../../types';

export const driverOfferTemplate: MessageTemplate = {
  text: `🚚 Boombox Route Offer: \${totalStops} stops, \${deliveryArea}, \${formattedDate}. Pay: \${payoutEstimate} (~\${estimatedDuration}). Reply YES to accept or click: \${offerUrl} (expires \${timeoutMinutes}min)`,
  requiredVariables: [
    'totalStops',
    'deliveryArea', 
    'formattedDate',
    'payoutEstimate',
    'estimatedDuration',
    'offerUrl',
    'timeoutMinutes'
  ],
  channel: 'sms',
  domain: 'logistics',
  description: 'Driver route offer notification with accept/decline links'
}; 