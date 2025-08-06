/**
 * @fileoverview Admin invitation creation endpoint
 * @source boombox-10.0/src/app/api/admin/invites/route.ts
 * @refactor PHASE 4 - Admin Management Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates and sends admin invitations with token validation.
 * Validates SUPERADMIN permissions, checks for duplicate admins/invites, generates
 * secure tokens, and sends invitation emails with proper error handling.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin dashboard invitation management interface
 * - SUPERADMIN user management workflows
 * - Admin onboarding and team expansion processes
 * - Admin role assignment and permission management
 * 
 * INTEGRATION NOTES:
 * - Requires SUPERADMIN authentication (NextAuth session validation)
 * - Generates cryptographically secure 256-bit invitation tokens
 * - Creates AdminInvite records with 15-day expiration
 * - Sends invitation emails via SendGrid with template system
 * - Implements proper database transaction rollback on email failures
 * - Validates against duplicate admins and active invitations
 * 
 * BUSINESS LOGIC:
 * - Only SUPERADMIN users can send admin invitations
 * - Supports both ADMIN and SUPERADMIN role invitations
 * - Prevents duplicate invitations to existing admins
 * - Prevents multiple active invitations to same email
 * - Automatically cleans up failed invitations (database consistency)
 * - Uses centralized email templates and utility functions
 * 
 * ERROR HANDLING:
 * - 401: Unauthorized (not SUPERADMIN or no session)
 * - 400: Validation errors (missing fields, invalid role, duplicates)
 * - 500: Internal server errors (database, email service failures)
 * 
 * @refactor Migrated with centralized utilities, email templates, and validation schemas
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/database/prismaClient';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { MessageService } from '@/lib/messaging/MessageService';
import { adminInvitationEmail } from '@/lib/messaging/templates/email/auth';
import { 
  CreateAdminInviteRequestSchema,
  CreateAdminInviteResponseSchema,
  type CreateAdminInviteRequest,
  type CreateAdminInviteResponse
} from '@/lib/validations/api.validations';
import {
  isValidAdminRole,
  generateInviteToken,
  calculateInviteExpiration,
  checkAdminExists,
  checkActiveInviteExists,
  createAdminInvitation,
  deleteAdminInvitation,
  formatRoleForDisplay,
  generateInvitationLink
} from '@/lib/utils/adminInviteUtils';

const messageService = new MessageService();

/**
 * POST endpoint: Create and send admin invitation
 * @source boombox-10.0/src/app/api/admin/invites/route.ts (entire endpoint)
 */
export async function POST(request: Request): Promise<NextResponse<CreateAdminInviteResponse>> {
  try {
    // Validate admin session and SUPERADMIN role
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized - Only SUPERADMIN can send invites' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateAdminInviteRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 }
      );
    }

    const { email, role }: CreateAdminInviteRequest = validationResult.data;

    // Additional role validation (TypeScript safety)
    if (!isValidAdminRole(role)) {
      return NextResponse.json(
        { message: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    if (await checkAdminExists(email)) {
      return NextResponse.json(
        { message: 'An admin with this email already exists' },
        { status: 400 }
      );
    }

    // Check if there's an existing active invite
    if (await checkActiveInviteExists(email)) {
      return NextResponse.json(
        { message: 'An active invite already exists for this email' },
        { status: 400 }
      );
    }

    // Generate invitation data
    const token = generateInviteToken();
    const expiresAt = calculateInviteExpiration(15); // 15 days
    const inviteLink = generateInvitationLink(token);
    const roleDisplay = formatRoleForDisplay(role);

    // Create invite record in database
    const invite = await createAdminInvitation({
      email,
      token,
      role,
      expiresAt,
      invitedById: parseInt(String(session.user.id), 10),
    });

    // Send invitation email using centralized template system
    try {
      await messageService.sendEmail(
        email,
        adminInvitationEmail,
        {
          roleDisplay,
          inviteLink,
        }
      );
    } catch (error) {
      console.error('Error sending invitation email:', error);
      
      // Clean up invite record if email fails (maintain data consistency)
      try {
        await deleteAdminInvitation(invite.id);
      } catch (cleanupError) {
        console.error('Failed to clean up invite record:', cleanupError);
      }
      
      return NextResponse.json(
        { message: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    // Validate response format
    const response: CreateAdminInviteResponse = {
      message: 'Invitation sent successfully',
    };

    const responseValidation = CreateAdminInviteResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(responseValidation.data);
  } catch (error) {
    console.error('Error in admin invite endpoint:', error);
    return NextResponse.json(
      { message: 'Failed to send invite' },
      { status: 500 }
    );
  }
}