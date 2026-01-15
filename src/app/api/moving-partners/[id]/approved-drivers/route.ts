/**
 * @fileoverview API endpoint to fetch approved drivers for a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/approved-drivers/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all approved drivers associated with a specific moving partner.
 * Validates partner existence and returns driver details with approval status.
 * Optionally checks driver availability for a specific appointment time.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner driver management interface
 * - Partner dashboard driver listings
 * - Approved driver verification systems
 * - Driver assignment workflows
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Validates moving partner existence before query
 * - Filters for approved drivers only (isApproved: true)
 * - Includes complete driver information in response
 * - Returns structured success/error responses
 * - Optionally accepts appointmentDate and appointmentTime query params
 *   to check driver availability (3-hour window: 1hr before + 1hr work + 1hr after)
 * 
 * @refactor Fixed parameter extraction to use proper Next.js params
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { subHours, addHours, isSameDay, format } from 'date-fns';

/**
 * Check if two time windows overlap
 * Window 1: [start1, end1]
 * Window 2: [start2, end2]
 */
function doWindowsOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
}

/**
 * Calculate the 3-hour blocked window for an appointment
 * 1 hour before (travel) + 1 hour work + 1 hour after (return)
 */
function getAppointmentBlockedWindow(appointmentTime: Date): { start: Date; end: Date } {
    return {
        start: subHours(appointmentTime, 1),  // 1 hour before for travel
        end: addHours(appointmentTime, 2),    // 1 hour work + 1 hour return
    };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const moverId = parseInt((await params).id);

        if (!moverId || isNaN(moverId)) {
            return NextResponse.json(
                { success: false, error: 'Mover ID is required' },
                { status: 400 }
            );
        }

        // Parse optional query parameters for availability checking
        const { searchParams } = new URL(request.url);
        const appointmentDateParam = searchParams.get('appointmentDate');
        const appointmentTimeParam = searchParams.get('appointmentTime');

        // Check if the mover exists
        const mover = await prisma.movingPartner.findUnique({
            where: { id: moverId }
        });

        if (!mover) {
            return NextResponse.json(
                { success: false, error: 'Mover not found' },
                { status: 404 }
            );
        }

        // Find approved drivers linked to the mover
        const approvedDrivers = await prisma.movingPartnerDriver.findMany({
            where: {
                movingPartnerId: moverId,
                driver: {
                    isApproved: true
                }
            },
            include: {
                driver: true
            }
        });

        // If no date/time provided, return drivers without availability info
        if (!appointmentDateParam || !appointmentTimeParam) {
            return NextResponse.json(
                { success: true, approvedDrivers },
                { status: 200 }
            );
        }

        // Parse the target appointment date and time
        const targetDate = new Date(appointmentDateParam);
        const targetTime = new Date(appointmentTimeParam);

        if (isNaN(targetDate.getTime()) || isNaN(targetTime.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid appointment date or time format' },
                { status: 400 }
            );
        }

        // Calculate the blocked window for the target appointment
        const targetWindow = getAppointmentBlockedWindow(targetTime);

        // Check each driver for conflicts
        const driversWithAvailability = await Promise.all(
            approvedDrivers.map(async (mpDriver) => {
                const driver = mpDriver.driver;

                // Find all tasks assigned to this driver on the same day
                const conflictingTasks = await prisma.onfleetTask.findMany({
                    where: {
                        driverId: driver.id,
                        appointment: {
                            date: {
                                gte: new Date(targetDate.toDateString()),
                                lt: new Date(new Date(targetDate).setDate(targetDate.getDate() + 1)),
                            },
                            status: {
                                notIn: ['Cancelled', 'Completed'],
                            },
                        },
                    },
                    include: {
                        appointment: true,
                    },
                });

                // Check if any existing task's window overlaps with the target window
                let conflictingTask = null;
                for (const task of conflictingTasks) {
                    const existingWindow = getAppointmentBlockedWindow(new Date(task.appointment.time));
                    if (doWindowsOverlap(targetWindow.start, targetWindow.end, existingWindow.start, existingWindow.end)) {
                        conflictingTask = task;
                        break;
                    }
                }

                const isAvailable = !conflictingTask;
                const conflictReason = conflictingTask
                    ? `Busy: ${conflictingTask.appointment.appointmentType} at ${format(new Date(conflictingTask.appointment.time), 'h:mm a')}`
                    : undefined;

                return {
                    ...mpDriver,
                    isAvailable,
                    conflictReason,
                };
            })
        );

        return NextResponse.json(
            { success: true, approvedDrivers: driversWithAvailability },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching approved drivers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch approved drivers' },
            { status: 500 }
        );
    }
} 