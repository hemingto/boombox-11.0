/**
 * @fileoverview Appointment Confirmed notification template
 * @source New template for boombox-11.0 notification system
 */

import { NotificationTemplate, AppointmentNotificationData } from '../../types';
import { formatDateForDisplay, formatTime } from '@/lib/utils/dateUtils';

export const appointmentConfirmedTemplate: NotificationTemplate = {
  type: 'APPOINTMENT_CONFIRMED',
  category: 'appointments',
  
  getTitle: () => 'Appointment Confirmed',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as AppointmentNotificationData;
    const date = typeof typedData.date === 'string' ? new Date(typedData.date) : typedData.date;
    const formattedDate = formatDateForDisplay(date);
    const formattedTime = typedData.time ? formatTime(typeof typedData.time === 'string' ? new Date(typedData.time) : typedData.time) : '';
    
    return `Your ${typedData.appointmentType} appointment is confirmed for ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''} at ${typedData.address}.`;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['appointmentId', 'appointmentType', 'date', 'address'],
  
  optionalVariables: ['time', 'zipCode', 'numberOfUnits'],
  
  supportsGrouping: false
};

