/**
 * @fileoverview Email template for notifying moving partners of appointment time changes
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (inline HTML email generation)
 * @refactor Extracted to centralized template with HTML generation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const movingPartnerTimeChangeNotificationEmail: MessageTemplate = {
  text: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Appointment Time Change - Boombox Storage</h2>
      <p>Hello \${movingPartnerName},</p>
      <p>We wanted to inform you that the appointment time has been changed for one of your assigned jobs.</p>
      
      <h3>Job Details:</h3>
      <ul>
        <li><strong>Customer:</strong> \${customerName}</li>
        <li><strong>Appointment ID:</strong> \${appointmentId}</li>
        <li><strong>Type:</strong> \${appointmentType}</li>
        <li><strong>Address:</strong> \${address}</li>
      </ul>
      
      <h3>Time Change:</h3>
      <ul>
        <li><strong>Original Time:</strong> \${originalDate} at \${originalTime}</li>
        <li><strong>New Time:</strong> \${newDate} at \${newTime}</li>
      </ul>
      
      <p>Please update your schedule accordingly. If you have any conflicts with this new time, please contact us immediately.</p>
      
      <p>Thank you for your understanding.</p>
      <p>Best regards,<br>The Boombox Team</p>
    </div>
  `,
  subject: 'Appointment Time Change - \${appointmentId}',
  requiredVariables: [
    'movingPartnerName',
    'appointmentId',
    'originalDate',
    'originalTime',
    'newDate',
    'newTime',
    'customerName',
    'appointmentType',
    'address',
  ],
  channel: 'email',
  domain: 'appointment',
};

