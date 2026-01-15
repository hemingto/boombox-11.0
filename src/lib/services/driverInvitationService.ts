/**
 * @fileoverview Service for managing driver invitations for moving partners
 * @source boombox-10.0/src/app/api/movers/[moverId]/invite-driver/route.ts
 * @refactor Extracted driver invitation logic into Server Action service for automatic cache invalidation
 * 
 * UPDATES:
 * - Added SMS invitation support via Twilio
 * - Detects contact method (email vs phone) and sends appropriate notification
 * - Uses centralized MessageService for SMS delivery
 */

'use server';

import { prisma } from '@/lib/database/prismaClient';
import { randomBytes } from 'crypto';
import { sendDriverInvitationEmail, MessageService, driverInvitationSms } from '@/lib/messaging';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { revalidatePath } from 'next/cache';
import { config } from '@/lib/config/environment';

export interface DriverInvite {
  /** Contact information (email or phone) */
  email: string;
  status: string;
  createdAt: string;
  token: string;
}

/**
 * Determine if a contact string is an email or phone number
 * @param contact - Email or phone number string
 * @returns 'email' or 'phone'
 */
function detectContactMethod(contact: string): 'email' | 'phone' {
  // Basic email regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(contact)) {
    return 'email';
  }
  return 'phone';
}

/**
 * Send driver invitation via SMS
 * @param phone - Phone number to send invitation to
 * @param token - Invitation token
 * @param movingPartnerName - Name of the moving partner
 */
async function sendDriverInvitationSms(
  phone: string,
  token: string,
  movingPartnerName: string
): Promise<void> {
  const inviteLink = `${config.app.url}/driver-accept-invite?token=${token}`;
  
  // Normalize phone number to E.164 format for Twilio
  const normalizedPhone = normalizePhoneNumberToE164(phone);
  
  console.log('Preparing to send driver invitation SMS:', {
    to: normalizedPhone,
    movingPartnerName,
    appUrl: config.app.url,
  });
  
  const result = await MessageService.sendSms(
    normalizedPhone,
    driverInvitationSms,
    {
      movingPartnerName,
      inviteLink,
    }
  );
  
  if (!result.success) {
    console.error('Failed to send driver invitation SMS:', result.error);
    throw new Error(`Failed to send SMS invitation: ${result.error}`);
  }
  
  console.log('Driver invitation SMS sent successfully!');
}

/**
 * Invite a driver to join a moving partner
 * @param movingPartnerId - The ID of the moving partner
 * @param contact - The email address or phone number of the driver to invite
 * @param expiresInDays - Number of days until the invitation expires (default: 15)
 * @returns The created invitation record
 */
export async function inviteDriver(
  movingPartnerId: number,
  contact: string,
  expiresInDays: number = 15
) {
  if (!contact) {
    throw new Error('Email or phone number is required');
  }

  // Detect if contact is email or phone
  const contactMethod = detectContactMethod(contact);
  
  // Generate a unique token
  const token = randomBytes(32).toString('hex');
  
  // Create the invitation
  // Note: The 'email' field stores both email addresses and phone numbers
  // to maintain backward compatibility with the existing schema
  const invitation = await prisma.driverInvitation.create({
    data: {
      token,
      movingPartnerId,
      email: contact, // Stores email or phone number
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    },
  });
  
  // Get moving partner name for the invitation message
  const movingPartner = await prisma.movingPartner.findUnique({
    where: { id: movingPartnerId },
    select: { name: true },
  });
  
  const movingPartnerName = movingPartner?.name || 'Boombox Partner';
  
  // Send invitation via appropriate channel
  if (contactMethod === 'email') {
    await sendDriverInvitationEmail(contact, token, movingPartnerName);
  } else {
    await sendDriverInvitationSms(contact, token, movingPartnerName);
  }
  
  // Revalidate the drivers page to refresh all data automatically
  revalidatePath(`/service-provider/mover/${movingPartnerId}/drivers`);
  
  return invitation;
}

/**
 * Get all pending driver invitations for a moving partner
 * @param movingPartnerId - The ID of the moving partner
 * @returns Array of pending driver invitations
 */
export async function getDriverInvites(movingPartnerId: number): Promise<DriverInvite[]> {
  const invites = await prisma.driverInvitation.findMany({
    where: {
      movingPartnerId,
      status: 'pending',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      token: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });
  
  return invites.map(invite => ({
    ...invite,
    createdAt: invite.createdAt.toISOString(),
  }));
}

/**
 * Resend a driver invitation
 * @param movingPartnerId - The ID of the moving partner
 * @param token - The invitation token to resend
 */
export async function resendDriverInvite(
  movingPartnerId: number,
  token: string
) {
  // Find the invitation
  const invitation = await prisma.driverInvitation.findFirst({
    where: {
      token,
      movingPartnerId,
      status: 'pending',
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found or already accepted');
  }

  // Get moving partner name for the message
  const movingPartner = await prisma.movingPartner.findUnique({
    where: { id: movingPartnerId },
    select: { name: true },
  });

  const movingPartnerName = movingPartner?.name || 'Boombox Partner';
  
  // Detect contact method and resend via appropriate channel
  const contactMethod = detectContactMethod(invitation.email);
  
  if (contactMethod === 'email') {
    await sendDriverInvitationEmail(
      invitation.email,
      invitation.token,
      movingPartnerName
    );
  } else {
    await sendDriverInvitationSms(
      invitation.email, // Contains phone number
      invitation.token,
      movingPartnerName
    );
  }

  // Revalidate the drivers page
  revalidatePath(`/service-provider/mover/${movingPartnerId}/drivers`);

  return invitation;
}

/**
 * Delete a driver invitation
 * @param movingPartnerId - The ID of the moving partner
 * @param token - The invitation token to delete
 */
export async function deleteDriverInvite(
  movingPartnerId: number,
  token: string
) {
  // Find and delete the invitation
  const invitation = await prisma.driverInvitation.findFirst({
    where: {
      token,
      movingPartnerId,
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  await prisma.driverInvitation.delete({
    where: {
      id: invitation.id,
    },
  });

  // Revalidate the drivers page
  revalidatePath(`/service-provider/mover/${movingPartnerId}/drivers`);

  return { success: true };
}

