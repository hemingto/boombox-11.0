/**
 * @fileoverview Verify mover change token API endpoint
 * @source boombox-10.0/src/app/api/customer/verify-mover-change-token/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that validates base64-encoded mover change tokens and returns appointment details.
 * Used to verify customer access to mover change approval interface.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/customer/mover-change/[token]/page.tsx (line 58: validates token and loads appointment data)
 * - Customer mover change workflow for secure token-based access
 * - SMS link validation system for mover change requests
 *
 * INTEGRATION NOTES:
 * - Decodes base64 tokens containing appointment and mover data
 * - Validates appointment exists and mover change request is still pending
 * - Returns detailed appointment and mover information for customer decision
 * - Calculates average ratings for suggested movers from feedback
 *
 * @refactor Moved from /api/customer/ to /api/orders/ structure, extracted token validation to utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  VerifyMoverChangeTokenRequestSchema,
  VerifyMoverChangeTokenResponseSchema 
} from '@/lib/validations/api.validations';
import {
  decodeMoverChangeToken,
  validateMoverChangeTokenData,
  checkMoverChangeRequestStatus
} from '@/lib/utils/moverChangeUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate request parameters
    const parseResult = VerifyMoverChangeTokenRequestSchema.safeParse({ token });
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Token is required', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    // Decode and validate token
    const tokenData = decodeMoverChangeToken(parseResult.data.token);
    const { appointmentId, suggestedMovingPartnerId, originalMovingPartnerId, timestamp } = 
      validateMoverChangeTokenData(tokenData);

    // Get appointment details with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        requestedStorageUnits: {
          include: {
            storageUnit: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Get original mover details
    const originalMover = await prisma.movingPartner.findUnique({
      where: { id: originalMovingPartnerId },
      select: {
        id: true,
        name: true,
        hourlyRate: true
      }
    });

    // Get suggested mover details with average rating
    const suggestedMover = await prisma.movingPartner.findUnique({
      where: { id: suggestedMovingPartnerId },
      include: {
        feedback: {
          select: { rating: true }
        }
      }
    });

    if (!originalMover || !suggestedMover) {
      return NextResponse.json({ error: 'Moving partner not found' }, { status: 404 });
    }

    // Calculate average rating
    const averageRating = suggestedMover.feedback.length > 0 
      ? suggestedMover.feedback.reduce((sum, f) => sum + f.rating, 0) / suggestedMover.feedback.length 
      : 0;

    // Check if appointment still has the mover change request pending
    checkMoverChangeRequestStatus(appointment);

    // Format appointment data for response
    const appointmentData = {
      id: appointment.id,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time.toISOString().split('T')[1].substring(0, 5),
      address: appointment.address,
      appointmentType: appointment.appointmentType,
      loadingHelpPrice: appointment.loadingHelpPrice || 0,
      insuranceCoverage: appointment.insuranceCoverage || 'Standard',
      monthlyStorageRate: appointment.monthlyStorageRate || 0,
      numberOfUnits: appointment.numberOfUnits || 1,
      quotedPrice: appointment.quotedPrice,
      requestedStorageUnits: appointment.requestedStorageUnits,
      originalMover: {
        name: originalMover.name,
        hourlyRate: originalMover.hourlyRate || 0
      },
      suggestedMover: {
        name: suggestedMover.name,
        hourlyRate: suggestedMover.hourlyRate || 0,
        averageRating
      }
    };

    const response = {
      appointmentId,
      suggestedMovingPartnerId,
      originalMovingPartnerId,
      timestamp,
      appointment: appointmentData
    };

    // Validate response structure
    const validatedResponse = VerifyMoverChangeTokenResponseSchema.parse(response);
    
    return NextResponse.json(validatedResponse);

  } catch (error) {
    console.error('Error verifying mover change token:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
} 