/**
 * @fileoverview Inbound message routing service for SMS webhook processing
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 180-559)
 * @refactor Extracted complex routing logic into centralized service
 */

import { NextResponse } from 'next/server';
import {
  findCustomerByPhone,
  findDriverByPhone,
  classifyMessageIntent,
  type MessageIntent,
} from '@/lib/utils';
import { MoverChangeHandler } from './MoverChangeHandler';
import { DriverResponseHandler } from './DriverResponseHandler';
import { MessageService } from '../../messaging/MessageService';
import {
  customerNotFoundTemplate,
  generalSupportTemplate,
  generalAmbiguousTemplate,
} from '@/lib/messaging/templates/sms/customer';

export interface MessageRouteResult {
  success: boolean;
  action?: string;
  type?:
    | 'packing_supply_route'
    | 'driver_task'
    | 'mover_change'
    | 'customer_general';
  appointmentId?: string;
  routeId?: string;
  error?: string;
}

export class InboundMessageRouter {
  private moverChangeHandler: MoverChangeHandler;
  private driverResponseHandler: DriverResponseHandler;

  constructor() {
    this.moverChangeHandler = new MoverChangeHandler();
    this.driverResponseHandler = new DriverResponseHandler();
  }

  /**
   * Route inbound SMS message to appropriate handler
   * @param phoneNumber - Sender's phone number
   * @param messageText - Message content (already lowercased)
   * @returns Promise<MessageRouteResult>
   */
  async routeMessage(
    phoneNumber: string,
    messageText: string
  ): Promise<MessageRouteResult> {
    try {
      // Classify message intent
      const intent: MessageIntent = classifyMessageIntent(messageText);

      // Handle mover change responses first (customer domain)
      if (intent === 'mover_accept' || intent === 'mover_diy') {
        return await this.moverChangeHandler.handleResponse(
          phoneNumber,
          intent === 'mover_accept' ? 'accept' : 'diy'
        );
      }

      // Find driver by phone number for driver responses
      const driver = await findDriverByPhone(phoneNumber);

      if (!driver) {
        // Check if this is a customer
        const customer = await findCustomerByPhone(phoneNumber);

        if (customer) {
          // Customer message but not mover change - send general support
          await MessageService.sendSms(phoneNumber, generalSupportTemplate, {});
          return { success: true, type: 'customer_general' };
        }

        // Neither driver nor customer found
        await MessageService.sendSms(phoneNumber, customerNotFoundTemplate, {});
        return { success: false, error: 'User not found' };
      }

      // Handle driver responses (packing supply or regular tasks)
      if (intent === 'positive' || intent === 'negative') {
        return await this.driverResponseHandler.handleResponse(
          driver,
          phoneNumber,
          intent,
          messageText
        );
      }

      // Handle ambiguous driver responses
      if (intent === 'ambiguous') {
        return await this.driverResponseHandler.handleAmbiguousResponse(
          driver,
          phoneNumber,
          messageText
        );
      }

      // Fallback - should not reach here
      await MessageService.sendSms(phoneNumber, generalAmbiguousTemplate, {});
      return { success: false, error: 'Unable to classify message intent' };
    } catch (error) {
      console.error('Error routing inbound message:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Internal routing error',
      };
    }
  }
}
