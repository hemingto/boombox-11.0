/**
 * @fileoverview Mover change DIY confirmation message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 154)
 * @domain customer
 */

import type { MessageTemplate } from '../../types';

export const moverChangeDiyTemplate: MessageTemplate = {
  text: 'Perfect! We\'ve switched your appointment to our DIY plan. Our drivers will handle the delivery and you\'ll take care of loading/unloading. Your updated quote is $${newQuotedPrice}.',
  requiredVariables: ['newQuotedPrice'],
  channel: 'sms',
  domain: 'customer'
};