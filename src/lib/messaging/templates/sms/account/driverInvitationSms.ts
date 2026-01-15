/**
 * @fileoverview SMS template for driver invitations
 * @source New template for boombox-11.0 driver invitation system
 * 
 * Sent when a moving partner invites a driver to join their team via SMS.
 * Contains invite link for the driver to complete their profile.
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverInvitationSms: MessageTemplate = {
  text: `You've been invited to join \${movingPartnerName} as a driver on Boombox! Complete your profile and start accepting jobs here: \${inviteLink} This invite expires in 15 days.`,
  requiredVariables: ['movingPartnerName', 'inviteLink'],
  channel: 'sms',
  domain: 'auth',
  description: 'SMS sent to drivers when they are invited to join a moving partner'
};

