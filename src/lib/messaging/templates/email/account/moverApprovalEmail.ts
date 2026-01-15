/**
 * @fileoverview Moving partner account approval email template
 * @source New template for boombox-11.0 approval notification system
 * 
 * Sent when a moving partner's account is fully activated (first driver approved).
 * Notifies them that they can now accept jobs through the platform.
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const moverApprovalEmail: MessageTemplate = {
  channel: 'email',
  domain: 'auth',
  subject: 'Your Boombox Moving Partner Account is Now Active!',
  text: `Congratulations, \${companyName}!

Great news - your Boombox moving partner account is now fully active!

\${driverName} has been approved and added to your team. You can now start accepting jobs and growing your business with Boombox.

What's Next:
- Log in to your Boombox dashboard
- Review and accept incoming job requests
- Manage your drivers and vehicles
- Track your earnings and performance
- Start earning!

Your Account Details:
- Company Name: \${companyName}
- Contact Email: \${email}

If you have any questions about managing jobs or need help with the platform, don't hesitate to reach out to our partner support team.

Welcome to the Boombox partner network!

Best regards,
The Boombox Team`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Boombox</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2 style="color: #1f2937;">Congratulations, \${companyName}!</h2>
        
        <p style="color: #374151; font-size: 16px;">
          Great news - your Boombox moving partner account is now <strong style="color: #059669;">fully active</strong>!
        </p>
        
        <p style="color: #374151; font-size: 16px;">
          <strong>\${driverName}</strong> has been approved and added to your team. You can now start accepting jobs and growing your business with Boombox.
        </p>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4F46E5;">
          <h3 style="color: #1f2937; margin-top: 0;">What's Next:</h3>
          <ul style="color: #374151; padding-left: 20px;">
            <li>Log in to your Boombox dashboard</li>
            <li>Review and accept incoming job requests</li>
            <li>Manage your drivers and vehicles</li>
            <li>Track your earnings and performance</li>
            <li>Start earning!</li>
          </ul>
        </div>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Your Account Details:</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Company Name:</strong> \${companyName}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Contact Email:</strong> \${email}</p>
        </div>
        
        <p style="color: #374151; font-size: 16px;">
          If you have any questions about managing jobs or need help with the platform, don't hesitate to reach out to our partner support team.
        </p>
        
        <p style="color: #374151; font-size: 16px;">
          <strong>Welcome to the Boombox partner network!</strong>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          The Boombox Team
        </p>
      </div>
      
      <div style="background-color: #1f2937; padding: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; Boombox Storage. All rights reserved.
        </p>
      </div>
    </div>
  `,
  requiredVariables: ['companyName', 'email'],
  optionalVariables: ['driverName'],
  description: 'Email sent to moving partners when their first driver is approved and account becomes active'
};

