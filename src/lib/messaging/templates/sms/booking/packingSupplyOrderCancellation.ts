/**
 * @fileoverview SMS template for packing supply order cancellation confirmation
 * @source boombox-10.0/src/app/api/packing-supplies/orders/[orderId]/cancel/route.ts (inline SMS logic)
 * @refactor Extracted messaging logic to centralized template system
 */

import { MessageTemplate } from '../../../types';

export const packingSupplyOrderCancellationSms: MessageTemplate = {
  text: `Your packing supply order #\${orderId} has been cancelled successfully.

Cancellation reason: \${cancellationReason}
Refund amount: $\${refundAmount}
Refund status: \${refundStatus}

If you have questions, reply to this message.`,
  requiredVariables: ['orderId', 'cancellationReason', 'refundAmount', 'refundStatus'],
  channel: 'sms',
  domain: 'booking'
}; 