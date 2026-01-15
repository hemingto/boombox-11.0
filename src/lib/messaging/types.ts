/**
 * @fileoverview Message template types and interfaces for centralized messaging system
 * @refactor New centralized typing system for template-based messaging
 */

// Base template interface
export interface MessageTemplate {
  subject?: string; // For emails
  text: string;
  html?: string; // For emails
  requiredVariables: string[];
  optionalVariables?: string[]; // Optional template variables
  channel: MessageChannel;
  domain: MessageDomain;
  description?: string;
}

// Template variable validation
export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

// Message sending result
export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Template rendering context
export interface TemplateContext {
  variables: TemplateVariables;
  template: MessageTemplate;
}

// Domain-specific template categories
export type MessageDomain =
  | 'auth'
  | 'booking'
  | 'appointment'
  | 'logistics'
  | 'payment'
  | 'admin';
export type MessageChannel = 'sms' | 'email';

// Template validation error
export interface TemplateValidationError {
  field: string;
  message: string;
}

// Common template variables for different domains
export interface AuthTemplateVariables {
  verificationCode?: string;
  customerName?: string;
  inviteLink?: string;
  movingPartnerName?: string;
  expirationTime?: string;
}

export interface BookingTemplateVariables {
  customerName?: string;
  appointmentType?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  address?: string;
  shortAddress?: string;
  trackingUrl?: string;
  crewName?: string;
  unitNumber?: number;
}

export interface LogisticsTemplateVariables {
  customerName?: string;
  driverName?: string;
  trackingUrl?: string;
  deliveryTime?: string;
  orderId?: number;
  estimatedArrival?: string;
}

export interface PaymentTemplateVariables {
  customerName?: string;
  driverName?: string;
  amount?: number;
  formattedAmount?: string;
  paymentEstimate?: string;
  invoiceUrl?: string;
  payoutAmount?: number;
}

export interface AdminTemplateVariables {
  adminName?: string;
  driverName?: string;
  customerName?: string;
  appointmentId?: number;
  taskId?: string;
  systemMessage?: string;
}

// Union type for all template variables
export type AllTemplateVariables =
  | AuthTemplateVariables
  | BookingTemplateVariables
  | LogisticsTemplateVariables
  | PaymentTemplateVariables
  | AdminTemplateVariables
  | TemplateVariables;
