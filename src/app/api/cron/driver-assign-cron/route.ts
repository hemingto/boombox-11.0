/**
 * @fileoverview Driver assignment retry cron job
 * @source boombox-10.0/src/app/api/driver-assign/cron/route.ts
 * @refactor Migrated to domain-based API structure with centralized utilities and validation
 * 
 * ROUTE FUNCTIONALITY:
 * This cron job runs every 15 minutes to check for driver assignments that have been sent 
 * but not accepted within the 2-hour time window. It automatically retries the assignment
 * by finding the next available driver and sending them a notification.
 * 
 * USED BY (boombox-10.0 files):
 * - Cron service configuration (external scheduler calls this endpoint)
 * - Admin dashboard may trigger manual retry (future implementation)
 * 
 * INTEGRATION NOTES:
 * - Requires CRON_API_SECRET environment variable for authentication
 * - Uses Onfleet API for driver assignments and task management
 * - Integrates with Twilio for SMS notifications to drivers
 * - Updates database records for tracking driver notification status
 * 
 * @refactor Extracted business logic to driverAssignmentUtils, added validation schema,
 * updated to use centralized database client and messaging patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { handleRetryAssignment } from '@/lib/utils/driverAssignmentUtils';
import { 
  validateApiRequest,
  DriverAssignCronRequestSchema,
  DriverAssignCronResponseSchema,
  type DriverAssignCronResponse
} from '@/lib/validations/api.validations';

// ===== CONSTANTS =====

// Time cutoff for expired driver notifications (2 hours)
const DRIVER_NOTIFICATION_TIMEOUT_HOURS = 2;

// ===== ROUTE HANDLERS =====

/**
 * GET - Process expired driver assignments
 * Checks for tasks that have been sent to drivers but not accepted within the time window
 * and retries assignment with the next available driver
 */
export async function GET(req: NextRequest): Promise<NextResponse<DriverAssignCronResponse>> {
  const startTime = Date.now();
  
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    
    // Skip auth check in development
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_API_SECRET}`) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        results: [],
        appointmentsProcessed: 0
      }, { status: 401 });
    }

    console.log('🔄 Driver assignment retry cron job started...');

    // Parse and validate request (no parameters expected for this cron)
    const validation = validateApiRequest(DriverAssignCronRequestSchema, {});
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request parameters',
        results: [],
        appointmentsProcessed: 0
      }, { status: 400 });
    }

    // Calculate the cutoff time (2 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - DRIVER_NOTIFICATION_TIMEOUT_HOURS);
    
    console.log(`📋 Checking for driver assignments older than: ${cutoffTime.toISOString()}`);

    // Find all appointments with tasks that need to be retried
    const appointmentsToRetry = await prisma.appointment.findMany({
      where: {
        onfleetTasks: {
          some: {
            driverNotificationStatus: 'sent',
            driverNotificationSentAt: {
              lt: cutoffTime
            },
            driverId: null // Only unassigned tasks
          }
        }
      },
      include: {
        user: true,
        onfleetTasks: true
      }
    });
    
    console.log(`🔍 Found ${appointmentsToRetry.length} appointments to retry driver assignment`);
    
    // Process each appointment using the centralized retry logic
    const results = [];
    
    for (const appointment of appointmentsToRetry) {
      try {
        console.log(`🔄 Processing appointment ${appointment.id}...`);
        
        // Use the centralized retry function from utilities
        const retryResult = await handleRetryAssignment(appointment);
        
        // Count how many tasks were actually retried
        const tasksRetried = retryResult.unitResults.filter(
          result => result.status === 'retry_sent'
        ).length;
        
        results.push({
          appointmentId: appointment.id,
          status: 'retried' as const,
          tasksRetried
        });
        
        console.log(`✅ Successfully processed appointment ${appointment.id}, retried ${tasksRetried} tasks`);
        
      } catch (error) {
        console.error(`❌ Error retrying appointment ${appointment.id}:`, error);
        
        results.push({
          appointmentId: appointment.id,
          status: 'error' as const,
          error: (error as Error).message,
          tasksRetried: 0
        });
      }
    }
    
    const executionTime = Date.now() - startTime;
    const successMessage = `Processed ${appointmentsToRetry.length} appointments for driver assignment retry in ${executionTime}ms`;
    
    console.log(`🎉 ${successMessage}`);
    
    return NextResponse.json({
      success: true,
      message: successMessage,
      results,
      appointmentsProcessed: appointmentsToRetry.length
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = `Driver assignment retry cron job failed after ${executionTime}ms`;
    
    console.error(`💥 ${errorMessage}:`, error);
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      results: [],
      appointmentsProcessed: 0
    }, { status: 500 });
  }
}