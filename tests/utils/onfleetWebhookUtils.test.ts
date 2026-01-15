/**
 * @fileoverview Tests for Onfleet webhook utility functions
 * Specifically tests extractAllDeliveryPhotoUrls for multi-photo extraction
 */

// Mock the prisma client and external dependencies to avoid Stripe import chain
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {}
}));

jest.mock('@/lib/utils/onfleetWebhookProcessing', () => ({
  sendPayoutNotificationSMS: jest.fn()
}));

import {
  extractDeliveryPhotoUrl,
  extractAllDeliveryPhotoUrls,
  type WebhookTaskDetails
} from '@/lib/utils/onfleetWebhookUtils';

describe('extractAllDeliveryPhotoUrls', () => {
  const CLOUDFRONT_BASE = 'https://d15p8tr8p0vffz.cloudfront.net';

  it('should return empty array when completionDetails is null', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: null
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([]);
  });

  it('should return empty array when completionDetails is undefined', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123'
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([]);
  });

  it('should return empty array when no photos are present', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        drivingDistance: 5.2,
        drivingTime: 600
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([]);
  });

  it('should return single photo URL when photoUploadId is provided', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadId: 'photo-123'
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([`${CLOUDFRONT_BASE}/photo-123/800x.png`]);
  });

  it('should return multiple photo URLs when photoUploadIds array is provided', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadIds: ['photo-1', 'photo-2', 'photo-3']
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([
      `${CLOUDFRONT_BASE}/photo-1/800x.png`,
      `${CLOUDFRONT_BASE}/photo-2/800x.png`,
      `${CLOUDFRONT_BASE}/photo-3/800x.png`
    ]);
  });

  it('should prefer photoUploadIds over photoUploadId when both are present', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadId: 'single-photo',
        photoUploadIds: ['array-photo-1', 'array-photo-2']
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([
      `${CLOUDFRONT_BASE}/array-photo-1/800x.png`,
      `${CLOUDFRONT_BASE}/array-photo-2/800x.png`
    ]);
  });

  it('should return single photo when photoUploadIds has one element', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadIds: ['only-one-photo']
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([`${CLOUDFRONT_BASE}/only-one-photo/800x.png`]);
  });

  it('should fallback to unavailableAttachments when no photoUploadIds', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        unavailableAttachments: [
          { attachmentType: 'PHOTO', attachmentId: 'attachment-photo-1' },
          { attachmentType: 'PHOTO', attachmentId: 'attachment-photo-2' }
        ]
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([
      `${CLOUDFRONT_BASE}/attachment-photo-1/800x.png`,
      `${CLOUDFRONT_BASE}/attachment-photo-2/800x.png`
    ]);
  });

  it('should only include PHOTO attachments from unavailableAttachments', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        unavailableAttachments: [
          { attachmentType: 'PHOTO', attachmentId: 'photo-attach' },
          { attachmentType: 'SIGNATURE', attachmentId: 'sig-attach' },
          { attachmentType: 'PHOTO', attachmentId: 'photo-attach-2' }
        ]
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([
      `${CLOUDFRONT_BASE}/photo-attach/800x.png`,
      `${CLOUDFRONT_BASE}/photo-attach-2/800x.png`
    ]);
  });

  it('should skip attachments without attachmentId', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        unavailableAttachments: [
          { attachmentType: 'PHOTO', attachmentId: 'valid-photo' },
          { attachmentType: 'PHOTO' }, // no attachmentId
          { attachmentType: 'PHOTO', attachmentId: undefined }
        ]
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([`${CLOUDFRONT_BASE}/valid-photo/800x.png`]);
  });

  it('should return empty array when photoUploadIds is empty array', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadIds: []
      }
    };

    const result = extractAllDeliveryPhotoUrls(taskDetails);
    expect(result).toEqual([]);
  });
});

describe('extractDeliveryPhotoUrl (existing function)', () => {
  const CLOUDFRONT_BASE = 'https://d15p8tr8p0vffz.cloudfront.net';

  it('should return only the first photo URL when multiple are provided', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadIds: ['first-photo', 'second-photo', 'third-photo']
      }
    };

    const result = extractDeliveryPhotoUrl(taskDetails);
    expect(result).toBe(`${CLOUDFRONT_BASE}/first-photo/800x.png`);
  });

  it('should return null when no photos are present', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {}
    };

    const result = extractDeliveryPhotoUrl(taskDetails);
    expect(result).toBeNull();
  });
});

describe('extractAllDeliveryPhotoUrls consistency with extractDeliveryPhotoUrl', () => {
  it('first element of extractAllDeliveryPhotoUrls should match extractDeliveryPhotoUrl', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadIds: ['photo-1', 'photo-2', 'photo-3']
      }
    };

    const allUrls = extractAllDeliveryPhotoUrls(taskDetails);
    const singleUrl = extractDeliveryPhotoUrl(taskDetails);

    expect(allUrls[0]).toBe(singleUrl);
  });

  it('should both return same result for single photo', () => {
    const taskDetails: WebhookTaskDetails = {
      shortId: 'abc123',
      completionDetails: {
        photoUploadId: 'single-photo'
      }
    };

    const allUrls = extractAllDeliveryPhotoUrls(taskDetails);
    const singleUrl = extractDeliveryPhotoUrl(taskDetails);

    expect(allUrls.length).toBe(1);
    expect(allUrls[0]).toBe(singleUrl);
  });
});

