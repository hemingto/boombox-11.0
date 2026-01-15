/**
 * @fileoverview SMS template for packing supply order confirmation
 * @source boombox-10.0/src/app/api/packing-supplies/create-order/route.ts (inline SMS logic)
 * @refactor Extracted messaging logic to centralized template system
 */

import { MessageTemplate } from '../../../types';

export const packingSupplyOrderConfirmationSms: MessageTemplate = {
  text: `Hi \${customerName}! 📦 Your Boombox packing supply order #\${orderId} has been confirmed (\${totalPrice}). 

📧 A receipt was sent to your email.

🚚 Expected delivery: \${deliveryTimeText}

📱 Track your order: \${trackingUrl}

Thanks for choosing Boombox!`,
  requiredVariables: ['customerName', 'orderId', 'totalPrice', 'deliveryTimeText', 'trackingUrl'],
  channel: 'sms',
  domain: 'booking'
}; 