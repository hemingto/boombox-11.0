/**
 * @fileoverview Moving partner availability management API endpoint
 * @source boombox-10.0/src/app/api/movers/[moverId]/availability/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 *
 * ROUTE FUNCTIONALITY:
 * GET/POST endpoint for moving partner availability management.
 * GET: Retrieves all availability records for a moving partner with custom day ordering
 * POST: Creates or updates availability records with validation for time slots and capacity
 *
 * USED BY (boombox-10.0 files):
 * - Moving partner availability calendar management
 * - Partner dashboard weekly availability settings
 * - Availability scheduling interface
 * - Admin partner availability oversight
 *
 * INTEGRATION NOTES:
 * - GET: Returns availability sorted by custom day order (Monday-Sunday)
 * - POST: Supports both create new and update existing availability records
 * - Validates maxCapacity between 1-10 jobs per time slot
 * - Handles upsert logic: updates existing record for same day or creates new
 * - Default values: isBlocked = false, maxCapacity = 1
 * - Validates moving partner existence before operations
 * - Complex update logic: by ID if provided, otherwise by movingPartnerId + dayOfWeek
 *
 * @refactor Added centralized validation schemas and preserved all business logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  MovingPartnerAvailabilityGetResponseSchema,
  MovingPartnerAvailabilityPostRequestSchema,
  MovingPartnerAvailabilityPostResponseSchema
} from '@/lib/validations/api.validations';

// GET handler to fetch moving partner availability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partnerIdNum = parseInt(id);
    
    if (isNaN(partnerIdNum)) {
      return NextResponse.json({ error: 'Invalid moving partner ID' }, { status: 400 });
    }
    
    // Check if moving partner exists
    const movingPartner = await prisma.movingPartner.findUnique({
      where: { id: partnerIdNum }
    });
    
    if (!movingPartner) {
      return NextResponse.json({ error: 'Moving partner not found' }, { status: 404 });
    }
    
    // Get moving partner's availability
    const availability = await prisma.movingPartnerAvailability.findMany({
      where: { movingPartnerId: partnerIdNum },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isBlocked: true,
        maxCapacity: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Custom day ordering
    const dayOrder: Record<string, number> = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
      'Friday': 5, 'Saturday': 6, 'Sunday': 7
    };

    // Sort the results and format dates
    const sortedAvailability = availability
      .map(record => ({
        ...record,
        createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: record.updatedAt?.toISOString() ?? new Date().toISOString()
      }))
      .sort((a, b) => 
        dayOrder[a.dayOfWeek as keyof typeof dayOrder] - dayOrder[b.dayOfWeek as keyof typeof dayOrder]
      );
    
    const responseData = { success: true, availability: sortedAvailability };
    
    // Validate response against schema
    const validatedResponse = MovingPartnerAvailabilityGetResponseSchema.parse(responseData);
    
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error fetching moving partner availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST handler to create or update moving partner availability
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movingPartnerId = parseInt(id);
    
    if (isNaN(movingPartnerId)) {
      return NextResponse.json({ error: 'Invalid moving partner ID' }, { status: 400 });
    }
    
    const requestData = await request.json();
    
    // Validate request data against schema
    const validationResult = MovingPartnerAvailabilityPostRequestSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }
    
    const { id: recordId, dayOfWeek, startTime, endTime, isBlocked, maxCapacity } = validationResult.data;
    
    // Check if moving partner exists
    const movingPartner = await prisma.movingPartner.findUnique({
      where: { id: movingPartnerId }
    });
    
    if (!movingPartner) {
      return NextResponse.json({ error: 'Moving partner not found' }, { status: 404 });
    }
    
    let availability;
    
    if (recordId) {
      // Update existing record by ID
      availability = await prisma.movingPartnerAvailability.update({
        where: { id: recordId },
        data: {
          startTime,
          endTime,
          isBlocked: isBlocked || false,
          maxCapacity: maxCapacity || 1,
          updatedAt: new Date()
        },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isBlocked: true,
          maxCapacity: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } else {
      // Check if a record for this day already exists
      const existingAvailability = await prisma.movingPartnerAvailability.findFirst({
        where: {
          movingPartnerId,
          dayOfWeek
        }
      });
      
      if (existingAvailability) {
        // Update the existing record
        availability = await prisma.movingPartnerAvailability.update({
          where: { id: existingAvailability.id },
          data: {
            startTime,
            endTime,
            isBlocked: isBlocked || false,
            maxCapacity: maxCapacity || 1,
            updatedAt: new Date()
          },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isBlocked: true,
            maxCapacity: true,
            createdAt: true,
            updatedAt: true
          }
        });
      } else {
        // Create new record
        availability = await prisma.movingPartnerAvailability.create({
          data: {
            movingPartnerId,
            dayOfWeek,
            startTime,
            endTime,
            isBlocked: isBlocked || false,
            maxCapacity: maxCapacity || 1
          },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isBlocked: true,
            maxCapacity: true,
            createdAt: true,
            updatedAt: true
          }
        });
      }
    }
    
    // Format dates for response
    const formattedAvailability = {
      ...availability,
      createdAt: availability.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: availability.updatedAt?.toISOString() ?? new Date().toISOString()
    };
    
    const responseData = {
      success: true,
      availability: formattedAvailability
    };
    
    // Validate response against schema
    const validatedResponse = MovingPartnerAvailabilityPostResponseSchema.parse(responseData);
    
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error saving moving partner availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}