/**
 * @fileoverview Service for managing driver invitations for hauling partners
 * Parallel to driverInvitationService.ts but operates on haulingPartnerDriverInvitation
 * and haulingPartner Prisma models.
 */

'use server';

import { prisma } from '@/lib/database/prismaClient';
import { randomBytes } from 'crypto';
import {
  sendDriverInvitationEmail,
  MessageService,
  driverInvitationSms,
} from '@/lib/messaging';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { revalidatePath } from 'next/cache';
import { config } from '@/lib/config/environment';

function detectContactMethod(contact: string): 'email' | 'phone' {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(contact)) {
    return 'email';
  }
  return 'phone';
}

async function sendInvitationSms(
  phone: string,
  token: string,
  partnerName: string
): Promise<void> {
  const inviteLink = `${config.app.url}/driver-accept-invite?token=${token}`;
  const normalizedPhone = normalizePhoneNumberToE164(phone);

  const result = await MessageService.sendSms(
    normalizedPhone,
    driverInvitationSms,
    {
      movingPartnerName: partnerName,
      inviteLink,
    }
  );

  if (!result.success) {
    console.error('Failed to send hauler driver invitation SMS:', result.error);
    throw new Error(`Failed to send SMS invitation: ${result.error}`);
  }
}

/**
 * Invite a driver to join a hauling partner.
 * Creates a HaulingPartnerDriverInvitation and sends email/SMS.
 */
export async function inviteHaulerDriver(
  haulingPartnerId: number,
  contact: string,
  expiresInDays: number = 15
) {
  if (!contact) {
    throw new Error('Email or phone number is required');
  }

  const contactMethod = detectContactMethod(contact);
  const token = randomBytes(32).toString('hex');

  const invitation = await prisma.haulingPartnerDriverInvitation.create({
    data: {
      token,
      haulingPartnerId,
      email: contact,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    },
  });

  const haulingPartner = await prisma.haulingPartner.findUnique({
    where: { id: haulingPartnerId },
    select: { name: true },
  });

  const partnerName = haulingPartner?.name || 'Boombox Partner';

  if (contactMethod === 'email') {
    await sendDriverInvitationEmail(contact, token, partnerName);
  } else {
    await sendInvitationSms(contact, token, partnerName);
  }

  revalidatePath(`/service-provider/hauler/${haulingPartnerId}/drivers`);

  return invitation;
}

/**
 * Resend a pending hauler driver invitation.
 */
export async function resendHaulerDriverInvite(
  haulingPartnerId: number,
  token: string
) {
  const invitation = await prisma.haulingPartnerDriverInvitation.findFirst({
    where: {
      token,
      haulingPartnerId,
      status: 'pending',
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found or already accepted');
  }

  const haulingPartner = await prisma.haulingPartner.findUnique({
    where: { id: haulingPartnerId },
    select: { name: true },
  });

  const partnerName = haulingPartner?.name || 'Boombox Partner';
  const contactMethod = detectContactMethod(invitation.email);

  if (contactMethod === 'email') {
    await sendDriverInvitationEmail(
      invitation.email,
      invitation.token,
      partnerName
    );
  } else {
    await sendInvitationSms(invitation.email, invitation.token, partnerName);
  }

  revalidatePath(`/service-provider/hauler/${haulingPartnerId}/drivers`);

  return invitation;
}

/**
 * Delete a hauler driver invitation.
 */
export async function deleteHaulerDriverInvite(
  haulingPartnerId: number,
  token: string
) {
  const invitation = await prisma.haulingPartnerDriverInvitation.findFirst({
    where: {
      token,
      haulingPartnerId,
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  await prisma.haulingPartnerDriverInvitation.delete({
    where: {
      id: invitation.id,
    },
  });

  revalidatePath(`/service-provider/hauler/${haulingPartnerId}/drivers`);

  return { success: true };
}
