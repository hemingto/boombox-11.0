/**
 * @fileoverview Email template for daily packing supply route assignment summary
 * @source boombox-10.0/src/app/api/cron/daily-batch-optimize/route.ts (inline template)
 * @refactor Extracted inline email template into centralized messaging system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const dailySummaryTemplate: MessageTemplate = {
  subject: '📦 Daily Packing Supply Route Assignment Summary - ${formattedDate}',
  text: `DAILY PACKING SUPPLY ROUTE ASSIGNMENT SUMMARY

Date: \${formattedDate}

OPTIMIZATION RESULTS:
- Orders Processed: \${ordersProcessed}
- Routes Created: \${routesCreated}
- Driver Offers Sent: \${driverOffersSuccessful}
- Offers Failed: \${driverOffersFailed}

\${successfulOffersText}

\${failedOffersText}

Generated automatically by the Boombox Packing Supply optimization system.
Timestamp: \${timestamp}`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Packing Supply Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background-color: #28a745; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: white; margin: 0;">📦 Daily Packing Supply Route Assignment Summary</h2>
      <p style="color: white; margin: 10px 0 0 0;">Date: \${formattedDate}</p>
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
      <h3 style="color: #495057; margin-top: 0;">Optimization Results</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Orders Processed:</td>
          <td style="padding: 8px 0;">\${ordersProcessed}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Routes Created:</td>
          <td style="padding: 8px 0;">\${routesCreated}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Driver Offers Sent:</td>
          <td style="padding: 8px 0;">\${driverOffersSuccessful}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Offers Failed:</td>
          <td style="padding: 8px 0;">\${driverOffersFailed}</td>
        </tr>
      </table>

      \${successfulOffersSection}

      \${failedOffersSection}

      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="margin: 0; color: #6c757d; font-size: 14px;">
          Generated automatically by the Boombox Packing Supply optimization system.
          <br>
          Timestamp: \${timestamp}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
  requiredVariables: [
    'formattedDate',
    'ordersProcessed',
    'routesCreated', 
    'driverOffersSuccessful',
    'driverOffersFailed',
    'successfulOffersText',
    'failedOffersText',
    'successfulOffersSection',
    'failedOffersSection',
    'timestamp'
  ],
  channel: 'email',
  domain: 'admin',
  description: 'Daily summary email sent to admins after packing supply route assignment completion'
};