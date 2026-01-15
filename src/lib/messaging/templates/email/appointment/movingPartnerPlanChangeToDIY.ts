/**
 * @fileoverview Email template for notifying moving partners when customer switches to DIY plan
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (inline HTML email generation)
 * @refactor Extracted to centralized template with HTML generation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const movingPartnerPlanChangeToDIYEmail: MessageTemplate = {
  text: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Job Cancelled - Plan Changed to DIY - Boombox Storage</h2>
      <p>Hello \${movingPartnerName},</p>
      <p>We wanted to inform you that the customer has changed their appointment plan from Full Service to Do It Yourself (DIY). As a result, your services are no longer needed for this job.</p>
      
      <h3>Original Job Details:</h3>
      <ul>
        <li><strong>Customer:</strong> \${customerName}</li>
        <li><strong>Appointment ID:</strong> \${appointmentId}</li>
        <li><strong>Date:</strong> \${appointmentDate}</li>
        <li><strong>Time:</strong> \${appointmentTime}</li>
        <li><strong>Address:</strong> \${address}</li>
        <li><strong>Type:</strong> \${appointmentType}</li>
      </ul>
      
      <p>The customer has chosen to handle the loading/unloading themselves under our DIY plan, so no moving partner services are required.</p>
      
      <p>Thank you for your understanding.</p>
      <p>Best regards,<br>The Boombox Team</p>
    </div>
  `,
  subject: 'Job Cancelled - Plan Changed to DIY - \${appointmentId}',
  requiredVariables: [
    'movingPartnerName',
    'appointmentId',
    'customerName',
    'appointmentDate',
    'appointmentTime',
    'address',
    'appointmentType',
  ],
  channel: 'email',
  domain: 'appointment',
};

