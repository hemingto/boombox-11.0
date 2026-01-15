/**
 * @fileoverview SMS template for driver job decline confirmation
 * @source boombox-10.0/src/lib/twilio.ts (driver notification patterns)
 * @refactor Extracted into template-based system with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverJobDeclinedSms: MessageTemplate = {
  text: 'Boombox: Job declined. We\'ll send you other opportunities. Thank you!',
  requiredVariables: [],
  channel: 'sms',
  domain: 'booking',
  description: 'Confirmation sent to driver after declining a job',
};

