/**
 * @fileoverview Email template for notifying moving partners about new job assignments
 * @source boombox-10.0/src/app/api/driver-assign/route.ts (notifyMovingPartner function)
 * @refactor Extracted into template-based system with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

/**
 * Email sent to moving partners when a new job is assigned
 */
export const movingPartnerNewJobEmail: MessageTemplate = {
  subject: 'New Boombox Job - ${appointmentId}',
  text: `New Job Assignment from Boombox Storage

Hello \${movingPartnerName},

\${emailMessageBody}

Customer Information:
- Name: \${customerName}
- Email: \${customerEmail}
- Phone: \${customerPhone}

Appointment Details:
- Appointment ID: \${appointmentId}
- Job Code: \${jobCode}
- Type: \${appointmentType}
- Date: \${appointmentDate}
- Time: \${appointmentTime}
- Address: \${address}, \${zipcode}
- Number of Units: \${numberOfUnits}
- Plan: \${planType}

\${driverAssignmentInfo}

Thank you,
The Boombox Team`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>New Job Assignment from Boombox Storage</h2>
      <p>Hello \${movingPartnerName},</p>
      <p>\${emailMessageBody}</p>
      <h3>Customer Information:</h3>
      <ul>
        <li><strong>Name:</strong> \${customerName}</li>
        <li><strong>Email:</strong> \${customerEmail}</li>
        <li><strong>Phone:</strong> \${customerPhone}</li>
      </ul>
      <h3>Appointment Details:</h3>
      <ul>
        <li><strong>Appointment ID:</strong> \${appointmentId}</li>
        <li><strong>Job Code:</strong> \${jobCode}</li>
        <li><strong>Type:</strong> \${appointmentType}</li>
        <li><strong>Date:</strong> \${appointmentDate}</li>
        <li><strong>Time:</strong> \${appointmentTime}</li>
        <li><strong>Address:</strong> \${address}, \${zipcode}</li>
        <li><strong>Number of Units:</strong> \${numberOfUnits}</li>
        <li><strong>Plan:</strong> \${planType}</li>
      </ul>
      \${driverAssignmentHtml}
      <p>Thank you,<br>The Boombox Team</p>
    </div>
  `,
  requiredVariables: [
    'movingPartnerName',
    'emailMessageBody',
    'customerName',
    'customerEmail',
    'customerPhone',
    'appointmentId',
    'jobCode',
    'appointmentType',
    'appointmentDate',
    'appointmentTime',
    'address',
    'zipcode',
    'numberOfUnits',
    'planType',
    'driverAssignmentInfo',
    'driverAssignmentHtml',
  ],
  channel: 'email',
  domain: 'appointment',
  description: 'Email sent to moving partners when a new job is assigned',
};
