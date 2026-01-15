/**
 * @fileoverview Twilio SMS client for messaging services
 * @source boombox-10.0/src/app/lib/twilio/twilio.ts
 * @refactor Moved to integrations directory with NO LOGIC CHANGES
 */

import Twilio from 'twilio';
import { formatCurrency } from '@/lib/utils/currencyUtils';

// Initialize Twilio client only if credentials are available
// This allows the app to run without Twilio in development
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

// Only initialize Twilio if credentials are properly formatted
const hasValidTwilioCredentials = 
  twilioAccountSid && 
  twilioAuthToken && 
  twilioAccountSid.startsWith('AC') &&
  twilioAccountSid.length > 30; // Real Twilio Account SIDs are 34 characters

if (!hasValidTwilioCredentials) {
  console.warn('Twilio credentials not properly configured. SMS functionality will be disabled.');
}

export const twilioClient = hasValidTwilioCredentials
  ? Twilio(twilioAccountSid, twilioAuthToken)
  : null as any; // Allow app to start without throwing error

export async function sendPackingSupplyOrderConfirmationSms(
  customerPhone: string,
  orderDetails: {
    orderId: number;
    customerName: string;
    deliveryTimeText: string;
    trackingUrl: string;
    totalPrice: number;
  }
) {
  // Check if Twilio is configured
  if (
    !process.env.TWILIO_PHONE_NUMBER ||
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN
  ) {
    console.error(
      'Twilio credentials not configured. Skipping order confirmation SMS.'
    );
    return;
  }

  // Format tracking URL to be absolute
  const fullTrackingUrl = orderDetails.trackingUrl.startsWith('http')
    ? orderDetails.trackingUrl
    : `${process.env.NEXT_PUBLIC_APP_URL}${orderDetails.trackingUrl}`;

  // Create the SMS message
  const messageBody = `Hi ${orderDetails.customerName}! 📦 Your Boombox packing supply order #${orderDetails.orderId} has been confirmed (${formatCurrency(orderDetails.totalPrice)}). 

📧 A receipt was sent to your email.

🚚 Expected delivery: ${orderDetails.deliveryTimeText}

📱 Track your order: ${fullTrackingUrl}

Thanks for choosing Boombox!`;

  try {
    await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone,
    });
    console.log(
      `Order confirmation SMS sent to ${customerPhone} for order #${orderDetails.orderId}`
    );
  } catch (error: unknown) {
    console.error('Error sending order confirmation SMS via Twilio:', error);
    throw error;
  }
}
