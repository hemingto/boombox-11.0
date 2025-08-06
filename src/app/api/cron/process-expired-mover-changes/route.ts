/**
 * @fileoverview Process expired mover change requests cron job
 * @source boombox-10.0/src/app/api/cron/process-expired-mover-changes/route.ts
 * @refactor Migrated cron job with centralized utilities and messaging templates
 * 
 * This endpoint processes appointments with pending mover change requests or 
 * third-party mover requests that are older than 2 hours and automatically:
 * - Assigns suggested moving partners if still available
 * - Escalates to admin if moving partner no longer available
 * - Moves third-party requests to Boombox Delivery Network
 * - Sends appropriate notifications to customers and admins
 * 
 * @route POST /api/cron/process-expired-mover-changes
 * @auth Requires CRON_SECRET environment variable
 * @schedule Typically called by external cron service every hour
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { 
  processExpiredMoverChange, 
  processExpiredThirdPartyMover 
} from '@/lib/utils/moverChangeUtils';
import { assignMovingPartnerDriver } from '@/lib/utils/movingPartnerUtils';
import { formatTime } from '@/lib/utils/dateUtils';
import { 
  moverChangeAutoAssignedTemplate,
  thirdPartyMoverTimeoutTemplate
} from '@/lib/messaging/templates/sms/booking';
import { thirdPartyTimeoutAlertTemplate } from '@/lib/messaging/templates/email/admin';
import { 
  ProcessExpiredMoverChangesRequestSchema,
  ProcessExpiredMoverChangesResponseSchema,
  type ProcessExpiredMoverChangesResponse
} from '@/lib/validations/api.validations';

export async function POST() {
  try {
    // Only allow this to run in production or with proper authorization
    const authHeader = process.env.CRON_SECRET;
    if (!authHeader) {
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
    }

    console.log('Starting expired mover change processing...');

    // Find appointments with pending mover change requests older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const expiredAppointments = await prisma.appointment.findMany({
      where: {
        description: {
          contains: '"moverChangeRequest"'
        },
        // Check appointments from the last 7 days to avoid processing very old records
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        onfleetTasks: true
      }
    });

    let processedCount = 0;
    let assignedCount = 0;
    let thirdPartyCount = 0;
    let errorCount = 0;

    for (const appointment of expiredAppointments) {
      try {
        // Parse appointment description
        let appointmentDescription;
        try {
          appointmentDescription = appointment.description ? JSON.parse(appointment.description) : {};
        } catch {
          continue; // Skip if description is not valid JSON
        }

        const moverChangeRequest = appointmentDescription.moverChangeRequest;
        const thirdPartyMoverRequest = appointmentDescription.thirdPartyMoverRequest;

        // Process pending mover change requests
        if (moverChangeRequest && moverChangeRequest.status === 'pending') {
          const requestedAt = new Date(moverChangeRequest.requestedAt);
          
          if (requestedAt <= twoHoursAgo) {
            console.log(`Processing expired mover change for appointment ${appointment.id}`);
            
            try {
              const { 
                suggestedMover, 
                isStillAvailable, 
                availabilityRecord,
                appointmentDate,
                appointmentTime 
              } = await processExpiredMoverChange(appointment, moverChangeRequest);

              if (isStillAvailable && availabilityRecord) {
                // Automatically assign the suggested moving partner
                const priceDifference = (suggestedMover.hourlyRate || 0) - (appointment.loadingHelpPrice || 0);
                const newQuotedPrice = appointment.quotedPrice + priceDifference;

                await prisma.appointment.update({
                  where: { id: appointment.id },
                  data: {
                    movingPartnerId: suggestedMover.id,
                    loadingHelpPrice: suggestedMover.hourlyRate,
                    quotedPrice: newQuotedPrice,
                    description: JSON.stringify({
                      ...appointmentDescription,
                      moverChangeRequest: {
                        ...moverChangeRequest,
                        status: 'auto_assigned',
                        autoAssignedAt: new Date().toISOString(),
                        reason: 'customer_no_response_timeout'
                      }
                    })
                  }
                });

                // Create TimeSlotBooking
                const endTime = new Date(appointmentTime.getTime() + (3 * 60 * 60 * 1000));
                await prisma.timeSlotBooking.create({
                  data: {
                    movingPartnerAvailabilityId: availabilityRecord.id,
                    appointmentId: appointment.id,
                    bookingDate: appointmentDate,
                    endDate: endTime
                  }
                });

                // Try to assign a driver
                const assignedDriver = await assignMovingPartnerDriver(appointment, suggestedMover.id);
                
                if (assignedDriver && appointment.onfleetTasks.length > 0) {
                  const onfleetClient = await getOnfleetClient();
                  
                  for (const task of appointment.onfleetTasks) {
                    try {
                      await (onfleetClient as any).tasks.update(task.taskId, {
                        worker: assignedDriver.onfleetWorkerId
                      });

                      await prisma.onfleetTask.update({
                        where: { id: task.id },
                        data: { 
                          driverId: assignedDriver.id,
                          driverNotificationStatus: 'auto_assigned_timeout'
                        }
                      });
                    } catch (error) {
                      console.error(`Error assigning driver to task ${task.taskId}:`, error);
                    }
                  }
                }

                // Notify customer using centralized template
                if (appointment.user.phoneNumber) {
                  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                      const formattedTime = formatTime(appointmentTime);

                  await MessageService.sendSms(
                    appointment.user.phoneNumber,
                    moverChangeAutoAssignedTemplate,
                    {
                      formattedDate,
                      formattedTime,
                      moverName: suggestedMover.name,
                      newQuotedPrice: newQuotedPrice.toString()
                    }
                  );
                }

                assignedCount++;
                console.log(`Auto-assigned ${suggestedMover.name} to appointment ${appointment.id}`);
              } else {
                // Suggested mover no longer available - mark for admin intervention
                await prisma.appointment.update({
                  where: { id: appointment.id },
                  data: {
                    description: JSON.stringify({
                      ...appointmentDescription,
                      moverChangeRequest: {
                        ...moverChangeRequest,
                        status: 'needs_admin_intervention',
                        reason: 'suggested_mover_no_longer_available',
                        escalatedAt: new Date().toISOString()
                      }
                    })
                  }
                });

                // Notify super admins using existing email service
                try {
                  const superAdmins = await prisma.admin.findMany({
                    where: { role: 'SUPERADMIN' },
                    select: { email: true, phoneNumber: true, name: true }
                  });

                  // Use existing sendNoDriverAvailableAlert function for consistency
                  const { sendNoDriverAvailableAlert } = await import('@/lib/messaging/sendgridClient');
                  
                  const appointmentDetails = {
                    appointmentId: appointment.id,
                    jobCode: appointment.jobCode ?? undefined,
                    date: appointmentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                    time: formatTime(appointmentTime),
                    address: appointment.address,
                    unitNumber: 1,
                    userName: `${appointment.user.firstName} ${appointment.user.lastName}`,
                    userPhone: appointment.user.phoneNumber
                  };

                  for (const admin of superAdmins) {
                    if (admin.email) {
                      await sendNoDriverAvailableAlert(admin.email, appointmentDetails);
                    }
                  }
                } catch (adminError) {
                  console.error('Error notifying admins:', adminError);
                }

                errorCount++;
                console.log(`Suggested mover no longer available for appointment ${appointment.id}, escalated to admin`);
              }

              processedCount++;
            } catch (error) {
              console.error(`Error processing expired mover change for appointment ${appointment.id}:`, error);
              errorCount++;
            }
          }
        }

        // Process pending third-party mover requests
        if (thirdPartyMoverRequest && thirdPartyMoverRequest.status === 'pending') {
          const requestedAt = new Date(thirdPartyMoverRequest.requestedAt);
          
          if (requestedAt <= twoHoursAgo) {
            console.log(`Processing expired third party mover request for appointment ${appointment.id}`);
            
            try {
              await processExpiredThirdPartyMover(appointment, thirdPartyMoverRequest);

              // Move tasks to Boombox Delivery Network if not already there
              if (appointment.onfleetTasks.length > 0) {
                const onfleetClient = await getOnfleetClient();
                
                for (const task of appointment.onfleetTasks) {
                  try {
                    await (onfleetClient as any).tasks.update(task.taskId, {
                      container: { type: "TEAM", team: process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID }
                    });

                    await prisma.onfleetTask.update({
                      where: { id: task.id },
                      data: { 
                        driverNotificationStatus: 'third_party_timeout_boombox_assigned'
                      }
                    });
                  } catch (error) {
                    console.error(`Error moving task to Boombox team: ${error}`);
                  }
                }
              }

              // Notify customer about timeout using centralized template
              if (appointment.user.phoneNumber) {
                const appointmentDate = new Date(appointment.date);
                const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                });

                await MessageService.sendSms(
                  appointment.user.phoneNumber,
                  thirdPartyMoverTimeoutTemplate,
                  { formattedDate }
                );
              }

              // Notify super admins using centralized template
              try {
                const superAdmins = await prisma.admin.findMany({
                  where: { role: 'SUPERADMIN' },
                  select: { email: true, phoneNumber: true, name: true }
                });

                for (const admin of superAdmins) {
                  if (admin.email) {
                    await MessageService.sendEmail(
                      admin.email,
                      thirdPartyTimeoutAlertTemplate,
                      {
                        appointmentId: appointment.id.toString(),
                        customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
                        customerPhone: appointment.user.phoneNumber || 'N/A',
                        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || ''
                      }
                    );
                  }
                }
              } catch (adminError) {
                console.error('Error notifying admins about third party timeout:', adminError);
              }

              thirdPartyCount++;
              processedCount++;
            } catch (error) {
              console.error(`Error processing expired third party request for appointment ${appointment.id}:`, error);
              errorCount++;
            }
          }
        }

      } catch (error) {
        console.error(`Error processing appointment ${appointment.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Expired mover change processing complete. Processed: ${processedCount}, Auto-assigned: ${assignedCount}, Third-party escalated: ${thirdPartyCount}, Errors: ${errorCount}`);

    const response: ProcessExpiredMoverChangesResponse = {
      success: true,
      summary: {
        totalProcessed: processedCount,
        autoAssigned: assignedCount,
        thirdPartyEscalated: thirdPartyCount,
        errors: errorCount
      }
    };

    // Validate response schema
    const validatedResponse = ProcessExpiredMoverChangesResponseSchema.parse(response);
    return NextResponse.json(validatedResponse);

  } catch (error) {
    console.error('Error in expired mover change cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process expired mover changes' },
      { status: 500 }
    );
  }
}