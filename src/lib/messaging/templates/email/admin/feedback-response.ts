/**
 * @fileoverview Email template for admin feedback responses
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (lines 86-99)
 * @refactor Extracted inline email template to centralized messaging system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const adminFeedbackResponseTemplate: MessageTemplate = {
  text: '${emailBody}',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="white-space: pre-wrap;">\${emailBody}</div>
    </div>
  `,
  requiredVariables: ['emailBody'],
  channel: 'email',
  domain: 'admin',
};