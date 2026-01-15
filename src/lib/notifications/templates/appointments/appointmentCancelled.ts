/**
 * @fileoverview Appointment Cancelled notification template
 * @source New template for boombox-11.0 notification system
 */

import { NotificationTemplate, AppointmentNotificationData } from '../../types';
import { formatDateForDisplay } from '@/lib/utils/dateUtils';

export const appointmentCancelledTemplate: NotificationTemplate = {
  type: 'APPOINTMENT_CANCELLED',
  category: 'appointments',
  
  getTitle: () => 'Appointment Cancelled',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AppointmentNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    
    let message = `Your ${typedData.appointmentType} appointment scheduled for ${formattedDate} has been cancelled.`;
    
    if (typedData.cancellationReason) {
      message += ` Reason: ${typedData.cancellationReason}`;
    }
    
    return message;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['appointmentId', 'appointmentType', 'date'],
  
  optionalVariables: ['cancellationReason', 'address'],
  
  supportsGrouping: false
};
