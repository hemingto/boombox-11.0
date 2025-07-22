/**
 * @fileoverview SMS template for packing supply order confirmation
 * @source boombox-10.0/src/app/api/packing-supplies/create-order/route.ts (inline SMS logic)
 * @refactor Extracted messaging logic to centralized template system
 */

import { MessageTemplate } from '../../../types';

export const packingSupplyOrderConfirmationSms: MessageTemplate = {
  text: `🎉 Order confirmed! Your packing supplies will be delivered on \${deliveryDate}. Track your order: \${trackingUrl}

Order #\${orderId}
Total: $\${totalPrice}
Items: \${itemCount} items

Questions? Reply to this message.`,
  requiredVariables: ['deliveryDate', 'trackingUrl', 'orderId', 'totalPrice', 'itemCount'],
  channel: 'sms',
  domain: 'booking'
}; 