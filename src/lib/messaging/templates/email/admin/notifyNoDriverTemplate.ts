/**
 * @fileoverview Email template for admin notifications when no driver is available for route assignment
 * @source boombox-10.0/src/app/api/admin/notify-no-driver/route.ts (inline template function)
 * @refactor Extracted inline email template into centralized messaging system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const notifyNoDriverTemplate: MessageTemplate = {
  subject: '\${urgencyEmoji} Route Assignment Needed\${sourceText} - \${routeId} (\${formattedTime})',
  text: `ROUTE ASSIGNMENT REQUIRED - \${routeId}

Urgency: \${urgencyLevel} PRIORITY
Delivery Date: \${formattedDate}
Total Stops: \${totalStops}
Issue: \${reason}

Please log into the admin dashboard to assign a driver for this route.

Admin Dashboard: \${dashboardUrl}`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Route Assignment Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: \${urgencyBg}; border: 2px solid \${urgencyBorder}; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0; color: \${urgencyText}; font-size: 20px; font-weight: 700;">
        \${urgencyEmoji} Route Assignment Required
      </h1>
      <p style="margin: 8px 0 0 0; color: \${urgencyText}; font-size: 14px; font-weight: 500;">
        \${urgencyLevel} PRIORITY - Action needed for \${formattedTime}
      </p>
    </div>

    <!-- Main Content -->
    <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      
      <!-- Route Summary -->
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
          <h2 style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">Route \${routeId}</h2>
          <span style="background: #fee2e2; color: #7f1d1d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px;">
            UNASSIGNED
          </span>
        </div>

        \${sourceContext}

        <!-- Quick Stats -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 20px 0;">
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">\${totalStops}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">STOPS</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">\${estimatedPayout}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">EST. PAYOUT</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 16px; font-weight: 700; color: #111827;">\${formattedTime}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">DELIVERY</div>
          </div>
        </div>

        <!-- Issue Description -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 14px;">
            📋 Issue: \${reason}
          </p>
        </div>

        \${ordersSection}

        <!-- Action Items -->
        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px;">📱 Required Actions</h4>
          <ol style="margin: 0; padding-left: 20px; color: #0c4a6e;">
            <li style="margin-bottom: 6px;">Open admin dashboard and locate route \${routeId}</li>
            <li style="margin-bottom: 6px;">Check driver availability for \${formattedDate}</li>
            <li style="margin-bottom: 6px;">Manually assign available driver to route</li>
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
          Automated alert from Boombox Packing Supply System<br>
          \${timestamp} | Route ID: \${routeId}
        </p>
        \${additionalInfoSection}
      </div>
    </div>
  </div>
</body>
</html>`,
  requiredVariables: [
    'routeId',
    'urgencyLevel',
    'urgencyEmoji',
    'urgencyBg',
    'urgencyBorder',
    'urgencyText',
    'formattedDate',
    'formattedTime',
    'totalStops',
    'reason',
    'estimatedPayout',
    'dashboardUrl',
    'timestamp',
    'sourceText',
    'sourceContext',
    'ordersSection',
    'additionalInfoSection'
  ],
  channel: 'email',
  domain: 'admin',
  description: 'Email notification sent to admins when no driver is available for packing supply route assignment'
};