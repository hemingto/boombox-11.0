/**
 * @fileoverview Driver response handler service for packing supply and task responses
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 244-551)
 * @refactor Extracted driver response logic into centralized service
 */

import {
  findRecentPackingSupplyRoute,
  findLatestDriverTask,
  removeDriverFromAppointment,
  formatAppointmentDate,
  formatAppointmentTime,
  findCustomerByPhone,
  findPendingMoverChange,
  type MessageIntent,
} from '@/lib/utils';
import { generateSmsResponseToken } from '@/lib/utils/twilioUtils';
import { MessageService } from '../../messaging/MessageService';
import { config } from '@/lib/config/environment';
import type { Driver } from '@prisma/client';
import {
  packingSupplyAmbiguousResponseTemplate,
  packingSupplyProcessingErrorTemplate,
  packingSupplyAcceptedTemplate,
  packingSupplyDeclinedTemplate,
  noRecentTaskFoundTemplate,
  taskAmbiguousResponseTemplate,
  taskAcceptanceErrorTemplate,
  taskAcceptanceConfirmationTemplate,
  taskDeclineReconfirmationTemplate,
  taskDeclineConfirmationTemplate,
  taskDeclineErrorTemplate,
} from '@/lib/messaging/templates/sms/driver';
import {
  moverChangeAmbiguousTemplate,
  generalAmbiguousTemplate,
} from '@/lib/messaging/templates/sms/customer';
import type { MessageRouteResult } from './InboundMessageRouter';

export class DriverResponseHandler {
  /**
   * Handle driver response to packing supply offers or task assignments
   * @param driver - Driver record
   * @param phoneNumber - Driver phone number
   * @param intent - Message intent (positive/negative)
   * @param messageText - Original message text
   * @returns Promise<MessageRouteResult>
   */
  async handleResponse(
    driver: Driver,
    phoneNumber: string,
    intent: MessageIntent,
    messageText: string
  ): Promise<MessageRouteResult> {
    // DEBUG: Log handler entry
    console.log('--- DriverResponseHandler.handleResponse DEBUG ---');
    console.log('Driver ID:', driver.id);
    console.log('Driver name:', `${driver.firstName} ${driver.lastName}`);
    console.log('Driver stored phone:', driver.phoneNumber);
    console.log('Intent:', intent);
    console.log('Message text:', messageText);
    
    // Check for recent packing supply route offers first (within last 30 minutes)
    console.log('DEBUG: Checking for recent packing supply route...');
    const recentPackingSupplyRoute = await findRecentPackingSupplyRoute();
    console.log('DEBUG: Recent packing supply route found:', recentPackingSupplyRoute ? `Route ID: ${recentPackingSupplyRoute.routeId}` : 'NONE');

    if (recentPackingSupplyRoute) {
      console.log('DEBUG: Routing to handlePackingSupplyResponse');
      return await this.handlePackingSupplyResponse(
        driver,
        phoneNumber,
        intent === 'positive' ? 'accept' : 'decline',
        recentPackingSupplyRoute
      );
    }

    // Handle regular driver task responses
    console.log('DEBUG: No packing supply route, routing to handleTaskResponse');
    return await this.handleTaskResponse(driver, phoneNumber, intent);
  }

  /**
   * Handle ambiguous driver responses
   * @param driver - Driver record
   * @param phoneNumber - Driver phone number
   * @param messageText - Original message text
   * @returns Promise<MessageRouteResult>
   */
  async handleAmbiguousResponse(
    driver: Driver,
    phoneNumber: string,
    messageText: string
  ): Promise<MessageRouteResult> {
    // Check if this might be a customer trying to respond to mover change
    const customer = await findCustomerByPhone(phoneNumber);

    if (customer) {
      const pendingAppointment = await findPendingMoverChange(customer.id);

      if (pendingAppointment) {
        await MessageService.sendSms(
          phoneNumber,
          moverChangeAmbiguousTemplate,
          {}
        );
      } else {
        await MessageService.sendSms(phoneNumber, generalAmbiguousTemplate, {});
      }

      return { success: false, error: 'Ambiguous customer response' };
    }

    // Driver ambiguous response
    await MessageService.sendSms(
      phoneNumber,
      taskAmbiguousResponseTemplate,
      {}
    );
    return { success: false, error: 'Ambiguous driver response' };
  }

  /**
   * Handle packing supply route response
   */
  private async handlePackingSupplyResponse(
    driver: Driver,
    phoneNumber: string,
    action: 'accept' | 'decline',
    route: any
  ): Promise<MessageRouteResult> {
    try {
      // Generate temporary token for the driver response API
      const tokenPayload = {
        routeId: route.routeId,
        driverId: driver.id,
        action: 'packing_supply_route_offer',
        timestamp: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minute expiry
      };

      const tempToken = generateSmsResponseToken(tokenPayload);

      // Call the packing supply driver response API
      const response = await fetch(
        `${config.app.url}/api/onfleet/packing-supplies/driver-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: tempToken,
            action: action,
          }),
        }
      );

      if (!response.ok) {
        await MessageService.sendSms(
          phoneNumber,
          packingSupplyProcessingErrorTemplate,
          {
            action,
          }
        );
        return {
          success: false,
          error: `Error ${action}ing packing supply route`,
        };
      }

      // Send confirmation message
      if (action === 'accept') {
        await MessageService.sendSms(
          phoneNumber,
          packingSupplyAcceptedTemplate,
          {
            totalStops: route.totalStops?.toString() || '0',
          }
        );
      } else {
        await MessageService.sendSms(
          phoneNumber,
          packingSupplyDeclinedTemplate,
          {}
        );
      }

      return {
        success: true,
        action,
        type: 'packing_supply_route',
        routeId: route.routeId,
      };
    } catch (error) {
      console.error('Error handling packing supply response:', error);
      await MessageService.sendSms(
        phoneNumber,
        packingSupplyProcessingErrorTemplate,
        {
          action,
        }
      );
      return { success: false, error: 'Internal packing supply error' };
    }
  }

  /**
   * Handle regular driver task response
   */
  private async handleTaskResponse(
    driver: Driver,
    phoneNumber: string,
    intent: MessageIntent
  ): Promise<MessageRouteResult> {
    try {
      // DEBUG: Log task lookup
      console.log('--- handleTaskResponse DEBUG ---');
      console.log('Looking up latest task for driver ID:', driver.id);
      
      // Find the latest task notification
      const latestTask = await findLatestDriverTask(driver.id);
      
      // DEBUG: Log task lookup result
      if (latestTask) {
        console.log('DEBUG: Task found!');
        console.log('  - Task ID:', latestTask.id);
        console.log('  - Task taskId (Onfleet):', latestTask.taskId);
        console.log('  - Appointment ID:', latestTask.appointmentId);
        console.log('  - driverNotificationStatus:', latestTask.driverNotificationStatus);
        console.log('  - driverNotificationSentAt:', latestTask.driverNotificationSentAt);
        console.log('  - lastNotifiedDriverId:', latestTask.lastNotifiedDriverId);
        console.log('  - Appointment date:', latestTask.appointment?.date);
        console.log('  - Appointment time:', latestTask.appointment?.time);
      } else {
        console.log('DEBUG: NO TASK FOUND for driver ID:', driver.id);
        console.log('  - This means no OnfleetTask exists where:');
        console.log('    1. lastNotifiedDriverId =', driver.id);
        console.log('    2. driverNotificationStatus IN ["sent", "pending_reconfirmation"]');
        console.log('    3. driverNotificationSentAt is within the last 2 hours');
      }

      if (!latestTask) {
        console.log('DEBUG: Sending noRecentTaskFoundTemplate SMS');
        await MessageService.sendSms(
          phoneNumber,
          noRecentTaskFoundTemplate,
          {}
        );
        return { success: false, error: 'No recent task notification found' };
      }

      const action = intent === 'positive' ? 'accept' : 'decline';
      console.log('DEBUG: Action determined:', action);

      if (action === 'accept') {
        console.log('DEBUG: Calling handleTaskAcceptance');
        return await this.handleTaskAcceptance(driver, phoneNumber, latestTask);
      } else {
        console.log('DEBUG: Calling handleTaskDecline');
        return await this.handleTaskDecline(driver, phoneNumber, latestTask);
      }
    } catch (error) {
      console.error('Error handling task response:', error);
      return { success: false, error: 'Internal task response error' };
    }
  }

  /**
   * Handle task acceptance
   */
  private async handleTaskAcceptance(
    driver: Driver,
    phoneNumber: string,
    task: any
  ): Promise<MessageRouteResult> {
    try {
      // DEBUG: Log acceptance details
      console.log('--- handleTaskAcceptance DEBUG ---');
      const actionToUse =
        task.driverNotificationStatus === 'pending_reconfirmation'
          ? 'reconfirm'
          : 'accept';
      console.log('DEBUG: Action to use:', actionToUse);

      const requestBody = {
        appointmentId: task.appointmentId,
        driverId: driver.id,
        onfleetTaskId: task.taskId,
        action: actionToUse,
        // Mark source as inbound_sms so driver-assign API skips sending its SMS confirmation
        // (we send our own confirmation in this handler after the API call succeeds)
        source: 'inbound_sms',
      };
      console.log('DEBUG: Calling /api/onfleet/driver-assign with:', JSON.stringify(requestBody, null, 2));
      console.log('DEBUG: API URL:', `${config.app.url}/api/onfleet/driver-assign`);

      const response = await fetch(
        `${config.app.url}/api/onfleet/driver-assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      // DEBUG: Log response
      const responseText = await response.text();
      console.log('DEBUG: driver-assign response status:', response.status);
      console.log('DEBUG: driver-assign response body:', responseText);

      if (!response.ok) {
        console.log('DEBUG: driver-assign failed, sending error SMS');
        await MessageService.sendSms(
          phoneNumber,
          taskAcceptanceErrorTemplate,
          {}
        );
        return { success: false, error: 'Error accepting task' };
      }

      // Send confirmation with appointment details
      const formattedDate = formatAppointmentDate(task.appointment.date);
      const formattedTime = formatAppointmentTime(task.appointment.time);
      console.log('DEBUG: Sending confirmation SMS for date:', formattedDate, 'time:', formattedTime);

      await MessageService.sendSms(
        phoneNumber,
        taskAcceptanceConfirmationTemplate,
        {
          formattedDate,
          formattedTime,
        }
      );

      console.log('DEBUG: Task acceptance completed successfully');
      return { success: true, action: 'accept', type: 'driver_task' };
    } catch (error) {
      console.error('Error handling task acceptance:', error);
      await MessageService.sendSms(
        phoneNumber,
        taskAcceptanceErrorTemplate,
        {}
      );
      return { success: false, error: 'Internal task acceptance error' };
    }
  }

  /**
   * Handle task decline
   */
  private async handleTaskDecline(
    driver: Driver,
    phoneNumber: string,
    task: any
  ): Promise<MessageRouteResult> {
    try {
      const isReconfirmationDecline =
        task.driverNotificationStatus === 'pending_reconfirmation';

      if (isReconfirmationDecline) {
        // Remove driver from all tasks for this appointment and trigger reassignment
        await removeDriverFromAppointment(task.appointmentId, driver.id);

        // Trigger driver reassignment
        await fetch(`${config.app.url}/api/onfleet/driver-assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: task.appointmentId,
            action: 'retry',
          }),
        }).catch(error => {
          console.error('Error triggering driver reassignment:', error);
        });

        await MessageService.sendSms(
          phoneNumber,
          taskDeclineReconfirmationTemplate,
          {}
        );
        return {
          success: true,
          action: 'decline_reconfirm',
          type: 'driver_task',
        };
      } else {
        // Regular decline
        const response = await fetch(
          `${config.app.url}/api/onfleet/driver-assign`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              appointmentId: task.appointmentId,
              driverId: driver.id,
              onfleetTaskId: task.taskId,
              action: 'decline',
            }),
          }
        );

        if (!response.ok) {
          await MessageService.sendSms(
            phoneNumber,
            taskDeclineErrorTemplate,
            {}
          );
          return { success: false, error: 'Error declining task' };
        }

        await MessageService.sendSms(
          phoneNumber,
          taskDeclineConfirmationTemplate,
          {}
        );
        return { success: true, action: 'decline', type: 'driver_task' };
      }
    } catch (error) {
      console.error('Error handling task decline:', error);
      await MessageService.sendSms(phoneNumber, taskDeclineErrorTemplate, {});
      return { success: false, error: 'Internal task decline error' };
    }
  }
}
