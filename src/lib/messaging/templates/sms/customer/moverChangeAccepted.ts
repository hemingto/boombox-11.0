/**
 * @fileoverview Mover change accepted confirmation message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 152)
 * @domain customer
 */

import type { MessageTemplate } from '../../../types';

export const moverChangeAcceptedTemplate: MessageTemplate = {
  text: 'Great! We\'ve confirmed your new moving partner${newMovingPartner ? ` (${newMovingPartner})` : \'\'}. You\'ll receive further details about your updated appointment soon.',
  requiredVariables: ['newMovingPartner'],
  channel: 'sms',
  domain: 'customer'
};