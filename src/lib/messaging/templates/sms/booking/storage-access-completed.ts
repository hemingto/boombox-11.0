/**
 * @fileoverview SMS template for storage access completion notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (step 2 completion inline message)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const storageAccessCompletedTemplate: MessageTemplate = {
  text: '${crewName} has wrapped up your storage access appointment. If you would like to provide feedback or tip your crew, you can do so here: ${feedbackUrl}',
  requiredVariables: ['crewName', 'feedbackUrl'],
  channel: 'sms',
  domain: 'booking'
}; 