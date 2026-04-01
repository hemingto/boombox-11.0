/**
 * @fileoverview SMS template for packing supply order confirmations
 * @source boombox-10.0/src/app/lib/twilio/twilio.ts (line 27)
 * @refactor Extracted message content into template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const packingSupplyOrderConfirmationSms: MessageTemplate = {
  channel: 'sms',
  domain: 'logistics',
  text: 'Hi ${customerName}! Your Boombox packing supply order #${orderId} has been confirmed ($${totalPrice}).\n\nA receipt was sent to your email.\n\nExpected delivery: ${deliveryTimeText}\n\nTrack your order: ${trackingUrl}\n\nThanks for choosing Boombox!',
  requiredVariables: [
    'customerName',
    'orderId',
    'totalPrice',
    'deliveryTimeText',
    'trackingUrl',
  ],
};
