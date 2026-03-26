import { MessageTemplate } from '@/lib/messaging/types';

export const haulerApprovalEmail: MessageTemplate = {
  channel: 'email',
  domain: 'auth',
  subject: 'Your Boombox Hauling Partner Account is Now Active!',
  text: `Congratulations, \${companyName}!

Great news - your Boombox hauling partner account is now fully active!

You can now start accepting haul jobs and transporting storage units between our warehouse locations.

What's Next:
- Log in to your Boombox hauler dashboard
- Review and accept incoming haul job requests
- Manage your drivers and vehicles
- Set your route pricing
- Track your earnings and performance

Your Account Details:
- Company Name: \${companyName}
- Contact Email: \${email}

If you have any questions about managing haul jobs or need help with the platform, don't hesitate to reach out to our partner support team.

Welcome to the Boombox hauling partner network!

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
          Great news - your Boombox hauling partner account is now <strong style="color: #059669;">fully active</strong>!
        </p>
        
        <p style="color: #374151; font-size: 16px;">
          You can now start accepting haul jobs and transporting storage units between our warehouse locations.
        </p>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4F46E5;">
          <h3 style="color: #1f2937; margin-top: 0;">What's Next:</h3>
          <ul style="color: #374151; padding-left: 20px;">
            <li>Log in to your Boombox hauler dashboard</li>
            <li>Review and accept incoming haul job requests</li>
            <li>Manage your drivers and vehicles</li>
            <li>Set your route pricing</li>
            <li>Track your earnings and performance</li>
          </ul>
        </div>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Your Account Details:</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Company Name:</strong> \${companyName}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Contact Email:</strong> \${email}</p>
        </div>
        
        <p style="color: #374151; font-size: 16px;">
          If you have any questions about managing haul jobs or need help with the platform, don't hesitate to reach out to our partner support team.
        </p>
        
        <p style="color: #374151; font-size: 16px;">
          <strong>Welcome to the Boombox hauling partner network!</strong>
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
  optionalVariables: [],
  description:
    'Email sent to hauling partners when their account is approved and activated',
};
