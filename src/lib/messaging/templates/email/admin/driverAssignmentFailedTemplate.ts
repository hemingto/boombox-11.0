/**
 * @fileoverview Email template for admin notifications when driver assignment fails
 * @refactor Created for centralized driver assignment failure notifications
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverAssignmentFailedTemplate: MessageTemplate = {
  subject: '🚨 Driver Assignment Failed - Appointment #\${appointmentId} (\${appointmentType})',
  text: `DRIVER ASSIGNMENT FAILED

Appointment ID: \${appointmentId}
Type: \${appointmentType}
Unit Number: \${unitNumber}
Date: \${formattedDate}
Time: \${formattedTime}
Address: \${address}

Issue: No available drivers found for this unit.

Please log into the admin dashboard to manually assign a driver.

Admin Dashboard: \${dashboardUrl}`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Driver Assignment Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0; color: #7f1d1d; font-size: 20px; font-weight: 700;">
        🚨 Driver Assignment Failed
      </h1>
      <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px; font-weight: 500;">
        Action Required - Manual Driver Assignment Needed
      </p>
    </div>

    <!-- Main Content -->
    <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      
      <!-- Appointment Details -->
      <div style="padding: 24px;">
        <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">Appointment Details</h2>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="display: grid; gap: 12px;">
            <div>
              <span style="color: #6b7280; font-size: 12px; font-weight: 500; display: block; margin-bottom: 4px;">APPOINTMENT ID</span>
              <span style="color: #111827; font-size: 16px; font-weight: 600;">#\${appointmentId}</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 12px; font-weight: 500; display: block; margin-bottom: 4px;">TYPE</span>
              <span style="color: #111827; font-size: 14px;">\${appointmentType}</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 12px; font-weight: 500; display: block; margin-bottom: 4px;">UNIT NUMBER</span>
              <span style="color: #111827; font-size: 14px;">Unit \${unitNumber}</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 12px; font-weight: 500; display: block; margin-bottom: 4px;">DATE & TIME</span>
              <span style="color: #111827; font-size: 14px;">\${formattedDate} at \${formattedTime}</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 12px; font-weight: 500; display: block; margin-bottom: 4px;">ADDRESS</span>
              <span style="color: #111827; font-size: 14px;">\${address}</span>
            </div>
          </div>
        </div>

        <!-- Issue Description -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 14px;">
            ⚠️ Issue: No available drivers found for this unit
          </p>
        </div>

        <!-- Action Items -->
        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px;">📱 Required Actions</h4>
          <ol style="margin: 0; padding-left: 20px; color: #0c4a6e;">
            <li style="margin-bottom: 6px;">Open admin dashboard and locate appointment #\${appointmentId}</li>
            <li style="margin-bottom: 6px;">Check driver availability for \${formattedDate}</li>
            <li style="margin-bottom: 6px;">Manually assign available driver to unit \${unitNumber}</li>
            <li style="margin-bottom: 6px;">Confirm assignment and notify driver</li>
          </ol>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="\${dashboardUrl}" 
             style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            📊 Open Admin Dashboard
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
          Automated alert from Boombox Driver Assignment System<br>
          Appointment ID: #\${appointmentId} | Unit: \${unitNumber}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
  requiredVariables: [
    'appointmentId',
    'appointmentType',
    'unitNumber',
    'formattedDate',
    'formattedTime',
    'address',
    'dashboardUrl'
  ],
  channel: 'email',
  domain: 'admin',
  description: 'Email notification sent to admins when no driver is available for appointment unit assignment'
};

