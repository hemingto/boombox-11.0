/**
 * @fileoverview Job Offer Received notification template
 * @source New template for boombox-11.0 notification system
 */

import { NotificationTemplate, JobNotificationData } from '../../types';
import { formatDateForDisplay, formatTime } from '@/lib/utils/dateUtils';
import { formatCurrency } from '@/lib/utils/currencyUtils';

export const jobOfferReceivedTemplate: NotificationTemplate = {
  type: 'JOB_OFFER_RECEIVED',
  category: 'jobs',
  
  getTitle: () => 'New Job Offer',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    const formattedTime = typedData.time ? formatTime(typeof typedData.time === 'string' ? new Date(typedData.time) : typedData.time) : '';
    
    let message = `New ${typedData.jobType} job available on ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''} at ${typedData.address}.`;
    
    if (typedData.estimatedPayout) {
      message += ` Estimated payout: ${formatCurrency(typedData.estimatedPayout)}.`;
    }
    
    return message;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['appointmentId', 'jobType', 'date', 'address'],
  
  optionalVariables: ['time', 'estimatedPayout', 'customerName', 'details'],
  
  supportsGrouping: true,
  
  getGroupKey: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    // Group job offers by day
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    return `job_offers_${date.toISOString().split('T')[0]}`;
  }
};

export const jobAssignedTemplate: NotificationTemplate = {
  type: 'JOB_ASSIGNED',
  category: 'jobs',
  
  getTitle: () => 'Job Assigned',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    const formattedTime = typedData.time ? formatTime(typeof typedData.time === 'string' ? new Date(typedData.time) : typedData.time) : '';
    
    return `You have been assigned a ${typedData.jobType} job on ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''} at ${typedData.address}.`;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['appointmentId', 'jobType', 'date', 'address'],
  
  optionalVariables: ['time', 'customerName'],
  
  supportsGrouping: false
};

export const jobDetailsUpdatedTemplate: NotificationTemplate = {
  type: 'JOB_DETAILS_UPDATED',
  category: 'jobs',
  
  getTitle: () => 'Job Details Updated',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    let message = `The details for your ${typedData.jobType} job have been updated.`;
    
    if (typedData.details) {
      message += ` ${typedData.details}`;
    }
    
    return message;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['appointmentId', 'jobType'],
  
  optionalVariables: ['details', 'date', 'time', 'address'],
  
  supportsGrouping: false
};

export const jobCancelledTemplate: NotificationTemplate = {
  type: 'JOB_CANCELLED',
  category: 'jobs',
  
  getTitle: () => 'Job Cancelled',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    
    return `Your ${typedData.jobType} job scheduled for ${formattedDate} has been cancelled.`;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['appointmentId', 'jobType', 'date'],
  
  optionalVariables: ['address'],
  
  supportsGrouping: false
};

export const reconfirmationRequiredTemplate: NotificationTemplate = {
  type: 'RECONFIRMATION_REQUIRED',
  category: 'jobs',
  
  getTitle: () => 'Job Reconfirmation Required',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    const formattedTime = typedData.time ? formatTime(typeof typedData.time === 'string' ? new Date(typedData.time) : typedData.time) : '';
    
    return `Your ${typedData.jobType} job time has changed to ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''}. Please confirm your availability.`;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['appointmentId', 'jobType', 'date'],
  
  optionalVariables: ['time', 'address'],
  
  supportsGrouping: false
};

export const newJobAvailableTemplate: NotificationTemplate = {
  type: 'NEW_JOB_AVAILABLE',
  category: 'jobs',
  
  getTitle: () => 'New Job Available',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    
    let message = `New ${typedData.jobType} appointment scheduled for ${formattedDate}.`;
    
    if (typedData.driverName) {
      message += ` Assigned to: ${typedData.driverName}.`;
    }
    
    return message;
  },
  
  recipientTypes: ['MOVER'],
  
  requiredVariables: ['appointmentId', 'jobType', 'date'],
  
  optionalVariables: ['driverName', 'address', 'customerName'],
  
  supportsGrouping: false
};

export const customerCancellationTemplate: NotificationTemplate = {
  type: 'CUSTOMER_CANCELLATION',
  category: 'jobs',
  
  getTitle: () => 'Customer Cancelled Appointment',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as JobNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    
    let message = `${typedData.customerName || 'A customer'} has cancelled their ${typedData.jobType} appointment scheduled for ${formattedDate}.`;
    
    return message;
  },
  
  recipientTypes: ['MOVER'],
  
  requiredVariables: ['appointmentId', 'jobType', 'date'],
  
  optionalVariables: ['customerName', 'address'],
  
  supportsGrouping: false
};

