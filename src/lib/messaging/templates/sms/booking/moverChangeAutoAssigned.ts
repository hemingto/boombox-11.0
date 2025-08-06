/**
 * @fileoverview SMS template for auto-assigned moving partner after timeout
 * @source boombox-10.0/src/app/api/cron/process-expired-mover-changes/route.ts (lines 245-246)
 * @refactor Extracted inline message into centralized template
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const moverChangeAutoAssignedTemplate: MessageTemplate = {
  text: "We haven't heard back about your moving partner change for ${formattedDate} at ${formattedTime}. To ensure service continuity, we've automatically assigned ${moverName} as discussed. Your updated quote is $${newQuotedPrice}. Contact support if you need changes.",
  requiredVariables: ['formattedDate', 'formattedTime', 'moverName', 'newQuotedPrice'],
  channel: 'sms',
  domain: 'booking'
};