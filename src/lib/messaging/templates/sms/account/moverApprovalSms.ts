/**
 * @fileoverview Moving partner account approval SMS template
 * @source New template for boombox-11.0 approval notification system
 * 
 * Sent when a moving partner's account is fully activated (first driver approved).
 * Notifies them that they can now accept jobs through the platform.
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const moverApprovalSms: MessageTemplate = {
  text: `Congratulations! Your Boombox moving partner account for \${companyName} is now fully active. \${driverName} has been approved and you can now start accepting jobs. Log in to your dashboard to get started!`,
  requiredVariables: ['companyName'],
  optionalVariables: ['driverName'],
  channel: 'sms',
  domain: 'auth',
  description: 'SMS sent to moving partners when their first driver is approved and account becomes active'
};

