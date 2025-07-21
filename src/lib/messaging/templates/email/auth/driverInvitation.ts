/**
 * @fileoverview Email template for driver invitations
 * @source boombox-10.0/src/app/lib/email.ts (sendDriverInvitationEmail)
 * @refactor Extracted message content into template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverInvitationEmail: MessageTemplate = {
  channel: 'email',
  domain: 'auth',
  subject: "You've been invited to join ${movingPartnerName} on Boombox",
  text: "You've been invited to join ${movingPartnerName} as a driver on Boombox. This invitation will expire in 15 days.\n\nClick the button below to complete your driver profile and start accepting deliveries: ${inviteLink}",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="font-size: 24px; margin-bottom: 20px;">You've been invited to join \${movingPartnerName}</h1>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        You've been invited to join \${movingPartnerName} as a driver on Boombox. This invitation will expire in 15 days.
      </p>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
        Click the button below to complete your driver profile and start accepting jobs:
      </p>
      
      <div style="margin: 30px 0;">
        <a href="\${inviteLink}" 
           style="display: inline-block; padding: 15px 30px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Complete Your Profile
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If the button doesn't work, you can copy and paste this link into your browser:<br>
        <span style="color: #999; word-break: break-all;">\${inviteLink}</span>
      </p>
    </div>
  `,
  requiredVariables: ['movingPartnerName', 'inviteLink'],
};
