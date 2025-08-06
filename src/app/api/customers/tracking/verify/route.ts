/**
 * @fileoverview Customer tracking verification endpoint with complex appointment tracking logic
 * @source boombox-10.0/src/app/api/tracking/verify/route.ts
 * @refactor Migrated 350-line complex route to use centralized utilities and services
 * 
 * POST /api/customers/tracking/verify
 * 
 * Verifies a JWT tracking token and returns detailed appointment tracking data with delivery
 * unit statuses, step progress, timestamps, and location coordinates. This is the main endpoint
 * powering the customer-facing tracking interface.
 * 
 * ## Request Body
 * ```json
 * {
 *   "token": "jwt-tracking-token"
 * }
 * ```
 * 
 * ## Response
 * - 200: Detailed tracking data with delivery units, steps, and location
 * - 400: Invalid token format or validation error
 * - 401: Invalid or expired tracking link
 * - 500: Server error
 * 
 * ## Response Format
 * ```json
 * {
 *   "appointmentDate": "2024-01-15",
 *   "appointmentType": "Initial Pickup",
 *   "deliveryUnits": [{
 *     "id": "task-123",
 *     "status": "in_transit",
 *     "unitNumber": 1,
 *     "totalUnits": 2,
 *     "provider": "Partner Name",
 *     "steps": [{
 *       "status": "complete",
 *       "title": "Partner is picking up your Boombox",
 *       "timestamp": "2:30pm",
 *       "action": { "label": "Track location", "trackingUrl": "..." }
 *     }]
 *   }],
 *   "location": {
 *     "coordinates": { "lat": 37.7749, "lng": -122.4194 }
 *   }
 * }
 * ```
 * 
 * ## Business Logic
 * 1. Verifies JWT token and extracts appointment ID
 * 2. Fetches appointment with Onfleet tasks and moving partner data
 * 3. Groups tasks by step number and unit number for parallel processing
 * 4. Fetches individual task details from Onfleet API
 * 5. Determines complex step statuses based on appointment type and task states
 * 6. Generates context-aware step titles based on appointment type and unit position
 * 7. Geocodes appointment address for location display
 * 8. Formats comprehensive tracking data for frontend consumption
 * 
 * ## Integration Points
 * - **Onfleet API**: Task details and tracking URLs
 * - **Google Maps API**: Address geocoding for location display
 * - **JWT tokens**: Secure appointment access control
 * - **Database**: Appointment and task relationship data
 * 
 * ## Dependencies
 * - appointmentUtils.verifyTrackingToken() - JWT verification
 * - trackingUtils.determineStepStatuses() - Complex status logic
 * - trackingUtils.getStepTitle() - Appointment-specific titles
 * - onfleetClient.fetchTaskByShortId() - Onfleet task fetching
 * - geocodingService.geocodeAddress() - Location coordinates
 * - TrackingVerifyRequestSchema/ResponseSchema - Validation
 */

import { NextResponse } from 'next/server';
import { verifyTrackingToken } from '@/lib/utils/appointmentUtils';
import { 
  determineStepStatuses, 
  getStepTitle, 
  getOrdinalNumber,
  type DecodedTrackingToken,
  type TrackingTaskIds 
} from '@/lib/utils/trackingUtils';
import { fetchTaskByShortId } from '@/lib/integrations/onfleetClient';
import { geocodeAddress } from '@/lib/services/geocodingService';
import { 
  TrackingVerifyRequestSchema, 
  TrackingVerifyResponseSchema,
  type TrackingVerifyResponse 
} from '@/lib/validations/api.validations';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = TrackingVerifyRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Verify the JWT token using centralized utility
    const tokenResult = verifyTrackingToken(token);
    
    if (!tokenResult.valid || !tokenResult.appointmentId) {
      return NextResponse.json(
        { error: 'Invalid or expired tracking link' }, 
        { status: 401 }
      );
    }

    // Get the appointment with tasks and moving partner data
    const appointment = await prisma.appointment.findUnique({
      where: { id: tokenResult.appointmentId },
      include: {
        movingPartner: true,
        onfleetTasks: {
          orderBy: {
            unitNumber: 'asc'
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Invalid or expired tracking link' }, 
        { status: 401 }
      );
    }

    // Verify latest token for webhook data
    const jwt = require('jsonwebtoken');
    const latestToken = appointment?.trackingToken;
    const decodedLatest = latestToken ? 
      jwt.verify(latestToken, process.env.JWT_SECRET || 'fallback-secret') as DecodedTrackingToken : 
      tokenResult as any; // Use the verified token as fallback

    // Group tasks by step number and unit number
    const taskIds: TrackingTaskIds = {
      pickup: appointment.onfleetTasks.filter(t => t.stepNumber === 1).map(t => t.shortId),
      customer: appointment.onfleetTasks.filter(t => t.stepNumber === 2).map(t => t.shortId),
      dropoff: appointment.onfleetTasks.filter(t => t.stepNumber === 3).map(t => t.shortId),
      admin: appointment.onfleetTasks.filter(t => t.stepNumber === 4).map(t => t.shortId)
    };

    // Format the data for the tracking component using parallel processing
    const deliveryUnits = await Promise.all(taskIds.customer.map(async (taskId, index) => {
      // Fetch tasks specific to this delivery unit
      const unitTasks = appointment.onfleetTasks.filter(t => t.unitNumber === index + 1);
      
      // Fetch all unit tasks from Onfleet API in parallel
      const [unitPickupTask, unitCustomerTask, unitDropoffTask, unitAdminTask] = await Promise.all([
        fetchTaskByShortId(unitTasks.find(t => t.stepNumber === 1)?.shortId ?? ''),
        fetchTaskByShortId(unitTasks.find(t => t.stepNumber === 2)?.shortId ?? ''),
        fetchTaskByShortId(unitTasks.find(t => t.stepNumber === 3)?.shortId ?? ''),
        fetchTaskByShortId(unitTasks.find(t => t.stepNumber === 4)?.shortId ?? '')
      ]);

      // Determine step statuses using centralized business logic
      const unitStepStatuses = determineStepStatuses(
        unitPickupTask,
        unitCustomerTask,
        unitDropoffTask,
        unitAdminTask,
        tokenResult as any, // Decoder token from verification
        decodedLatest,
        taskIds,
        index + 1,
        unitTasks,
        appointment
      );

      // Determine provider name (first unit uses moving partner, others use Boombox Driver)
      const providerName = index === 0 ? 
        appointment.movingPartner?.name || 'Boombox Driver' : 
        'Boombox Driver';

      return {
        id: taskId,
        status: unitDropoffTask?.state === 3 ? 'complete' : 
                unitPickupTask?.state === 2 || unitPickupTask?.state === 3 ? 'in_transit' : 'pending',
        unitNumber: index + 1,
        totalUnits: taskIds.customer.length,
        provider: providerName,
        steps: [
          {
            status: unitStepStatuses[0].status,
            title: getStepTitle(0, index, appointment, providerName),
            timestamp: unitStepStatuses[0].timestamp,
          },
          {
            status: unitStepStatuses[1].status,
            title: getStepTitle(1, index, appointment, providerName),
            timestamp: unitStepStatuses[1].timestamp,
            action: {
              label: 'Track location',
              trackingUrl: unitCustomerTask?.trackingURL,
            }
          },
          {
            status: unitStepStatuses[2].status,
            title: getStepTitle(2, index, appointment, providerName),
            timestamp: unitStepStatuses[2].timestamp,
            action: unitStepStatuses[2].action,
          },
          {
            status: unitStepStatuses[3].status,
            title: getStepTitle(3, index, appointment, providerName),
            timestamp: unitStepStatuses[3].timestamp,
            action: {
              label: 'View receipt',
              url: appointment.invoiceUrl,
            },
            secondaryAction: {
              label: 'Share feedback',
              url: `/feedback/${latestToken}`,
            }
          },
          // Conditionally add dropoff step (exclude for "End Storage Term" appointments except first unit)
          ...(!(appointment.appointmentType === 'End Storage Term' && index !== 0) ? [{
            status: unitStepStatuses[4].status,
            title: getStepTitle(4, index, appointment, providerName),
            timestamp: unitStepStatuses[4].timestamp,
          }] : [])
        ]
      };
    }));

    // Get location coordinates using centralized geocoding service
    const coordinates = await geocodeAddress(appointment.address);
    
    // Prepare formatted response data
    const formattedData: TrackingVerifyResponse = {
      appointmentDate: appointment.date,
      appointmentType: appointment.appointmentType,
      deliveryUnits,
      location: {
        coordinates: coordinates ? 
          { lat: coordinates[1], lng: coordinates[0] } : // Convert [lng, lat] to {lat, lng}
          { lat: 37.7749, lng: -122.4194 } // Default to SF coordinates
      }
    };

    // Validate response data before sending
    const responseValidation = TrackingVerifyResponseSchema.safeParse(formattedData);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      return NextResponse.json(
        { error: 'Failed to format tracking data' },
        { status: 500 }
      );
    }

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Tracking verify route error:', error);
    return NextResponse.json(
      { error: 'Verification failed' }, 
      { status: 500 }
    );
  }
}