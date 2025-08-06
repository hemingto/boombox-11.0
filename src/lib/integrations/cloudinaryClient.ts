/**
 * @fileoverview Cloudinary client configuration for file upload services
 * @source boombox-10.0/src/app/lib/cloudinary/cloudinary.ts
 * @refactor PHASE 4 - Moved to integrations directory with proper documentation
 * 
 * Cloudinary configuration for:
 * - Image and file uploads
 * - Cleaning photos for storage units
 * - Damage photos documentation
 * - General file storage needs
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary; 