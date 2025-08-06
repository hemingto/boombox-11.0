/**
 * @fileoverview External Integrations Library
 * @source Created for boombox-11.0 integrations system
 * @refactor External API clients (Onfleet, Stripe, Twilio, SendGrid)
 */

// Note: Integration clients will be added here as they are migrated
// Examples: onfleetClient, stripeClient, twilioClient, sendgridClient, etc.

// Onfleet integrations
export {
  fetchOnfleetTaskPhotos,
  fetchOnfleetTaskPhotoForStorageUnit
} from './onfleetPhotoUtils';

// Cloudinary integrations
export { default as cloudinary } from './cloudinaryClient';
