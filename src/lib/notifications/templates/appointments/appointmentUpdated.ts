/**
 * @fileoverview Appointment Updated notification template
 * @source New template for boombox-11.0 notification system
 */

import { NotificationTemplate, AppointmentNotificationData } from '../../types';
import { formatDateForDisplay, formatTime } from '@/lib/utils/dateUtils';

export const appointmentUpdatedTemplate: NotificationTemplate = {
  type: 'APPOINTMENT_UPDATED',
  category: 'appointments',
  
  getTitle: () => 'Appointment Updated',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AppointmentNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    const formattedTime = typedData.time ? formatTime(typeof typedData.time === 'string' ? new Date(typedData.time) : typedData.time) : '';
    
    return `Your ${typedData.appointmentType} appointment has been updated. New date: ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''}.`;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['appointmentId', 'appointmentType', 'date'],
  
  optionalVariables: ['time', 'address', 'zipCode'],
  
  supportsGrouping: false
};
