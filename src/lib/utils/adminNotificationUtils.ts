/**
 * @fileoverview Utility functions for admin notifications
 * @source boombox-10.0/src/app/api/admin/notify-no-driver/route.ts (extracted inline functions)
 * @refactor Extracted utility functions for urgency calculation, address formatting, and template variables
 */

import { prisma } from '@/lib/database/prismaClient';

/**
 * Get admin emails from database for notifications
 * Fetches all ADMIN and SUPERADMIN role emails from the database
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const admins = await prisma.admin.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPERADMIN']
        }
      },
      select: {
        email: true
      }
    });

    const adminEmails = admins.map(admin => admin.email);
    
    // Fallback to environment variables if no admins found in database
    if (adminEmails.length === 0) {
      console.warn('No admin emails found in database, falling back to environment variables');
      return process.env.ADMIN_EMAILS?.split(',') || [
        'chemington@boomboxstorage.com',
        'help@boomboxstorage.com'
      ];
    }

    return adminEmails;
  } catch (error) {
    console.error('Error fetching admin emails from database:', error);
    // Fallback to environment variables on error
    return process.env.ADMIN_EMAILS?.split(',') || [
      'chemington@boomboxstorage.com',
      'help@boomboxstorage.com'
    ];
  }
}

/**
 * Determine urgency level based on delivery date
 */
export function getUrgencyLevel(deliveryDate: Date): 'critical' | 'high' | 'medium' {
  const now = new Date();
  const hoursUntilDelivery = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilDelivery <= 4) return 'critical';
  if (hoursUntilDelivery <= 12) return 'high';
  return 'medium';
}

/**
 * Get urgency-specific styling colors
 */
export function getUrgencyColors(urgencyLevel: string) {
  const urgencyColors = {
    critical: { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d' },
    high: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
    medium: { bg: '#ede9fe', border: '#7c3aed', text: '#553c9a' },
  };

  return urgencyColors[urgencyLevel as keyof typeof urgencyColors] || urgencyColors.medium;
}

/**
 * Get urgency emoji based on level
 */
export function getUrgencyEmoji(urgencyLevel: string): string {
  const emojiMap = {
    critical: '🚨',
    high: '⚠️',
    medium: '📋'
  };
  
  return emojiMap[urgencyLevel as keyof typeof emojiMap] || '📋';
}

/**
 * Helper to get short address for display
 */
export function getShortAddress(fullAddress: string): string {
  const parts = fullAddress.split(',');
  const streetAddress = parts[0]?.trim() || '';
  
  if (streetAddress.length > 25) {
    return streetAddress.substring(0, 22) + '...';
  }
  
  return streetAddress;
}

/**
 * Generate orders section HTML for email template
 */
export function generateOrdersSection(routeDetails: any): string {
  if (!routeDetails?.orders || routeDetails.orders.length === 0) {
    return '';
  }

  const ordersTable = routeDetails.orders.map((order: any) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 8px 4px; font-size: 14px;">#${order.id}</td>
      <td style="padding: 8px 4px; font-size: 14px;">${order.contactName}</td>
      <td style="padding: 8px 4px; font-size: 14px;">${getShortAddress(order.deliveryAddress)}</td>
      <td style="padding: 8px 4px; font-size: 14px; text-align: right;">$${order.totalPrice.toFixed(0)}</td>
    </tr>
  `).join('');

  return `
    <div style="margin: 20px 0;">
      <h4 style="color: #374151; margin: 0 0 12px 0; font-size: 16px;">📦 Order Details</h4>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #f9fafb; border-radius: 6px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px 4px; text-align: left; font-weight: 600; color: #374151;">Order</th>
              <th style="padding: 8px 4px; text-align: left; font-weight: 600; color: #374151;">Customer</th>
              <th style="padding: 8px 4px; text-align: left; font-weight: 600; color: #374151;">Address</th>
              <th style="padding: 8px 4px; text-align: right; font-weight: 600; color: #374151;">Value</th>
            </tr>
          </thead>
          <tbody>
            ${ordersTable}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Generate source context message based on notification source
 */
export function generateSourceContext(source?: string): string {
  if (source === 'expired_offer_cleanup') {
    return '<p style="color: #dc2626; font-weight: 600; margin: 8px 0;">⏰ Previous driver offer expired</p>';
  }
  return '';
}

/**
 * Generate source text for email subject
 */
export function generateSourceText(source?: string): string {
  return source === 'expired_offer_cleanup' ? ' (Expired Offer)' : '';
}

/**
 * Generate additional info section for email footer
 */
export function generateAdditionalInfoSection(additionalInfo?: string): string {
  if (!additionalInfo) {
    return '';
  }
  
  return `
    <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
      Additional: ${additionalInfo}
    </p>
  `;
}

/**
 * Calculate estimated payout based on number of stops
 */
export function calculateEstimatedPayout(totalStops: number): string {
  return totalStops ? `$${(totalStops * 15).toFixed(0)}` : 'TBD';
}