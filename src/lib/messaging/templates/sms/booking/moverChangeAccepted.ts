/**
 * @fileoverview SMS template for mover change acceptance confirmation
 * @source boombox-10.0/src/app/api/customer/mover-change-response/route.ts (confirmation message)
 */

import { MessageTemplate } from '../../MessageTemplate';

export const moverChangeAcceptedTemplate: MessageTemplate = {
  text: "Great! We've confirmed your new moving partner${newMovingPartner ? ` (${newMovingPartner})` : ''}. ${assignedDriver ? `Your driver is ${assignedDriver}.` : ''} You'll receive further details about your updated appointment soon.",
  requiredVariables: ['newMovingPartner'],
  optionalVariables: ['assignedDriver'],
  channel: 'sms',
  domain: 'booking'
}; 