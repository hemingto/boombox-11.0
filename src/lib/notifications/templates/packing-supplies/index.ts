/**
 * @fileoverview Packing supply notification templates
 * @source New templates for boombox-11.0 notification system
 */

import { NotificationTemplate, OrderNotificationData, RouteNotificationData } from '../../types';
import { formatDateForDisplay, formatTime } from '@/lib/utils/dateUtils';
import { formatCurrency } from '@/lib/utils/currencyUtils';

export const orderConfirmedTemplate: NotificationTemplate = {
  type: 'ORDER_CONFIRMED',
  category: 'packing-supplies',
  
  getTitle: () => 'Order Confirmed',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as OrderNotificationData;
    const date = typeof typedData.deliveryDate === 'string' ? new Date(typedData.deliveryDate) : typedData.deliveryDate;
    const formattedDate = formatDateForDisplay(date);
    
    let message = `Your packing supply order has been confirmed and will be delivered on ${formattedDate} to ${typedData.deliveryAddress}.`;
    
    if (typedData.itemCount) {
      message += ` ${typedData.itemCount} items in this order.`;
    }
    
    return message;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['orderId', 'deliveryDate', 'deliveryAddress'],
  
  optionalVariables: ['itemCount', 'totalAmount'],
  
  supportsGrouping: false
};

export const deliveryCompletedTemplate: NotificationTemplate = {
  type: 'DELIVERY_COMPLETED',
  category: 'packing-supplies',
  
  getTitle: () => 'Delivery Completed',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as OrderNotificationData;
    let message = `Your packing supplies have been delivered to ${typedData.deliveryAddress}.`;
    
    if (typedData.driverName) {
      message += ` Delivered by ${typedData.driverName}.`;
    }
    
    return message;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['orderId', 'deliveryAddress'],
  
  optionalVariables: ['driverName'],
  
  supportsGrouping: false
};

export const orderCancelledTemplate: NotificationTemplate = {
  type: 'ORDER_CANCELLED',
  category: 'packing-supplies',
  
  getTitle: () => 'Order Cancelled',
  
  getMessage: (data: Record<string, any>) => {
    return `Your packing supply order has been cancelled.`;
  },
  
  recipientTypes: ['USER'],
  
  requiredVariables: ['orderId'],
  
  optionalVariables: [],
  
  supportsGrouping: false
};

export const routeOfferTemplate: NotificationTemplate = {
  type: 'ROUTE_OFFER',
  category: 'packing-supplies',
  
  getTitle: () => 'New Route Offer',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as RouteNotificationData;
    const date = typeof typedData.deliveryDate === 'string' ? new Date(typedData.deliveryDate) : typedData.deliveryDate;
    const formattedDate = formatDateForDisplay(date);
    
    return `New packing supply route with ${typedData.stopCount} stops on ${formattedDate}. Estimated payout: ${formatCurrency(typedData.estimatedPayout)}.`;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['routeId', 'deliveryDate', 'stopCount', 'estimatedPayout'],
  
  optionalVariables: ['startTime', 'endTime'],
  
  supportsGrouping: true,
  
  getGroupKey: (data: Record<string, any>) => {
    const typedData = data as RouteNotificationData;
    const date = typeof typedData.deliveryDate === 'string' ? new Date(typedData.deliveryDate) : typedData.deliveryDate;
    return `route_offers_${date.toISOString().split('T')[0]}`;
  }
};

export const routeAssignedTemplate: NotificationTemplate = {
  type: 'ROUTE_ASSIGNED',
  category: 'packing-supplies',
  
  getTitle: () => 'Route Assigned',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as RouteNotificationData;
    const date = typeof typedData.deliveryDate === 'string' ? new Date(typedData.deliveryDate) : typedData.deliveryDate;
    const formattedDate = formatDateForDisplay(date);
    
    return `You have been assigned a packing supply route with ${typedData.stopCount} stops on ${formattedDate}. Payout: ${formatCurrency(typedData.estimatedPayout)}.`;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['routeId', 'deliveryDate', 'stopCount', 'estimatedPayout'],
  
  optionalVariables: ['startTime', 'endTime'],
  
  supportsGrouping: false
};

export const routeCancelledTemplate: NotificationTemplate = {
  type: 'ROUTE_CANCELLED',
  category: 'packing-supplies',
  
  getTitle: () => 'Route Cancelled',
  
  getMessage: (data: Record<string, any>) => {
    const typedData = data as RouteNotificationData;
    const date = typeof typedData.deliveryDate === 'string' ? new Date(typedData.deliveryDate) : typedData.deliveryDate;
    const formattedDate = formatDateForDisplay(date);
    
    return `Your packing supply route scheduled for ${formattedDate} has been cancelled.`;
  },
  
  recipientTypes: ['DRIVER'],
  
  requiredVariables: ['routeId', 'deliveryDate'],
  
  optionalVariables: ['stopCount'],
  
  supportsGrouping: false
};

