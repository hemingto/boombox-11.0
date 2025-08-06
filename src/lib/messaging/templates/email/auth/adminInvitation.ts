/**
 * @fileoverview Email template for admin invitations
 * @source boombox-10.0/src/app/lib/email.ts (sendAdminInvitationEmail)
 * @refactor Extracted message content into template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const adminInvitationEmail: MessageTemplate = {
  channel: 'email',
  domain: 'auth',
  subject: "You've Been Invited to Join as ${roleDisplay}",
  text: "You've been invited to join our platform as ${roleDisplay}. Click this link to sign up: ${inviteLink}\n\nThis invitation expires in 15 days.",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="font-size: 24px; margin-bottom: 20px;">Welcome to Our Platform!</h1>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        You've been invited to join our platform as \${roleDisplay}.
      </p>
      
      <div style="margin: 30px 0;">
        <a href="\${inviteLink}" 
           style="display: inline-block; padding: 15px 30px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Complete Your Registration
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Or copy and paste this link into your browser:<br>
        <span style="color: #999; word-break: break-all;">\${inviteLink}</span>
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This invitation expires in 15 days.
      </p>
    </div>
  `,
  requiredVariables: ['roleDisplay', 'inviteLink'],
};