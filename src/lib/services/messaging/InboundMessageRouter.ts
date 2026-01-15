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
      // DEBUG: Log routing start
      console.log('--- InboundMessageRouter.routeMessage DEBUG ---');
      console.log('Phone number received:', phoneNumber);
      console.log('Message text received:', messageText);
      
      // Classify message intent
      const intent: MessageIntent = classifyMessageIntent(messageText);
      console.log('DEBUG: Classified intent:', intent);

      // Handle mover change responses first (customer domain)
      if (intent === 'mover_accept' || intent === 'mover_diy') {
        console.log('DEBUG: Routing to MoverChangeHandler');
        return await this.moverChangeHandler.handleResponse(
          phoneNumber,
          intent === 'mover_accept' ? 'accept' : 'diy'
        );
      }

      // Find driver by phone number for driver responses
      console.log('DEBUG: Looking up driver by phone:', phoneNumber);
      const driver = await findDriverByPhone(phoneNumber);
      console.log('DEBUG: Driver lookup result:', driver ? `Found driver ID: ${driver.id}, name: ${driver.firstName} ${driver.lastName}` : 'NO DRIVER FOUND');

      if (!driver) {
        // Check if this is a customer
        console.log('DEBUG: No driver found, checking for customer...');
        const customer = await findCustomerByPhone(phoneNumber);
        console.log('DEBUG: Customer lookup result:', customer ? `Found customer ID: ${customer.id}` : 'NO CUSTOMER FOUND');

        if (customer) {
          // Customer message but not mover change - send general support
          await MessageService.sendSms(phoneNumber, generalSupportTemplate, {});
          return { success: true, type: 'customer_general' };
        }

        // Neither driver nor customer found
        console.log('DEBUG: Neither driver nor customer found for phone:', phoneNumber);
        await MessageService.sendSms(phoneNumber, customerNotFoundTemplate, {});
        return { success: false, error: 'User not found' };
      }

      // Handle driver responses (packing supply or regular tasks)
      if (intent === 'positive' || intent === 'negative') {
        console.log('DEBUG: Routing to DriverResponseHandler.handleResponse with intent:', intent);
        return await this.driverResponseHandler.handleResponse(
          driver,
          phoneNumber,
          intent,
          messageText
        );
      }

      // Handle ambiguous driver responses
      if (intent === 'ambiguous') {
        console.log('DEBUG: Routing to DriverResponseHandler.handleAmbiguousResponse');
        return await this.driverResponseHandler.handleAmbiguousResponse(
          driver,
          phoneNumber,
          messageText
        );
      }

      // Fallback - should not reach here
      console.log('DEBUG: Fallback - unable to classify message intent');
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
