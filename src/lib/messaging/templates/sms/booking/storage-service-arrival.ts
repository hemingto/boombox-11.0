/**
 * @fileoverview SMS template for storage service arrival notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (taskArrival step 2)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const storageServiceArrivalTemplate: MessageTemplate = {
  text: '${crewName} has arrived and your service time has started. Please meet your crew outside',
  requiredVariables: ['crewName'],
  channel: 'sms',
  domain: 'booking'
}; 