/**
 * @fileoverview Driver account approval email template
 * @source New template for boombox-11.0 approval notification system
 * 
 * Sent when an admin approves a driver's account, notifying them
 * that they can now accept jobs through the platform.
 * Customized based on whether driver is linked to a moving partner.
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverApprovalEmail: MessageTemplate = {
  channel: 'email',
  domain: 'auth',
  subject: 'Your Boombox Driver Account Has Been Approved!',
  text: `Congratulations, \${firstName}!

Great news - your Boombox driver account has been approved!

\${movingPartnerName ? 'You can now start driving for ' + movingPartnerName + ' on Boombox.' : "You're now ready to start accepting jobs and earning money with Boombox."}

What's Next:
- Open the Boombox app to view available jobs
- Set your availability in your account settings
- Accept jobs that fit your schedule
- Start earning!

Your Account Details:
- Name: \${firstName} \${lastName}
- Services: \${services}
\${movingPartnerName ? '- Moving Partner: ' + movingPartnerName : ''}

If you have any questions about getting started, don't hesitate to reach out to our support team.

Welcome to the Boombox team!

Best regards,
The Boombox Team`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Boombox</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2 style="color: #1f2937;">Congratulations, \${firstName}!</h2>
        
        <p style="color: #374151; font-size: 16px;">
          Great news - your Boombox driver account has been <strong style="color: #059669;">approved</strong>!
        </p>
        
        <p style="color: #374151; font-size: 16px;">
          \${movingPartnerName ? 
            'You can now start driving for <strong>' + movingPartnerName + '</strong> on Boombox.' : 
            "You're now ready to start accepting jobs and earning money with Boombox."}
        </p>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4F46E5;">
          <h3 style="color: #1f2937; margin-top: 0;">What's Next:</h3>
          <ul style="color: #374151; padding-left: 20px;">
            <li>Open the Boombox app to view available jobs</li>
            <li>Set your availability in your account settings</li>
            <li>Accept jobs that fit your schedule</li>
            <li>Start earning!</li>
          </ul>
        </div>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Your Account Details:</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Name:</strong> \${firstName} \${lastName}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Services:</strong> \${services}</p>
          \${movingPartnerName ? '<p style="color: #374151; margin: 5px 0;"><strong>Moving Partner:</strong> ' + movingPartnerName + '</p>' : ''}
        </div>
        
        <p style="color: #374151; font-size: 16px;">
          If you have any questions about getting started, don't hesitate to reach out to our support team.
        </p>
        
        <p style="color: #374151; font-size: 16px;">
          <strong>Welcome to the Boombox team!</strong>
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
  requiredVariables: ['firstName', 'lastName'],
  optionalVariables: ['services', 'movingPartnerName'],
  description: 'Email sent to drivers when their account is approved by admin'
};

