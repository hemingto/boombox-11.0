/**
 * @fileoverview Tests for Onfleet webhook signature validation utility
 * Tests HMAC-SHA512 signature verification for webhook security
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';

// Mock the config module with a getter so we can modify values between tests
let mockIsDevelopment = false;
let mockWebhookSecret: string | undefined = 'test-webhook-secret-12345';

jest.mock('@/lib/config/environment', () => ({
  get config() {
    return {
      app: {
        get isDevelopment() { return mockIsDevelopment; },
        isProduction: true,
        isTest: false
      },
      onfleet: {
        get webhookSecret() { return mockWebhookSecret; }
      }
    };
  }
}));

// Import after mocking
import { validateOnfleetSignature } from '@/lib/utils/onfleetSignatureValidation';

describe('validateOnfleetSignature', () => {
  const testSecret = 'test-webhook-secret-12345';
  const testBody = JSON.stringify({
    taskId: 'task-123',
    triggerName: 'taskCompleted',
    time: 1234567890,
    data: { task: { shortId: 'abc123' } }
  });

  /**
   * Helper to generate a valid HMAC-SHA512 signature
   */
  function generateValidSignature(body: string, secret: string): string {
    return crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');
  }

  /**
   * Helper to create a mock NextRequest with specified headers
   */
  function createMockRequest(signature: string | null): NextRequest {
    const headers = new Headers();
    if (signature !== null) {
      headers.set('X-Onfleet-Signature', signature);
    }
    
    return {
      headers: {
        get: (name: string) => headers.get(name)
      }
    } as unknown as NextRequest;
  }

  beforeEach(() => {
    // Reset to production mode with valid secret
    mockIsDevelopment = false;
    mockWebhookSecret = testSecret;
  });

  describe('in production mode', () => {
    it('should return true for valid signature', async () => {
      const validSignature = generateValidSignature(testBody, testSecret);
      const request = createMockRequest(validSignature);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', async () => {
      const invalidSignature = 'invalid-signature-that-does-not-match';
      const request = createMockRequest(invalidSignature);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(false);
    });

    it('should return false when signature header is missing', async () => {
      const request = createMockRequest(null);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(false);
    });

    it('should return false when webhook secret is not configured', async () => {
      mockWebhookSecret = undefined;
      const validSignature = generateValidSignature(testBody, testSecret);
      const request = createMockRequest(validSignature);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(false);
    });

    it('should return false when signature has wrong format (different length)', async () => {
      const shortSignature = 'abc123';
      const request = createMockRequest(shortSignature);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(false);
    });

    it('should return false when signature is tampered', async () => {
      const validSignature = generateValidSignature(testBody, testSecret);
      // Tamper with the signature by changing a character
      const tamperedSignature = validSignature.slice(0, -1) + (validSignature.slice(-1) === 'a' ? 'b' : 'a');
      const request = createMockRequest(tamperedSignature);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(false);
    });

    it('should return false when body is modified after signing', async () => {
      const validSignature = generateValidSignature(testBody, testSecret);
      const request = createMockRequest(validSignature);
      const modifiedBody = testBody.replace('task-123', 'task-456');

      const result = await validateOnfleetSignature(request, modifiedBody);

      expect(result).toBe(false);
    });

    it('should return false when signed with different secret', async () => {
      const wrongSecret = 'wrong-secret';
      const signatureWithWrongSecret = generateValidSignature(testBody, wrongSecret);
      const request = createMockRequest(signatureWithWrongSecret);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(false);
    });
  });

  describe('in development mode', () => {
    beforeEach(() => {
      mockIsDevelopment = true;
    });

    it('should return true regardless of signature', async () => {
      const request = createMockRequest('any-signature-or-none');

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(true);
    });

    it('should return true even when signature header is missing', async () => {
      const request = createMockRequest(null);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(true);
    });

    it('should return true even when webhook secret is not configured', async () => {
      mockWebhookSecret = undefined;
      const request = createMockRequest(null);

      const result = await validateOnfleetSignature(request, testBody);

      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty body', async () => {
      const emptyBody = '';
      const validSignature = generateValidSignature(emptyBody, testSecret);
      const request = createMockRequest(validSignature);

      const result = await validateOnfleetSignature(request, emptyBody);

      expect(result).toBe(true);
    });

    it('should handle special characters in body', async () => {
      const specialBody = '{"text":"Hello 👋 World! 日本語 テスト"}';
      const validSignature = generateValidSignature(specialBody, testSecret);
      const request = createMockRequest(validSignature);

      const result = await validateOnfleetSignature(request, specialBody);

      expect(result).toBe(true);
    });

    it('should handle very long body', async () => {
      const longBody = JSON.stringify({ data: 'x'.repeat(100000) });
      const validSignature = generateValidSignature(longBody, testSecret);
      const request = createMockRequest(validSignature);

      const result = await validateOnfleetSignature(request, longBody);

      expect(result).toBe(true);
    });
  });
});
