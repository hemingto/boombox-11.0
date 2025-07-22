/**
 * @fileoverview Welcome email template for new customer appointment booking
 * @source boombox-10.0/src/app/api/submitQuote/route.ts (sendWelcomeEmail function)
 * @refactor Extracted inline email content into centralized template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const welcomeEmailNewCustomer: MessageTemplate = {
  channel: 'email',
  domain: 'booking',
  subject: 'Welcome to Boombox Storage!',
  text: `Welcome to Boombox Storage, \${firstName}!

Thank you for signing up and scheduling your appointment with us.

Your Appointment Details:
- Type: \${appointmentType}
- Date: \${appointmentDate}
- Time: \${appointmentTime}
- Address: \${address}, \${zipcode}
- Number of Units: \${numberOfUnits}
- Plan: \${planType}

We're excited to help you with your storage needs!

If you have any questions, feel free to contact us.

Sincerely,
The Boombox Team`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to Boombox Storage, \${firstName}!</h2>
      <p>Thank you for signing up and scheduling your appointment with us.</p>
      <h3>Your Appointment Details:</h3>
      <ul>
        <li><strong>Type:</strong> \${appointmentType}</li>
        <li><strong>Date:</strong> \${appointmentDate}</li>
        <li><strong>Time:</strong> \${appointmentTime}</li>
        <li><strong>Address:</strong> \${address}, \${zipcode}</li>
        <li><strong>Number of Units:</strong> \${numberOfUnits}</li>
        <li><strong>Plan:</strong> \${planType}</li>
      </ul>
      <p>We're excited to help you with your storage needs!</p>
      <p>If you have any questions, feel free to contact us.</p>
      <p>Sincerely,<br>The Boombox Team</p>
    </div>
  `,
  requiredVariables: [
    'firstName',
    'appointmentType',
    'appointmentDate',
    'appointmentTime',
    'address',
    'zipcode',
    'numberOfUnits',
    'planType'
  ],
  description: 'Welcome email sent to new customers after appointment booking'
}; 