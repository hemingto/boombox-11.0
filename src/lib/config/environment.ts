/**
 * @fileoverview Centralized environment variable configuration and validation
 * @source Consolidated from multiple files across boombox-10.0
 * @refactor Created centralized config to replace scattered process.env usage
 */

import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Core Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1).optional(),

  // Stripe Payment Processing
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // Onfleet Logistics Integration
  ONFLEET_API_KEY: z.string().min(1),
  BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS: z.string().min(1).optional(),
  BOOMBOX_DELIVERY_NETWORK_TEAM_ID: z.string().min(1).optional(),

  // Twilio SMS
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),

  // SendGrid Email
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@boomboxstorage.com'),

  // Cloudinary Media Storage
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),

  // Cron Jobs & Internal APIs
  CRON_API_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  INTERNAL_API_SECRET: z.string().min(1).optional(),

  // Admin Configuration
  ADMIN_EMAILS: z.string().optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Environment validation failed');
  }
}

// Export validated environment configuration
export const env = validateEnv();

// Typed environment access with validation
export const config = {
  // Core Application
  app: {
    env: env.NODE_ENV,
    url: env.NEXT_PUBLIC_APP_URL,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Authentication
  auth: {
    nextAuthSecret: env.NEXTAUTH_SECRET,
    jwtSecret: env.JWT_SECRET || 'fallback-secret',
  },

  // Stripe Payment Processing
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  // Onfleet Logistics Integration
  onfleet: {
    apiKey: env.ONFLEET_API_KEY,
    packingSupplyTeamId: env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS,
    deliveryNetworkTeamId: env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID,
  },

  // Twilio SMS
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },

  // SendGrid Email
  sendgrid: {
    apiKey: env.SENDGRID_API_KEY,
    fromEmail: env.SENDGRID_FROM_EMAIL,
  },

  // Cloudinary Media Storage
  cloudinary: {
    cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },

  // Cron Jobs & Internal APIs
  cron: {
    apiSecret: env.CRON_API_SECRET,
    secret: env.CRON_SECRET,
    internalApiSecret: env.INTERNAL_API_SECRET,
  },

  // Admin Configuration
  admin: {
    emails: env.ADMIN_EMAILS?.split(',') || ['admin@boomboxstorage.com'],
  },
} as const;

// Helper functions for common environment checks
export const isProduction = () => config.app.env === 'production';
export const isDevelopment = () => config.app.env === 'development';
export const isTest = () => config.app.env === 'test';

// URL builders with proper base URL
export const buildUrl = (path: string) => {
  const baseUrl = config.app.url.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Stripe URLs
export const buildStripeUrls = (
  userType: 'driver' | 'mover',
  userId: string
) => ({
  refresh: buildUrl(`/${userType}-account-page/${userId}/payment?refresh=true`),
  return: buildUrl(`/${userType}-account-page/${userId}/payment?success=true`),
});

// Admin dashboard URLs
export const buildAdminUrls = {
  appointment: (appointmentId: number) =>
    buildUrl(`/admin/appointments/${appointmentId}`),
  task: (taskType: string, taskId: string) =>
    buildUrl(`/admin/tasks/${taskType}/${taskId}`),
  dashboard: () => buildUrl('/admin'),
};

// Tracking URLs
export const buildTrackingUrl = (trackingPath: string) => {
  return trackingPath.startsWith('http')
    ? trackingPath
    : buildUrl(trackingPath);
};

// Stripe receipt URL
export const buildStripeReceiptUrl = (paymentIntentId: string) => {
  return `https://payments.stripe.com/receipts/${paymentIntentId}/payment_intent_receipt`;
};

// Validation helpers
export const validateRequiredEnvVars = (vars: string[]) => {
  const missing = vars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Export for backward compatibility (to be removed in Phase 9)
export { env as environment };
