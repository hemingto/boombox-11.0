/**
 * @fileoverview Customer mover change response API endpoint
 * @source boombox-10.0/src/app/api/customer/mover-change-response/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that processes customer responses to mover change requests.
 * Handles both "accept" (new mover) and "diy" (switch to DIY plan) actions.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/customer/mover-change/[token]/page.tsx (line 87: processes customer mover change decisions)
 * - src/app/api/twilio/inbound/route.ts (line 124: handles SMS responses "ACCEPT"/"DIY")
 * - Customer mover change workflow triggered by moving partner cancellations
 *
 * INTEGRATION NOTES:
 * - CRITICAL: Preserves exact Onfleet task reassignment logic
 * - Maintains Stripe pricing calculations and appointment updates
 * - Uses base64 token validation for security
 * - Integrates with TimeSlotBooking system for mover assignments
 * - Handles driver assignment through moving partner relationships
 *
 * @refactor Moved from /api/customer/ to /api/orders/ structure, extracted business logic to utilities, centralized messaging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { 
  MoverChangeResponseRequestSchema,
  MoverChangeResponseResponseSchema 
} from '@/lib/validations/api.validations';
import {
  decodeMoverChangeToken,
  validateMoverChangeTokenData,
  checkMoverChangeRequestStatus,
  assignMovingPartnerDriver,
  createTimeSlotBooking,
  processDiyPlanConversion
} from '@/lib/utils/moverChangeUtils';
import { 
  moverChangeAcceptedTemplate,
  moverChangeToDiyTemplate 
} from '@/lib/messaging/templates/sms/booking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const parseResult = MoverChangeResponseRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { token, action, appointmentId } = parseResult.data;

    // Decode and validate token
    const tokenData = decodeMoverChangeToken(token);
    const { suggestedMovingPartnerId, originalMovingPartnerId } = validateMoverChangeTokenData(tokenData);

    // Get appointment with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if request is still pending
    checkMoverChangeRequestStatus(appointment);

    if (action === 'accept') {
      // Customer accepts the suggested moving partner
      const suggestedMover = await prisma.movingPartner.findUnique({
        where: { id: suggestedMovingPartnerId }
      });

      if (!suggestedMover) {
        return NextResponse.json({ error: 'Suggested moving partner not found' }, { status: 404 });
      }

      // Update appointment with new moving partner
      const priceDifference = (suggestedMover.hourlyRate || 0) - (appointment.loadingHelpPrice || 0);
      const newQuotedPrice = appointment.quotedPrice + priceDifference;

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          movingPartnerId: suggestedMovingPartnerId,
          loadingHelpPrice: suggestedMover.hourlyRate,
          quotedPrice: newQuotedPrice,
          description: JSON.stringify({
            moverChangeRequest: {
              suggestedMovingPartnerId,
              originalMovingPartnerId,
              status: 'accepted',
              acceptedAt: new Date().toISOString()
            }
          })
        }
      });

      // Create new TimeSlotBooking for the new moving partner
      await createTimeSlotBooking(appointment, suggestedMovingPartnerId);

      // Try to assign a driver from the new moving partner
      const assignedDriver = await assignMovingPartnerDriver(appointment, suggestedMovingPartnerId);
      
      if (assignedDriver && appointment.onfleetTasks.length > 0) {
        const onfleetClient = await getOnfleetClient();
        
        // Assign the driver to onfleet tasks
        for (const task of appointment.onfleetTasks) {
          try {
            await (onfleetClient as any).tasks.update(task.taskId, {
              worker: assignedDriver.onfleetWorkerId
            });

            await prisma.onfleetTask.update({
              where: { id: task.id },
              data: { 
                driverId: assignedDriver.id,
                driverNotificationStatus: 'assigned_by_system'
              }
            });
          } catch (error) {
            console.error(`Error assigning driver to task ${task.taskId}:`, error);
          }
        }
      }

      // Send confirmation SMS using centralized messaging
      if (appointment.user.phoneNumber) {
        await MessageService.sendSms(
          appointment.user.phoneNumber,
          moverChangeAcceptedTemplate,
          {
            newMovingPartner: suggestedMover.name,
            assignedDriver: assignedDriver ? `${assignedDriver.firstName} ${assignedDriver.lastName}` : undefined
          }
        ).catch(error => console.error('Error sending confirmation SMS:', error));
      }

      const response = {
        success: true,
        message: 'Moving partner accepted and assigned',
        newMovingPartner: suggestedMover.name,
        assignedDriver: assignedDriver ? `${assignedDriver.firstName} ${assignedDriver.lastName}` : null
      };

      return NextResponse.json(MoverChangeResponseResponseSchema.parse(response));

    } else if (action === 'diy') {
      // Customer chooses DIY plan
      const originalLoadingHelpPrice = appointment.loadingHelpPrice || 0;
      const newQuotedPrice = appointment.quotedPrice - originalLoadingHelpPrice;

      // Update appointment to DIY plan
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          movingPartnerId: null,
          loadingHelpPrice: 0,
          quotedPrice: newQuotedPrice,
          description: JSON.stringify({
            moverChangeRequest: {
              suggestedMovingPartnerId,
              originalMovingPartnerId,
              status: 'converted_to_diy',
              convertedAt: new Date().toISOString()
            }
          })
        }
      });

      // Process DIY plan conversion (Onfleet task reassignment)
      await processDiyPlanConversion(appointment);

      // Send confirmation SMS using centralized messaging
      if (appointment.user.phoneNumber) {
        await MessageService.sendSms(
          appointment.user.phoneNumber,
          moverChangeToDiyTemplate,
          {
            newQuotedPrice: newQuotedPrice.toString()
          }
        ).catch(error => console.error('Error sending confirmation SMS:', error));
      }

      const response = {
        success: true,
        message: 'Switched to DIY plan successfully',
        newQuotedPrice
      };

      return NextResponse.json(MoverChangeResponseResponseSchema.parse(response));

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "diy"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing mover change response:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    );
  }
} 