/**
 * @fileoverview Onfleet webhook processing utilities
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (various utility functions)
 * @refactor Extracted webhook processing logic into reusable utilities
 */

import { prisma } from '@/lib/database/prismaClient';
import crypto from 'crypto';
import { sign } from 'jsonwebtoken';

// Types for webhook processing
export interface WebhookTaskDetails {
  shortId: string;
  estimatedArrivalTime?: string;
  trackingURL?: string;
  completionDetails?: {
    photoUploadId?: string;
    photoUploadIds?: string[];
    unavailableAttachments?: Array<{
      attachmentType: string;
      attachmentId?: string;
    }>;
    drivingDistance?: number;
    drivingTime?: number;
    time?: number;
  };
  metadata?: Array<{
    name: string;
    value: string;
  }>;
  worker?: {
    name?: string;
  };
}

export interface WebhookWorkerData {
  name?: string;
}

/**
 * Extracts delivery photo URL from task completion details
 * Handles multiple photo attachment formats from Onfleet
 */
export function extractDeliveryPhotoUrl(taskDetails: WebhookTaskDetails): string | null {
  const completionDetails = taskDetails.completionDetails || {};
  
  // Try photoUploadId first
  if (completionDetails.photoUploadId) {
    return `https://d15p8tr8p0vffz.cloudfront.net/${completionDetails.photoUploadId}/800x.png`;
  }
  
  // Try photoUploadIds array
  if (completionDetails.photoUploadIds && completionDetails.photoUploadIds.length > 0) {
    return `https://d15p8tr8p0vffz.cloudfront.net/${completionDetails.photoUploadIds[0]}/800x.png`;
  }
  
  // Fallback: unavailableAttachments (timing issue workaround)
  if (completionDetails.unavailableAttachments && completionDetails.unavailableAttachments.length > 0) {
    const photoAttachment = completionDetails.unavailableAttachments.find(
      (attachment) => attachment.attachmentType === 'PHOTO'
    );
    if (photoAttachment && photoAttachment.attachmentId) {
      return `https://d15p8tr8p0vffz.cloudfront.net/${photoAttachment.attachmentId}/800x.png`;
    }
  }
  
  return null;
}

/**
 * Creates a tracking token for appointment tracking
 */
export function createTrackingToken(data: {
  appointmentId: number;
  taskId: string;
  webhookTime: number;
  eta?: string;
  triggerName: string;
}): string {
  const tokenData = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return sign(tokenData, process.env.JWT_SECRET!);
}

/**
 * Creates a feedback token for completed deliveries
 */
export function createFeedbackToken(taskShortId: string, expiryDays: number = 30): string {
  const feedbackTokenData = {
    taskShortId,
    exp: Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60)
  };
  
  return sign(feedbackTokenData, process.env.JWT_SECRET!);
}

/**
 * Generates or retrieves tracking token for packing supply orders
 */
export async function ensurePackingSupplyTrackingToken(orderId: number): Promise<string> {
  const order = await prisma.packingSupplyOrder.findUnique({
    where: { id: orderId },
    select: { trackingToken: true }
  });

  if (order?.trackingToken) {
    return order.trackingToken;
  }

  // Generate new tracking token
  const trackingToken = crypto.randomBytes(16).toString('hex');
  await prisma.packingSupplyOrder.update({
    where: { id: orderId },
    data: { trackingToken }
  });

  return trackingToken;
}

/**
 * Calculates individual task metrics from completion details
 */
export function calculateIndividualTaskMetrics(taskDetails: WebhookTaskDetails) {
  const completionDetails = taskDetails.completionDetails || {};
  
  return {
    drivingDistance: completionDetails.drivingDistance || 0,
    drivingTime: completionDetails.drivingTime || 0,
    stopsCount: 1
  };
}

/**
 * Converts webhook timestamp to proper Date object
 * Handles both seconds and milliseconds timestamps
 */
export function convertWebhookTimestamp(time: number): Date {
  // Check if timestamp is already in milliseconds (timestamp > year 2001 in seconds)
  if (time > 9999999999) {
    return new Date(time);
  } else {
    // Convert from seconds to milliseconds
    return new Date(time * 1000);
  }
}

/**
 * Gets worker name from various sources
 */
export function getWorkerName(worker?: WebhookWorkerData, assignedDriver?: any): string {
  if (worker?.name) {
    return worker.name;
  }
  
  if (assignedDriver?.firstName && assignedDriver?.lastName) {
    return `${assignedDriver.firstName} ${assignedDriver.lastName}`;
  }
  
  return 'Your delivery driver';
}

/**
 * Extracts metadata value by name from task metadata
 */
export function getMetadataValue(metadata: Array<{ name: string; value: string }> | undefined, name: string): string | null {
  if (!metadata) return null;
  
  const item = metadata.find(m => m.name === name);
  return item?.value || null;
}

/**
 * Updates OnfleetTask with completion photo and marks as complete
 */
export async function updateTaskCompletionPhoto(taskDetails: WebhookTaskDetails): Promise<void> {
  const completionPhotoUrl = extractDeliveryPhotoUrl(taskDetails);
  
  await prisma.onfleetTask.update({
    where: { shortId: taskDetails.shortId },
    data: { 
      completionPhotoUrl: completionPhotoUrl,
      completedAt: new Date(),
      needsPhotoProcessing: false
    }
  });
}

/**
 * Builds tracking URL for customer notifications
 */
export function buildTrackingUrl(trackingToken: string, type: 'appointment' | 'packing-supply' = 'appointment'): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (type === 'packing-supply') {
    return `${baseUrl}/packing-supplies/tracking/${trackingToken}`;
  }
  
  return `${baseUrl}/tracking/${trackingToken}`;
}

/**
 * Builds feedback URL for completed services
 */
export function buildFeedbackUrl(feedbackToken: string, type: 'appointment' | 'packing-supply' = 'appointment'): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (type === 'packing-supply') {
    return `${baseUrl}/packing-supplies/feedback/${feedbackToken}`;
  }
  
  return `${baseUrl}/feedback/${feedbackToken}`;
} 

// Re-export commonly used utilities from the webhookProcessing module
export { sendPayoutNotificationSMS } from './onfleetWebhookProcessing';