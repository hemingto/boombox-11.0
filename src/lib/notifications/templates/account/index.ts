/**
 * @fileoverview Account notification templates
 * @source New templates for boombox-11.0 notification system
 */

import { NotificationTemplate, AccountNotificationData, NotificationRecipientType } from '../../types';
import { formatDateForDisplay } from '@/lib/utils/dateUtils';

/**
 * Extended account notification data to support driver-specific messaging
 */
export interface DriverApprovedNotificationData extends AccountNotificationData {
  movingPartnerName?: string;
  isMovingPartnerDriver?: boolean;
}

export const accountApprovedTemplate: NotificationTemplate = {
  type: 'ACCOUNT_APPROVED',
  category: 'account',
  
  getTitle: () => 'Account Approved',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as DriverApprovedNotificationData;
    
    // Customized message for drivers linked to moving partners
    if (typedData.accountType === 'driver' && typedData.isMovingPartnerDriver && typedData.movingPartnerName) {
      return `Your driver account has been approved! You can now start driving for ${typedData.movingPartnerName} on Boombox.`;
    }
    
    // Generic driver message
    if (typedData.accountType === 'driver') {
      return `Congratulations! Your driver account has been approved. You can now start accepting jobs on Boombox.`;
    }
    
    // Mover or other account types
    let message = `Congratulations! Your ${typedData.accountType} account has been approved`;
    
    if (typedData.approvalDate) {
      const date = typeof typedData.approvalDate === 'string' ? new Date(typedData.approvalDate) : typedData.approvalDate;
      message += ` on ${formatDateForDisplay(date)}`;
    }
    
    message += `. You can now start accepting jobs.`;
    
    return message;
  },
  
  recipientTypes: ['DRIVER', 'MOVER'],
  
  requiredVariables: ['accountType'],
  
  optionalVariables: ['approvalDate', 'userName', 'movingPartnerName', 'isMovingPartnerDriver'],
  
  supportsGrouping: false
};

export const accountSuspendedTemplate: NotificationTemplate = {
  type: 'ACCOUNT_SUSPENDED',
  category: 'account',
  
  getTitle: () => 'Account Suspended',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AccountNotificationData;
    let message = `Your account has been temporarily suspended`;
    
    if (typedData.suspensionReason) {
      message += `: ${typedData.suspensionReason}`;
    }
    
    message += `. Please contact support for more information.`;
    
    return message;
  },
  
  recipientTypes: ['DRIVER', 'MOVER'],
  
  requiredVariables: [],
  
  optionalVariables: ['suspensionReason'],
  
  supportsGrouping: false
};

export const vehicleApprovedTemplate: NotificationTemplate = {
  type: 'VEHICLE_APPROVED',
  category: 'account',
  
  getTitle: () => 'Vehicle Approved',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AccountNotificationData;
    let message = `Your ${typedData.vehicleType || 'vehicle'} has been approved for use.`;
    
    return message;
  },
  
  recipientTypes: ['DRIVER', 'MOVER'],
  
  requiredVariables: [],
  
  optionalVariables: ['vehicleType', 'vehicleId'],
  
  supportsGrouping: false
};

export const vehicleRejectedTemplate: NotificationTemplate = {
  type: 'VEHICLE_REJECTED',
  category: 'account',
  
  getTitle: () => 'Vehicle Needs Updates',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AccountNotificationData;
    let message = `Your vehicle application needs updates`;
    
    if (typedData.rejectionReason) {
      message += `: ${typedData.rejectionReason}`;
    }
    
    message += `. Please review and resubmit.`;
    
    return message;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: [],
  
  optionalVariables: ['rejectionReason', 'vehicleType', 'vehicleId'],
  
  supportsGrouping: false
};

export const driverApprovedTemplate: NotificationTemplate = {
  type: 'DRIVER_APPROVED',
  category: 'account',
  
  getTitle: () => 'Driver Approved',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AccountNotificationData;
    let message = `${typedData.userName || 'A driver'} has been approved and added to your team.`;
    
    return message;
  },
  
  recipientTypes: ['MOVER'],
  
  requiredVariables: [],
  
  optionalVariables: ['userName'],
  
  supportsGrouping: false
};

/**
 * Notification sent to moving partner when admin approves their account
 * but they still need to add drivers before they can accept jobs
 */
export const moverPendingDriversTemplate: NotificationTemplate = {
  type: 'MOVER_PENDING_DRIVERS',
  category: 'account',
  
  getTitle: () => 'Almost There!',
  
  getMessage: () => {
    return `Your Boombox partner account has been approved! You just need to add a driver to your account to start accepting jobs on Boombox.`;
  },
  
  recipientTypes: ['MOVER'],
  
  requiredVariables: [],
  
  optionalVariables: ['companyName'],
  
  supportsGrouping: false
};

/**
 * Notification sent to moving partner when their first driver is approved
 * and their account becomes fully active
 */
export const moverActivatedTemplate: NotificationTemplate = {
  type: 'MOVER_ACTIVATED',
  category: 'account',
  
  getTitle: () => 'Account Activated!',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AccountNotificationData;
    const driverName = typedData.userName || 'Your driver';
    return `Congratulations! ${driverName} has been approved and your Boombox partner account is now fully active. You can now start accepting jobs!`;
  },
  
  recipientTypes: ['MOVER'],
  
  requiredVariables: [],
  
  optionalVariables: ['userName', 'companyName'],
  
  supportsGrouping: false
};

