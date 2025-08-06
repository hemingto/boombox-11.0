/**
 * @fileoverview Moving partner profile management API endpoint
 * @source boombox-10.0/src/app/api/movers/[moverId]/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 *
 * ROUTE FUNCTIONALITY:
 * GET/PATCH endpoint for moving partner profile management.
 * GET: Retrieves complete moving partner profile with vehicles and approved drivers
 * PATCH: Updates moving partner profile information with validation and type handling
 *
 * USED BY (boombox-10.0 files):
 * - Moving partner profile view/edit components
 * - Partner dashboard profile management
 * - Moving partner onboarding workflow
 * - Admin partner management interface
 *
 * INTEGRATION NOTES:
 * - GET: Returns complete partner profile with vehicle and driver relations 
 * - PATCH: Validates profile updates, handles type conversions for hourlyRate
 * - Handles phone number verification reset when phone number changes
 * - Provides detailed error handling for unique constraint violations
 * - Includes debug logging for partner status and driver count
 *
 * @refactor No logic changes - direct port with updated imports and validation schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  UpdateMovingPartnerProfileRequestSchema,
  MovingPartnerProfileResponseSchema 
} from '@/lib/validations/api.validations';

// GET handler to fetch moving partner profile information
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
    
    // Fetch moving partner from database with all necessary relations
    const movingPartner = await prisma.movingPartner.findUnique({
      where: { id: partnerIdNum },
      include: {
        vehicles: {
          select: {
            id: true,
            isApproved: true
          }
        },
        approvedDrivers: {
          where: {
            isActive: true
          },
          include: {
            driver: {
              select: {
                id: true,
                isApproved: true,
                status: true
              }
            }
          }
        }
      }
    });
    
    if (!movingPartner) {
      return NextResponse.json({ error: 'Moving partner not found' }, { status: 404 });
    }

    // Log the partner's status and approved drivers for debugging
    console.log('Moving Partner Status:', movingPartner.status);
    console.log('Moving Partner isApproved:', movingPartner.isApproved);
    console.log('Approved Drivers:', movingPartner.approvedDrivers);
    console.log('Approved Drivers Count:', movingPartner.approvedDrivers.length);
    
    // Validate response against schema
    const validatedResponse = MovingPartnerProfileResponseSchema.parse(movingPartner);
    
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error fetching moving partner information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moving partner information' },
      { status: 500 }
    );
  }
}

// PATCH handler to update moving partner profile information
export async function PATCH(
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
    const existingPartner = await prisma.movingPartner.findUnique({
      where: { id: partnerIdNum }
    });
    
    if (!existingPartner) {
      return NextResponse.json({ error: 'Moving partner not found' }, { status: 404 });
    }
    
    // Get update data from request body
    const updateData = await request.json();
    
    // Validate request data against schema
    const validationResult = UpdateMovingPartnerProfileRequestSchema.safeParse(updateData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Handle data type conversions
    const processedData: any = {};
    
    // Process each field based on its type in the schema
    if ('name' in validatedData && validatedData.name !== undefined) {
      processedData.name = validatedData.name;
    }
    if ('description' in validatedData && validatedData.description !== undefined) {
      processedData.description = validatedData.description;
    }
    if ('phoneNumber' in validatedData && validatedData.phoneNumber !== undefined) {
      processedData.phoneNumber = validatedData.phoneNumber;
      // If phone number is being updated, set verifiedPhoneNumber to false
      if (validatedData.phoneNumber !== existingPartner.phoneNumber) {
        processedData.verifiedPhoneNumber = false;
      }
    }
    if ('email' in validatedData && validatedData.email !== undefined) {
      processedData.email = validatedData.email;
    }
    if ('hourlyRate' in validatedData && validatedData.hourlyRate !== undefined) {
      // Ensure hourlyRate is properly handled as a number
      processedData.hourlyRate = validatedData.hourlyRate;
    }
    if ('website' in validatedData && validatedData.website !== undefined) {
      processedData.website = validatedData.website;
    }
    
    // Update moving partner in database
    const updatedPartner = await prisma.movingPartner.update({
      where: { id: partnerIdNum },
      data: processedData
    });
    
    return NextResponse.json(updatedPartner);
  } catch (error: any) {
    console.error('Error updating moving partner information:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        { message: `This ${field} is already in use. Please use a different value.` },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update moving partner information' },
      { status: 500 }
    );
  }
}