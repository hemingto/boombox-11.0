/**
 * @fileoverview Customer Contact Info API - GET/PATCH customer contact information and storage units
 * @source boombox-10.0/src/app/api/users/[id]/contact-info/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves customer contact information with storage unit details including padlock combos.
 * PATCH endpoint that updates customer contact information with phone number validation and storage unit padlock updates.
 * Handles phone number normalization, duplicate checking, and verification status management.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Customer account settings interface
 * - Customer contact information management
 * - Storage unit padlock combo management
 * - Phone number verification workflows
 * 
 * INTEGRATION NOTES:
 * - Phone number validation and E.164 formatting (+1 prefix)
 * - Duplicate phone number prevention across all customers
 * - Automatic phone verification reset when number changes  
 * - Storage unit padlock combo updates via storage unit number matching
 * - Transactional updates for data consistency
 *
 * @refactor Migrated from /api/users/[id]/contact-info/ to /api/customers/[id]/contact-info/ structure
 * @refactor Extracted contact info logic to customerUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { prisma } from '@/lib/database/prismaClient';
import { NextResponse, NextRequest } from 'next/server';
import { CustomerContactInfoRequestSchema, CustomerContactInfoUpdateRequestSchema } from '@/lib/validations/api.validations';
import { getUserContactInfo, updateUserContactInfo } from '@/lib/utils/customerUtils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Parse and validate the customer ID
    const rawParams = await params;
    const validationResult = CustomerContactInfoRequestSchema.safeParse({
      id: rawParams.id
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid customer ID', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const customerId = typeof validationResult.data.id === 'string' 
      ? parseInt(validationResult.data.id, 10) 
      : validationResult.data.id;

    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID format' }, { status: 400 });
    }

    // Get customer contact info using centralized utility
    const customerContactInfo = await getUserContactInfo(customerId);

    return NextResponse.json(customerContactInfo);
  } catch (error) {
    console.error('Error fetching customer contact info:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch customer data.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Parse and validate the customer ID
    const rawParams = await params;
    const customerId = parseInt(rawParams.id, 10);

    if (isNaN(customerId)) {
      return NextResponse.json({ message: 'Invalid customer ID' }, { status: 400 });
    }

    const updates = await request.json();

    // Validate request data
    const validationResult = CustomerContactInfoUpdateRequestSchema.safeParse({
      id: customerId,
      ...updates
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Update customer contact info using centralized utility
    const updatedCustomer = await updateUserContactInfo(customerId, updates);

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
      }
      if (error.message === 'Invalid phone number format.') {
        return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
      }
      if (error.message === 'This phone number is already in use. Please use a different phone number.') {
        return NextResponse.json(
          { message: 'This phone number is already in use. Please use a different phone number.' },
          { status: 409 }
        );
      }
      if (error.message === 'Invalid storage unit data.') {
        return NextResponse.json(
          { error: 'Invalid storage unit data.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json({ message: 'Failed to update customer data' }, { status: 500 });
  }
}