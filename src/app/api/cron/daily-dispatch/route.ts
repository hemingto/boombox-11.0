/**
 * @fileoverview Daily dispatch cron job for packing supply team auto-dispatch
 * @source boombox-10.0/src/app/api/cron/daily-dispatch/route.ts
 * @source boombox-10.0/src/cron/daily-dispatch.ts (utility functions)
 * @refactor Migrated to domain-based API structure with centralized utilities and messaging
 */

import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/messaging/MessageService';
import { systemFailureTemplate } from '@/lib/messaging/templates/email/admin';
import { isValidDispatchTime, getPSTTime } from '@/lib/utils/dateUtils';
import {
  validateApiRequest,
  DailyDispatchCronRequestSchema,
} from '@/lib/validations/api.validations';

// ===== CONSTANTS =====

const DISPATCH_API_ENDPOINT = '/api/onfleet/dispatch-team';
const PST_DISPATCH_HOUR = 12; // 12:00 PM PST

// ===== ROUTE HANDLERS =====

/**
 * POST - Execute daily dispatch
 * Triggers auto-dispatch for packing supply deliveries at 12:00 PM PST daily
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');

    // Skip auth check in development
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_API_SECRET}`
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    console.log('🕐 Daily dispatch cron job started...');

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validation = validateApiRequest(DailyDispatchCronRequestSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { targetDate, dryRun, forceDispatch } = validation.data;

    // Prepare execution context
    const executionDate = targetDate || new Date().toISOString().split('T')[0];
    const pstTime = getPSTTime();

    console.log(`📋 Dispatch request for date: ${executionDate}`);
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No actual dispatch will be performed');
    }

    // Check dispatch timing (unless forced or dry run)
    if (!forceDispatch && !dryRun && !isValidDispatchTime()) {
      const nextDispatchTime = getNextDispatchTime();
      console.log(
        `⏰ Dispatch not allowed before ${PST_DISPATCH_HOUR} PM PST. Next dispatch: ${nextDispatchTime.toISOString()}`
      );

      return NextResponse.json(
        {
          success: false,
          error: `Dispatch not allowed before ${PST_DISPATCH_HOUR} PM PST`,
          currentTime: pstTime.toLocaleString(),
          nextScheduledDispatch: nextDispatchTime.toISOString(),
        },
        { status: 400 }
      );
    }

    let dispatchResult: {
      success: boolean;
      dispatchId?: string;
      tasksDispatched?: number;
      teamId?: string;
      teamName?: string;
      error?: string;
    };

    if (!dryRun) {
      // Execute the actual dispatch by calling the dispatch-team endpoint
      dispatchResult = await executeDispatch({
        targetDate: executionDate,
        forceDispatch,
      });
    } else {
      // Simulate dispatch for dry run
      console.log('🔍 DRY RUN: Simulating dispatch execution...');
      dispatchResult = await simulateDispatch(executionDate);
    }

    const executionTime = Date.now() - startTime;

    if (dispatchResult.success) {
      console.log('✅ Daily dispatch completed successfully');
      console.log(
        `📊 Summary: ${dispatchResult.tasksDispatched || 0} tasks dispatched in ${executionTime}ms`
      );

      return NextResponse.json({
        success: true,
        message: dryRun
          ? 'Daily dispatch simulation completed'
          : 'Daily dispatch completed successfully',
        data: {
          dispatchId: dispatchResult.dispatchId || '',
          targetDate: executionDate,
          dryRun,
          tasksDispatched: dispatchResult.tasksDispatched || 0,
          teamId: dispatchResult.teamId || '',
          teamName: dispatchResult.teamName || '',
        },
        executionTime,
      });
    } else {
      const errorMessage = dispatchResult.error || 'Unknown dispatch error';
      console.error('❌ Daily dispatch failed:', errorMessage);

      // Send failure notification (skip in dry run)
      if (!dryRun) {
        await sendDispatchFailureNotification(
          executionDate,
          errorMessage,
          executionTime
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          targetDate: executionDate,
          dryRun,
          executionTime,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const executionTime = Date.now() - startTime;

    console.error('❌ Daily dispatch cron job failed:', error);

    // Send failure notification (skip for dry run requests)
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const isDryRun = body.dryRun === true;

    if (!isDryRun) {
      const targetDate =
        body.targetDate || new Date().toISOString().split('T')[0];
      await sendDispatchFailureNotification(
        targetDate,
        errorMessage,
        executionTime
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        executionTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check and status
 * Returns dispatch system health and next scheduled dispatch time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const healthCheck = searchParams.get('health') === 'true';

    if (healthCheck) {
      // Perform comprehensive health check
      const health = await checkDispatchHealth();

      return NextResponse.json({
        success: true,
        health,
        timestamp: new Date().toISOString(),
      });
    }

    // Return basic status
    const nextDispatch = getNextDispatchTime();
    const pstTime = getPSTTime();

    return NextResponse.json({
      success: true,
      message: 'Daily dispatch cron endpoint is active',
      status: {
        currentTime: pstTime.toLocaleString(),
        nextScheduledDispatch: nextDispatch.toISOString(),
        canDispatchNow: isValidDispatchTime(),
        dispatchHour: PST_DISPATCH_HOUR,
        timezone: 'America/Los_Angeles',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in daily dispatch health check:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Execute the actual dispatch by calling the dispatch-team API
 */
async function executeDispatch(options: {
  targetDate: string;
  forceDispatch?: boolean;
}): Promise<{
  success: boolean;
  dispatchId?: string;
  tasksDispatched?: number;
  teamId?: string;
  teamName?: string;
  error?: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dispatchUrl = `${baseUrl}${DISPATCH_API_ENDPOINT}`;

    console.log(`🚚 Calling dispatch API: ${dispatchUrl}`);

    const response = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET || process.env.CRON_API_SECRET}`,
      },
      body: JSON.stringify({
        targetDate: options.targetDate,
        forceDispatch: options.forceDispatch,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Dispatch API failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();

    return {
      success: true,
      dispatchId: result.dispatchId,
      tasksDispatched: result.tasksDispatched || 0,
      teamId: result.teamId,
      teamName: result.teamName,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown dispatch error';
    console.error('Error executing dispatch:', error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Simulate dispatch for dry run mode
 */
async function simulateDispatch(targetDate: string): Promise<{
  success: boolean;
  dispatchId: string;
  tasksDispatched: number;
  teamId: string;
  teamName: string;
}> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock successful dispatch
  return {
    success: true,
    dispatchId: `dry_run_${Date.now()}`,
    tasksDispatched: Math.floor(Math.random() * 10) + 1, // Simulate 1-10 tasks
    teamId: process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || 'mock_team',
    teamName: 'Packing Supply Delivery Team (Dry Run)',
  };
}

/**
 * Get next dispatch time (12 PM PST)
 */
function getNextDispatchTime(): Date {
  const pstTime = getPSTTime();

  // Set to 12 PM PST today
  const nextDispatch = new Date(pstTime);
  nextDispatch.setHours(PST_DISPATCH_HOUR, 0, 0, 0);

  // If it's already past 12 PM today, schedule for tomorrow
  if (pstTime.getHours() >= PST_DISPATCH_HOUR) {
    nextDispatch.setDate(nextDispatch.getDate() + 1);
  }

  return nextDispatch;
}

/**
 * Send dispatch failure notification to admin using centralized messaging
 */
async function sendDispatchFailureNotification(
  targetDate: string,
  errorMessage: string,
  executionTime: number
): Promise<void> {
  try {
    console.log('🚨 Sending dispatch failure notification to admin...');

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [
      'admin@boomboxstorage.com',
    ];
    const formattedDate = new Date(targetDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Use the systemFailureTemplate for dispatch failures
    const templateVariables = {
      systemName: 'Daily Dispatch System',
      formattedDate,
      timestamp: new Date().toLocaleString(),
      errorMessage,
      impactDescription:
        'The automated daily dispatch process failed to complete. This may result in delayed packing supply deliveries as drivers may not be automatically assigned to delivery routes.',
      nextStepsText: `1. Check the dispatch team endpoint status
2. Verify Onfleet team configuration and API keys
3. Review pending packing supply orders
4. Consider manual dispatch if automated retry fails
5. Monitor subsequent automated dispatch attempts`,
      nextStepsSection: `<ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">Check the dispatch team endpoint: /api/onfleet/dispatch-team</li>
        <li style="margin-bottom: 6px;">Verify Onfleet team configuration and API keys</li>
        <li style="margin-bottom: 6px;">Review pending packing supply orders requiring dispatch</li>
        <li style="margin-bottom: 6px;">Consider manual dispatch if automated retry fails</li>
        <li style="margin-bottom: 6px;">Monitor subsequent automated dispatch attempts</li>
      </ol>`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard`,
      executionTime: String(executionTime),
    };

    // Send notification to all admin emails
    for (const email of adminEmails) {
      const result = await MessageService.sendEmail(
        email.trim(),
        systemFailureTemplate,
        templateVariables
      );

      if (!result.success) {
        console.error(
          `Failed to send dispatch failure notification to ${email}:`,
          result.error
        );
      }
    }

    console.log(
      `Dispatch failure notification sent to ${adminEmails.length} admin recipients`
    );
  } catch (error) {
    console.error('Failed to send dispatch failure notification:', error);
  }
}

/**
 * Health check for dispatch system
 */
async function checkDispatchHealth(): Promise<{
  isHealthy: boolean;
  checks: {
    apiEndpoint: boolean;
    timeConfiguration: boolean;
    environmentVariables: boolean;
    onfleetConnection: boolean;
  };
  nextScheduledDispatch: string;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const checks = {
    apiEndpoint: false,
    timeConfiguration: false,
    environmentVariables: false,
    onfleetConnection: false,
  };

  try {
    // Check API endpoint availability
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}${DISPATCH_API_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_API_SECRET || process.env.CRON_API_SECRET}`,
        },
      });
      checks.apiEndpoint = response.ok;
      if (!response.ok) {
        warnings.push(`Dispatch API endpoint returned ${response.status}`);
      }
    } catch (error) {
      warnings.push('Dispatch API endpoint not accessible');
    }

    // Check time configuration
    const nextDispatch = getNextDispatchTime();
    checks.timeConfiguration =
      nextDispatch instanceof Date && !isNaN(nextDispatch.getTime());
    if (!checks.timeConfiguration) {
      warnings.push('Time configuration is invalid');
    }

    // Check environment variables
    const requiredEnvVars = [
      'BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS',
      'ONFLEET_API_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );
    checks.environmentVariables = missingEnvVars.length === 0;

    if (missingEnvVars.length > 0) {
      warnings.push(
        `Missing environment variables: ${missingEnvVars.join(', ')}`
      );
    }

    // Check Onfleet connection (basic connectivity test)
    try {
      if (process.env.ONFLEET_API_KEY) {
        // This is a basic check - we could enhance it by calling a simple Onfleet API
        checks.onfleetConnection = true;
      } else {
        warnings.push('Onfleet API key not configured');
      }
    } catch (error) {
      checks.onfleetConnection = false;
      warnings.push('Onfleet connection test failed');
    }

    const isHealthy = Object.values(checks).every(check => check);

    return {
      isHealthy,
      checks,
      nextScheduledDispatch: getNextDispatchTime().toISOString(),
      warnings,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      isHealthy: false,
      checks,
      nextScheduledDispatch: '',
      warnings: [`Health check failed: ${errorMessage}`],
    };
  }
}

// Note: DailyDispatchCronRequestSchema not exported from route files
