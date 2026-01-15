/**
 * @fileoverview Driver account approval SMS template
 * @source New template for boombox-11.0 approval notification system
 * 
 * Sent when an admin approves a driver's account, notifying them
 * that they can now accept jobs through the platform.
 * Customized based on whether driver is linked to a moving partner.
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverApprovalSms: MessageTemplate = {
  text: `Congratulations \${firstName}! Your Boombox driver account has been approved. You can now start \${statusMessage}. Log in to view available jobs!`,
  requiredVariables: ['firstName', 'statusMessage'],
  optionalVariables: [],
  channel: 'sms',
  domain: 'auth',
  description: 'SMS sent to drivers when their account is approved by admin'
};

