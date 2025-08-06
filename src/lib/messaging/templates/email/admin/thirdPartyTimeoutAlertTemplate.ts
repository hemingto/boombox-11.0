/**
 * @fileoverview Email template for admin notification about third-party mover timeout
 * @source boombox-10.0/src/app/api/cron/process-expired-mover-changes/route.ts (lines 366)
 * @refactor Converted SMS notification to comprehensive email template for better admin experience
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const thirdPartyTimeoutAlertTemplate: MessageTemplate = {
  subject: '🚨 Third-Party Mover Timeout - Manual Booking Required for Appointment ${appointmentId}',
  text: `THIRD-PARTY MOVER TIMEOUT - ACTION REQUIRED

Customer: ${customerName}
Phone: ${customerPhone}
Appointment ID: ${appointmentId}

ISSUE: Customer didn't respond to third-party mover options within the 2-hour window.

ACTION NEEDED: Please manually book a third-party mover for this customer.

Admin Dashboard: ${dashboardUrl}/admin/appointments/${appointmentId}

This requires immediate attention to ensure service continuity.`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Third-Party Mover Timeout Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: #fee2e2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0; color: #7f1d1d; font-size: 20px; font-weight: 700;">
        🚨 Third-Party Mover Timeout
      </h1>
      <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px; font-weight: 500;">
        HIGH PRIORITY - Manual booking required
      </p>
    </div>

    <!-- Main Content -->
    <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      
      <!-- Appointment Summary -->
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
          <h2 style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">Appointment \${appointmentId}</h2>
          <span style="background: #fee2e2; color: #7f1d1d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px;">
            TIMEOUT
          </span>
        </div>

        <!-- Customer Information -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Customer Information</h3>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;">
            <div style="margin-bottom: 8px;">
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Name:</span>
              <span style="color: #111827; font-size: 14px; font-weight: 600; margin-left: 8px;">\${customerName}</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Phone:</span>
              <span style="color: #111827; font-size: 14px; font-weight: 600; margin-left: 8px;">\${customerPhone}</span>
            </div>
          </div>
        </div>

        <!-- Issue Details -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Issue Description</h3>
          <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
              <strong>Customer didn't respond to third-party mover options</strong> within the 2-hour response window. 
              The appointment has been moved to the Boombox Delivery Network, but a third-party mover still needs to be manually booked.
            </p>
          </div>
        </div>

        <!-- Action Required -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Action Required</h3>
          <div style="background: #fee2e2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 12px 0; color: #7f1d1d; font-size: 14px; font-weight: 600;">
              Manual third-party mover booking needed
            </p>
            <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
              Please contact the customer and arrange a third-party mover for their appointment. 
              This requires immediate attention to ensure service continuity.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="background: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
        <div style="text-align: center;">
          <a href="\${dashboardUrl}/admin/appointments/\${appointmentId}" 
             style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 12px;">
            View Appointment in Dashboard
          </a>
          <a href="tel:\${customerPhone}" 
             style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Call Customer
          </a>
        </div>
        <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
          This notification was sent because a third-party mover timeout occurred.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 20px; text-align: center;">
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        Boombox Storage Admin System
      </p>
    </div>
  </div>
</body>
</html>`,
  requiredVariables: ['appointmentId', 'customerName', 'customerPhone', 'dashboardUrl'],
  channel: 'email',
  domain: 'admin'
};