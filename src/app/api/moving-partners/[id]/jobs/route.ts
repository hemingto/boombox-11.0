/**
 * @fileoverview Moving Partner Jobs History API - GET completed jobs for a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/jobs/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves completed appointments/jobs for a specific moving partner.
 * Returns formatted job history with customer info, driver info, storage units, and feedback.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Moving partner dashboard job history component
 * - Moving partner performance analytics
 * 
 * INTEGRATION NOTES:
 * - Uses complex Prisma query with multiple relations (appointments, users, drivers, feedback, storage units)
 * - Preserves exact data transformation logic for frontend compatibility
 * - Returns jobs in reverse chronological order (most recent first)
 *
 * @refactor Migrated from /api/movers/[moverId]/ to /api/moving-partners/[id]/ structure
 * @refactor Extracted job query logic to movingPartnerUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextResponse, NextRequest } from 'next/server';
import { MovingPartnerJobsRequestSchema } from '@/lib/validations/api.validations';
import { getMovingPartnerJobs } from '@/lib/utils/movingPartnerUtils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Parse and validate the moving partner ID
        const rawParams = await params;
        const validationResult = MovingPartnerJobsRequestSchema.safeParse({
            id: rawParams.id
        });

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid moving partner ID' },
                { status: 400 }
            );
        }

        const movingPartnerId = typeof validationResult.data.id === 'string' 
            ? parseInt(validationResult.data.id, 10) 
            : validationResult.data.id;

        if (isNaN(movingPartnerId)) {
            return NextResponse.json(
                { error: 'Invalid moving partner ID format' },
                { status: 400 }
            );
        }

        // Get completed jobs using centralized utility
        const formattedAppointments = await getMovingPartnerJobs(movingPartnerId);

        return NextResponse.json(formattedAppointments);
    } catch (error) {
        console.error('Error fetching moving partner jobs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}