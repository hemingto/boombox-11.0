/**
 * @fileoverview Email template for critical system failures (dispatch, optimization, etc.)
 * @refactor Created centralized template for system failure notifications
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const systemFailureTemplate: MessageTemplate = {
  subject: '🚨 ${systemName} System Failure - ${formattedDate}',
  text: `CRITICAL SYSTEM FAILURE ALERT

System: \${systemName}
Date: \${formattedDate}
Time: \${timestamp}

ERROR DETAILS:
\${errorMessage}

IMPACT:
\${impactDescription}

NEXT STEPS:
\${nextStepsText}

This is an automated alert from the Boombox monitoring system.
Please investigate immediately.

Dashboard: \${dashboardUrl}`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Failure Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0; color: #991b1b; font-size: 20px; font-weight: 700;">
        🚨 System Failure Alert
      </h1>
      <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 14px; font-weight: 500;">
        CRITICAL PRIORITY - Immediate attention required
      </p>
    </div>

    <!-- Main Content -->
    <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      
      <!-- System Info -->
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
          <h2 style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">\${systemName}</h2>
          <span style="background: #fee2e2; color: #7f1d1d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px;">
            SYSTEM FAILURE
          </span>
        </div>

        <!-- Quick Stats -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 20px 0;">
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 16px; font-weight: 700; color: #111827;">\${formattedDate}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">DATE</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 16px; font-weight: 700; color: #111827;">\${executionTime}ms</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">RUNTIME</div>
          </div>
        </div>

        <!-- Error Details -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px;">🐛 Error Details</h4>
          <p style="margin: 0; color: #92400e; font-size: 13px; font-family: 'Courier New', monospace;">
            \${errorMessage}
          </p>
        </div>

        <!-- Impact Description -->
        <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px;">⚠️ Impact</h4>
          <p style="margin: 0; color: #991b1b; font-size: 13px;">
            \${impactDescription}
          </p>
        </div>

        <!-- Next Steps -->
        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px;">🔧 Required Actions</h4>
          <div style="color: #0c4a6e; font-size: 13px;">
            \${nextStepsSection}
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="\${dashboardUrl}" 
             style="display: inline-block; background: #991b1b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            🚨 Open Admin Dashboard
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
          Automated alert from Boombox System Monitoring<br>
          \${timestamp} | System: \${systemName}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
  requiredVariables: [
    'systemName',
    'formattedDate',
    'timestamp',
    'errorMessage',
    'impactDescription',
    'nextStepsText',
    'nextStepsSection',
    'dashboardUrl',
    'executionTime'
  ],
  channel: 'email',
  domain: 'admin',
  description: 'Email notification sent to admins when critical system failures occur'
};