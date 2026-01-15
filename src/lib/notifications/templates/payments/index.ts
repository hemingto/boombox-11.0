/**
 * @fileoverview Payment notification templates
 * @source New templates for boombox-11.0 notification system
 */

import { NotificationTemplate, PaymentNotificationData, NotificationRecipientType } from '../../types';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { formatDateForDisplay } from '@/lib/utils/dateUtils';

export const paymentFailedTemplate: NotificationTemplate = {
  type: 'PAYMENT_FAILED',
  category: 'payments',
  
  getTitle: () => 'Payment Failed',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as PaymentNotificationData;
    let message = `Your payment of ${formatCurrency(typedData.amount)} has failed.`;
    
    if (typedData.failureReason) {
      message += ` Reason: ${typedData.failureReason}.`;
    }
    
    message += ` Please update your payment method.`;
    
    return message;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['amount'],
  
  optionalVariables: ['failureReason', 'transactionId', 'description'],
  
  supportsGrouping: false
};

export const refundProcessedTemplate: NotificationTemplate = {
  type: 'REFUND_PROCESSED',
  category: 'payments',
  
  getTitle: () => 'Refund Processed',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as PaymentNotificationData;
    let message = `A refund of ${formatCurrency(typedData.amount)} has been processed to your account.`;
    
    if (typedData.description) {
      message += ` Reason: ${typedData.description}.`;
    }
    
    return message;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['amount'],
  
  optionalVariables: ['description', 'transactionId', 'date'],
  
  supportsGrouping: false
};

export const payoutProcessedTemplate: NotificationTemplate = {
  type: 'PAYOUT_PROCESSED',
  category: 'payments',
  
  getTitle: () => 'Payout Processed',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as PaymentNotificationData;
    let message = `Your payout of ${formatCurrency(typedData.amount)} has been processed`;
    
    if (typedData.payoutMethod) {
      message += ` to your ${typedData.payoutMethod}`;
    }
    
    message += `.`;
    
    if (data.description) {
      message += ` ${data.description}.`;
    }
    
    return message;
  },
  
  recipientTypes: ['DRIVER', 'MOVER'],
  
  requiredVariables: ['amount'],
  
  optionalVariables: ['payoutMethod', 'description', 'transactionId', 'date'],
  
  supportsGrouping: false
};

export const payoutFailedTemplate: NotificationTemplate = {
  type: 'PAYOUT_FAILED',
  category: 'payments',
  
  getTitle: () => 'Payout Failed',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as PaymentNotificationData;
    let message = `Your payout of ${formatCurrency(typedData.amount)} has failed.`;
    
    if (typedData.failureReason) {
      message += ` Reason: ${typedData.failureReason}.`;
    }
    
    message += ` Please update your payout settings.`;
    
    return message;
  },
  
  recipientTypes: ['DRIVER', 'MOVER'],
  
  requiredVariables: ['amount'],
  
  optionalVariables: ['failureReason', 'description'],
  
  supportsGrouping: false
};

export const tipReceivedTemplate: NotificationTemplate = {
  type: 'TIP_RECEIVED',
  category: 'payments',
  
  getTitle: () => 'Tip Received',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as PaymentNotificationData;
    let message = `You received a tip of ${formatCurrency(typedData.amount)}`;
    
    if (typedData.description) {
      message += ` for ${typedData.description}`;
    }
    
    message += `!`;
    
    return message;
  },
  
  recipientTypes: ['DRIVER', 'MOVER'],
  
  requiredVariables: ['amount'],
  
  optionalVariables: ['description', 'transactionId'],
  
  supportsGrouping: false
};

export const storagePaymentDueTemplate: NotificationTemplate = {
  type: 'STORAGE_PAYMENT_DUE',
  category: 'payments',
  
  getTitle: () => 'Storage Payment Due',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as PaymentNotificationData;
    const dueDate = typedData.date ? (typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date) : null;
    
    let message = `Your monthly storage payment of ${formatCurrency(typedData.amount)} is `;
    
    if (dueDate) {
      message += `due on ${formatDateForDisplay(dueDate)}`;
    } else {
      message += `due soon`;
    }
    
    message += `.`;
    
    return message;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['amount'],
  
  optionalVariables: ['date', 'description'],
  
  supportsGrouping: false
};

