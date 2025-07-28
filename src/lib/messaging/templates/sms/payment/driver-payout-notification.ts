/**
 * @fileoverview SMS template for driver payout notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (sendPayoutNotificationSMS)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverPayoutNotificationTemplate: MessageTemplate = {
  text: 'Boombox: Payment processed! You earned $${payoutAmount} for completing job ${jobCode}. Funds will appear in your account within 1-2 business days.',
  requiredVariables: ['payoutAmount', 'jobCode'],
  channel: 'sms',
  domain: 'payment'
}; 