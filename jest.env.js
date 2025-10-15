/**
 * @fileoverview Jest Environment Setup
 * This file runs before Jest initialization to set up environment variables
 * Prevents environment validation errors during test execution
 */

// Set up test environment variables before any modules are loaded
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Database (mock URL for tests)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/boombox_test';

// Authentication (mock secrets for tests)
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-for-jest-testing-only';
process.env.JWT_SECRET = 'test-jwt-secret-for-jest-testing-only';

// Stripe Payment Processing (test keys - safe to use in tests)
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_stripe_secret_key_for_testing';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_stripe_publishable_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_stripe_webhook_secret_for_testing';

// Onfleet Logistics Integration (mock values)
process.env.ONFLEET_API_KEY = 'mock_onfleet_api_key_for_testing';
process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS = 'mock_packing_supply_team_id';
process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID = 'mock_delivery_network_team_id';

// Twilio SMS (mock values)
process.env.TWILIO_ACCOUNT_SID = 'ACmock_twilio_account_sid_for_testing';
process.env.TWILIO_AUTH_TOKEN = 'mock_twilio_auth_token_for_testing';
process.env.TWILIO_PHONE_NUMBER = '+15551234567';

// SendGrid Email (mock values)
process.env.SENDGRID_API_KEY = 'SG.mock_sendgrid_api_key_for_testing';
process.env.SENDGRID_FROM_EMAIL = 'test@boomboxstorage.com';

// Cloudinary Media Storage (mock values - optional)
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'mock_cloudinary_cloud_name';
process.env.CLOUDINARY_API_KEY = 'mock_cloudinary_api_key';
process.env.CLOUDINARY_API_SECRET = 'mock_cloudinary_api_secret';

// Cron Jobs & Internal APIs (mock values - optional)
process.env.CRON_API_SECRET = 'mock_cron_api_secret_for_testing';
process.env.CRON_SECRET = 'mock_cron_secret_for_testing';
process.env.INTERNAL_API_SECRET = 'mock_internal_api_secret_for_testing';

// Admin Configuration (optional)
process.env.ADMIN_EMAILS = 'admin@test.com,test@boomboxstorage.com';
