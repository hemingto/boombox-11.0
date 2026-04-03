/**
 * @fileoverview Twilio utilities for webhook validation and message parsing
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 8-44, 182-202)
 * @refactor Extracted inline Twilio validation logic to centralized utilities
 */

import 'server-only';

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { config } from '@/lib/config/environment';

/**
 * Validate Twilio request signature using HMAC-SHA1
 * @param request - Next.js request object
 * @param body - Parsed form data body
 * @returns Promise<boolean> - Whether signature is valid
 */
export async function validateTwilioRequest(
  request: NextRequest,
  body: any
): Promise<boolean> {
  // Skip validation in development
  if (config.app.isDevelopment) {
    return true;
  }

  // Get the URL of the request
  const url = request.url;

  // Get the X-Twilio-Signature header
  const headersList = await headers();
  const twilioSignature = headersList.get('x-twilio-signature');

  if (!twilioSignature || !config.twilio.authToken) {
    return false;
  }

  // Create body string by sorting keys and concatenating
  const bodyString = Object.keys(body)
    .sort()
    .reduce((acc, key) => acc + key + body[key], '');

  // Combine the URL and the request body
  const data = url + bodyString;

  // Generate the HMAC
  const hmac = crypto
    .createHmac('sha1', config.twilio.authToken)
    .update(data)
    .digest('base64');

  // Compare the signatures
  return hmac === twilioSignature;
}

/**
 * Parse Twilio inbound webhook FormData to extract phone number and message
 * @param formData - FormData from Twilio webhook
 * @returns Object with from (phone) and body (message text)
 */
export function parseInboundMessage(formData: FormData): {
  from: string;
  body: string;
} {
  const body: Record<string, string> = {};

  // Convert FormData to a plain object
  formData.forEach((value, key) => {
    body[key] = value.toString();
  });

  return {
    from: body.From || '',
    body: body.Body?.trim().toLowerCase() || '',
  };
}

/**
 * Generate temporary JWT token for SMS responses
 * @param payload - Token payload data
 * @param expiresIn - Token expiration (default: 5 minutes)
 * @returns JWT token string
 */
export function generateSmsResponseToken(
  payload: any,
  expiresIn: string = '5m'
): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, config.auth.jwtSecret, { expiresIn });
}

/**
 * Generate a secure short token for mover change responses, stored in ShortToken table
 */
export async function generateMoverChangeToken(
  tokenData: any
): Promise<string> {
  const { createShortToken, expiresIn, DURATIONS } = await import(
    '@/lib/services/shortTokenService'
  );
  return createShortToken(
    'mover_change',
    tokenData,
    expiresIn(DURATIONS.HOURS_24)
  );
}
