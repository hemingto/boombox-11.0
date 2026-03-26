import { NextResponse } from 'next/server';
import { z } from 'zod';
// eslint-disable-next-line no-restricted-imports -- haulingPartnerUtils uses Cloudinary/prisma (server-only), not re-exported from barrel
import {
  checkHaulerExists,
  createHauler,
  createDefaultHaulerAvailability,
} from '@/lib/utils/haulingPartnerUtils';

const CreateHaulerRequestSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  website: z.string().url('Valid website URL is required'),
  employeeCount: z.number().int().positive(),
  createDefaultAvailability: z.boolean().optional().default(false),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validationResult = CreateHaulerRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues.map(i => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const {
      companyName,
      email,
      phoneNumber,
      website,
      employeeCount,
      createDefaultAvailability,
    } = validationResult.data;

    const existingHauler = await checkHaulerExists(email, phoneNumber);
    if (existingHauler) {
      if (existingHauler.email === email) {
        return NextResponse.json(
          {
            success: false,
            error: 'A hauling partner with this email already exists',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'A hauling partner with this phone number already exists',
        },
        { status: 409 }
      );
    }

    const hauler = await createHauler({
      companyName,
      email,
      phoneNumber,
      website,
      employeeCount,
    });

    if (createDefaultAvailability) {
      await createDefaultHaulerAvailability(hauler.id);
    }

    return NextResponse.json(
      {
        success: true,
        hauler: {
          id: hauler.id,
          name: hauler.name,
          email: hauler.email,
          phoneNumber: hauler.phoneNumber || '',
          website: hauler.website || '',
          isApproved: false,
          numberOfEmployees: Number(hauler.numberOfEmployees) || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API/hauling-partners/list] Error creating hauler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create hauling partner company' },
      { status: 500 }
    );
  }
}
