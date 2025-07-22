/**
 * @fileoverview SMS template for mover change to DIY plan confirmation
 * @source boombox-10.0/src/app/api/customer/mover-change-response/route.ts (DIY confirmation message)
 */

import { MessageTemplate } from '../../MessageTemplate';

export const moverChangeToDiyTemplate: MessageTemplate = {
  text: "Perfect! We've switched your appointment to our DIY plan. Our drivers will handle the delivery and you'll take care of loading/unloading. Your updated quote is $${newQuotedPrice}.",
  requiredVariables: ['newQuotedPrice'],
  optionalVariables: [],
  channel: 'sms',
  domain: 'booking'
}; 