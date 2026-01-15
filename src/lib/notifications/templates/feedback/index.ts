/**
 * @fileoverview Feedback notification templates
 * @source New templates for boombox-11.0 notification system
 */

import { NotificationTemplate, FeedbackNotificationData, NotificationRecipientType } from '../../types';
import { formatCurrency } from '@/lib/utils/currencyUtils';

export const feedbackReceivedTemplate: NotificationTemplate = {
  type: 'FEEDBACK_RECEIVED',
  category: 'feedback',
  
  getTitle: () => 'New Feedback',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as FeedbackNotificationData;
    let message = `You received a ${typedData.rating}-star rating`;
    
    if (typedData.customerName) {
      message += ` from ${typedData.customerName}`;
    }
    
    if (data.tipAmount && data.tipAmount > 0) {
      message += ` and a ${formatCurrency(data.tipAmount)} tip`;
    }
    
    message += `.`;
    
    return message;
  },
  
  recipientTypes: ['DRIVER', 'MOVER'],
  
  requiredVariables: ['rating'],
  
  optionalVariables: ['customerName', 'tipAmount', 'feedbackText', 'appointmentId', 'orderId'],
  
  supportsGrouping: false
};

