/**
 * @fileoverview Moving Partners List API Route - Create new moving partners/movers
 * @source boombox-10.0/src/app/api/movers/route.ts
 * @refactor Migrated to domain-based API structure with centralized utilities
 * 
 * ROUTE: POST /api/moving-partners/list
 * PURPOSE: Create new moving partner companies with optional default availability
 * 
 * BUSINESS LOGIC:
 * - Validates company registration data (name, email, phone, website, employee count)
 * - Checks for duplicate email/phone number conflicts
 * - Creates moving partner record with approval required by default
 * - Optionally creates default availability (9am-5pm, all days blocked for admin setup)
 * 
 * INTEGRATIONS:
 * - Prisma Database: MovingPartner model, MovingPartnerAvailability model
 * 
 * VALIDATION:
 * - Uses CreateMoverRequestSchema for request validation
 * - Phone number normalized to E.164 format for consistency
 * - Website URL validation required
 * 
 * ERROR HANDLING:
 * - 400: Missing required fields
 * - 409: Duplicate email or phone number
 * - 500: Database or server errors
 */

import { NextResponse } from 'next/server';
import { 
  CreateMoverRequestSchema, 
  type CreateMoverRequest,
  type CreateMoverResponse 
} from '@/lib/validations/api.validations';
import { 
  checkMoverExists, 
  createMover, 
  createDefaultMoverAvailability 
} from '@/lib/utils/movingPartnerUtils';

export async function POST(request: Request): Promise<NextResponse<CreateMoverResponse>> {
  try {
    const body = await request.json();
    
    // Validate request data using centralized schema
    const validationResult = CreateMoverRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationResult.error.issues.map(issue => issue.message).join(', ')
        },
        { status: 400 }
      );
    }

    const { companyName, email, phoneNumber, website, employeeCount, createDefaultAvailability } = validationResult.data;

    // Check if email or phone number already exists using centralized utility
    const existingMover = await checkMoverExists(email, phoneNumber);

    if (existingMover) {
      if (existingMover.email === email) {
        return NextResponse.json(
          { success: false, error: 'A mover with this email already exists' },
          { status: 409 }
        );
      }
      if (existingMover.phoneNumber === phoneNumber) {
        return NextResponse.json(
          { success: false, error: 'A mover with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Create new moving partner using centralized utility
    const mover = await createMover({
      companyName,
      email,
      phoneNumber,
      website,
      employeeCount
    });

    // Create default availability if requested using centralized utility
    if (createDefaultAvailability) {
      await createDefaultMoverAvailability(mover.id);
    }

    return NextResponse.json(
      { 
        success: true, 
        mover
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[API/moving-partners/list] Error creating mover:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mover company' },
      { status: 500 }
    );
  }
}