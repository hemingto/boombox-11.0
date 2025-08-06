/**
 * @fileoverview SMS template for third-party mover timeout notification to customer
 * @source boombox-10.0/src/app/api/cron/process-expired-mover-changes/route.ts (lines 61)
 * @refactor Extracted inline message into centralized template
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const thirdPartyMoverTimeoutTemplate: MessageTemplate = {
  text: "We haven't heard back about your third-party mover selection for ${formattedDate}. We've assigned your job to our Boombox Delivery Network to ensure service continuity. Contact support if you need changes.",
  requiredVariables: ['formattedDate'],
  channel: 'sms',
  domain: 'booking'
};