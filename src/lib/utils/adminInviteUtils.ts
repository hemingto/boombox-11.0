/**
 * @fileoverview Admin invitation utility functions
 * @source boombox-10.0/src/app/api/admin/invites/route.ts (extracted inline functions)
 * @refactor Extracted admin invitation logic into reusable utility functions
 */

import { prisma } from '@/lib/database/prismaClient';
import crypto from 'crypto';
import { AdminRole } from '@prisma/client';

/**
 * Validate admin role is valid for invitation
 */
export function isValidAdminRole(role: string): role is AdminRole {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

/**
 * Generate secure random token for admin invitations
 * @returns 64-character hex token (256 bits of entropy)
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate expiration date for admin invitations
 * @param daysFromNow - Number of days from current time (default: 15)
 * @returns Date object representing expiration time
 */
export function calculateInviteExpiration(daysFromNow: number = 15): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

/**
 * Check if admin already exists with given email
 * @param email - Email address to check
 * @returns Promise<boolean> - True if admin exists, false otherwise
 */
export async function checkAdminExists(email: string): Promise<boolean> {
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });
  return !!existingAdmin;
}

/**
 * Check if active invitation already exists for email
 * @param email - Email address to check
 * @returns Promise<boolean> - True if active invite exists, false otherwise
 */
export async function checkActiveInviteExists(email: string): Promise<boolean> {
  const existingInvite = await prisma.adminInvite.findFirst({
    where: {
      email,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
  return !!existingInvite;
}

/**
 * Create admin invitation record in database
 * @param data - Invitation data
 * @returns Promise<AdminInvite> - Created invitation record
 */
export async function createAdminInvitation(data: {
  email: string;
  token: string;
  role: AdminRole;
  expiresAt: Date;
  invitedById: number;
}) {
  return await prisma.adminInvite.create({
    data,
  });
}

/**
 * Delete admin invitation by ID (used for cleanup on email failure)
 * @param inviteId - ID of invitation to delete
 * @returns Promise<void>
 */
export async function deleteAdminInvitation(inviteId: number): Promise<void> {
  await prisma.adminInvite.delete({
    where: { id: inviteId },
  });
}

/**
 * Format role for display in emails and UI
 * @param role - AdminRole enum value
 * @returns Formatted role string for display
 */
export function formatRoleForDisplay(role: AdminRole): string {
  return role === 'SUPERADMIN' ? 'a Super Admin' : 'an Admin';
}

/**
 * Generate invitation link for admin signup
 * @param token - Invitation token
 * @returns Full URL for admin signup with token
 */
export function generateInvitationLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/admin/signup?token=${token}`;
}