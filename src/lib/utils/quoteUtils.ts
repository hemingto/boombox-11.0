/**
 * @fileoverview Quote utility functions for email generation and formatting
 * @source boombox-10.0/src/app/api/send-quote-email/route.ts (generateQuoteEmailHTML function)
 * @refactor Extracted quote email generation logic into centralized utilities
 */

import { formatDateForDisplay } from './dateUtils';
import { TemplateVariables } from '@/lib/messaging/types';

/**
 * Quote data interface matching the original API
 */
export interface QuoteEmailData {
  email: string;
  address: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  storageUnitCount?: number;
  storageUnitText?: string;
  selectedPlanName: string;
  loadingHelpPrice: string;
  loadingHelpDescription: string;
  selectedInsurance?: {
    label: string;
    price: string;
  } | null;
  accessStorageUnitCount?: number;
  totalPrice: number;
  isAccessStorage: boolean;
  zipCode: string;
}

/**
 * Processed template variables for quote email
 * Extends TemplateVariables for proper messaging system compatibility
 */
export interface QuoteTemplateVariables extends TemplateVariables {
  address: string;
  formattedDate: string;
  scheduledTimeSlotText: string;
  selectedPlanName: string;
  loadingHelpPrice: string;
  totalPrice: string;
  currentYear: string;
  bookingUrl: string;
  storageUnitHtml: string;
  accessStorageHtml: string;
  insuranceHtml: string;
}

/**
 * Format date from string with error handling
 */
function formatQuoteDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDateForDisplay(date);
  } catch {
    console.warn('Invalid date format in quote email:', dateString);
    return dateString;
  }
}

/**
 * Generate storage unit HTML section for quote email
 */
function generateStorageUnitHtml(data: QuoteEmailData): string {
  if (data.storageUnitCount !== undefined && data.storageUnitText !== undefined) {
    const unitText = data.storageUnitCount > 1 ? 'Boomboxes' : 'Boombox';
    return `
      <div class="quote-item">
        <span>${data.storageUnitCount} ${unitText}</span>
        <span>Included in service</span>
      </div>
    `;
  }
  return '';
}

/**
 * Generate access storage HTML section for quote email
 */
function generateAccessStorageHtml(data: QuoteEmailData): string {
  if (data.accessStorageUnitCount !== undefined && data.accessStorageUnitCount > 0) {
    const deliveryText = data.accessStorageUnitCount > 1 ? 'Deliveries' : 'Delivery';
    const cost = data.accessStorageUnitCount * 45;
    return `
      <div class="quote-item">
        <span>${data.accessStorageUnitCount} Storage Unit ${deliveryText}</span>
        <span>$${cost}</span>
      </div>
    `;
  }
  return '';
}

/**
 * Generate insurance HTML section for quote email
 */
function generateInsuranceHtml(data: QuoteEmailData): string {
  if (data.selectedInsurance) {
    return `
      <div class="quote-item">
        <span>${data.selectedInsurance.label}</span>
        <span>${data.selectedInsurance.price}/mo</span>
      </div>
    `;
  }
  return '';
}

/**
 * Generate scheduled time slot text with proper formatting
 */
function generateScheduledTimeSlotText(timeSlot: string): string {
  return timeSlot ? `between ${timeSlot}` : '';
}

/**
 * Process quote data into template variables for email rendering
 */
export function processQuoteDataForTemplate(data: QuoteEmailData): QuoteTemplateVariables {
  const currentYear = new Date().getFullYear().toString();
  const bookingUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/getquote`
    : 'https://boomboxstorage.com/getquote';

  return {
    address: data.address,
    formattedDate: formatQuoteDate(data.scheduledDate),
    scheduledTimeSlotText: generateScheduledTimeSlotText(data.scheduledTimeSlot),
    selectedPlanName: data.selectedPlanName || 'Loading Help',
    loadingHelpPrice: data.loadingHelpPrice || '---',
    totalPrice: data.totalPrice.toString(),
    currentYear,
    bookingUrl,
    storageUnitHtml: generateStorageUnitHtml(data),
    accessStorageHtml: generateAccessStorageHtml(data),
    insuranceHtml: generateInsuranceHtml(data)
  };
}

/**
 * Validate quote email data before processing
 */
export function validateQuoteEmailData(data: unknown): data is QuoteEmailData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.email === 'string' &&
    typeof obj.address === 'string' &&
    typeof obj.scheduledDate === 'string' &&
    typeof obj.selectedPlanName === 'string' &&
    typeof obj.loadingHelpPrice === 'string' &&
    typeof obj.totalPrice === 'number' &&
    typeof obj.isAccessStorage === 'boolean' &&
    typeof obj.zipCode === 'string'
  );
} 