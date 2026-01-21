/**
 * @fileoverview Packing supply route accepted confirmation message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 318)
 * @domain driver
 */

import type { MessageTemplate } from '../../../types';

export const packingSupplyAcceptedTemplate: MessageTemplate = {
  text: '🎉 Great! You\'ve accepted the packing supply delivery route (${totalStops} stops). Check your Onfleet app for navigation details. Thanks for driving with Boombox!',
  requiredVariables: ['totalStops'],
  channel: 'sms',
  domain: 'driver'
};