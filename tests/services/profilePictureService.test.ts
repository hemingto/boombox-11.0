/**
 * @fileoverview ProfilePictureService tests
 */

import { 
  fetchProfilePicture, 
  uploadProfilePicture, 
  validateProfilePictureFile 
} from '@/lib/services/profilePictureService';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ProfilePictureService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProfilePicture', () => {
    it('fetches driver profile picture successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ profilePicture: 'https://example.com/profile.jpg' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchProfilePicture('driver', '123');

      expect(mockFetch).toHaveBeenCalledWith('/api/drivers/123/profile-picture');
      expect(result).toBe('https://example.com/profile.jpg');
    });

    it('fetches mover profile picture successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ url: 'https://example.com/company.jpg' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchProfilePicture('mover', '456');

      expect(mockFetch).toHaveBeenCalledWith('/api/moving-partners/456/profile-picture');
      expect(result).toBe('https://example.com/company.jpg');
    });

    it('returns null when profile picture not found (404)', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchProfilePicture('driver', '123');

      expect(result).toBeNull();
    });

    it('throws error on server error', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(fetchProfilePicture('driver', '123')).rejects.toThrow('Failed to fetch profile picture');
    });

    it('handles different response data structures', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ profilePictureUrl: 'https://example.com/alt.jpg' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchProfilePicture('driver', '123');

      expect(result).toBe('https://example.com/alt.jpg');
    });

    it('throws error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchProfilePicture('driver', '123')).rejects.toThrow('Network error');
    });
  });

  describe('uploadProfilePicture', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    it('uploads driver profile picture successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ url: 'https://example.com/uploaded.jpg' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await uploadProfilePicture('driver', '123', mockFile);

      expect(mockFetch).toHaveBeenCalledWith('/api/drivers/123/upload-profile-picture', {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(result).toEqual({
        success: true,
        url: 'https://example.com/uploaded.jpg',
        message: 'Profile picture uploaded successfully'
      });
    });

    it('uploads mover profile picture successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ url: 'https://example.com/uploaded.jpg' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await uploadProfilePicture('mover', '456', mockFile);

      expect(mockFetch).toHaveBeenCalledWith('/api/moving-partners/456/upload-profile-picture', {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(result.success).toBe(true);
    });

    it('handles upload failure', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Upload failed' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await uploadProfilePicture('driver', '123', mockFile);

      expect(result).toEqual({
        success: false,
        error: 'Upload failed'
      });
    });

    it('handles network error during upload', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await uploadProfilePicture('driver', '123', mockFile);

      expect(result).toEqual({
        success: false,
        error: 'Network error'
      });
    });

    it('creates FormData with correct file', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ url: 'https://example.com/uploaded.jpg' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await uploadProfilePicture('driver', '123', mockFile);

      const formDataCall = mockFetch.mock.calls[0][1];
      expect(formDataCall?.body).toBeInstanceOf(FormData);
    });
  });

  describe('validateProfilePictureFile', () => {
    it('validates valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = validateProfilePictureFile(file);
      
      expect(result).toEqual({ valid: true });
    });

    it('validates valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = validateProfilePictureFile(file);
      
      expect(result).toEqual({ valid: true });
    });

    it('validates valid WebP file', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      
      const result = validateProfilePictureFile(file);
      
      expect(result).toEqual({ valid: true });
    });

    it('rejects non-image file', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const result = validateProfilePictureFile(file);
      
      expect(result).toEqual({
        valid: false,
        error: 'Please select an image file'
      });
    });

    it('rejects unsupported image format', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      
      const result = validateProfilePictureFile(file);
      
      expect(result).toEqual({
        valid: false,
        error: 'Please select a JPEG, PNG, or WebP image'
      });
    });

    it('rejects file that is too large', () => {
      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      const result = validateProfilePictureFile(largeFile);
      
      expect(result).toEqual({
        valid: false,
        error: 'File size must be less than 10MB'
      });
    });

    it('accepts file at size limit', () => {
      // Create a file exactly at 10MB
      const maxSizeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'max.jpg', { type: 'image/jpeg' });
      
      const result = validateProfilePictureFile(maxSizeFile);
      
      expect(result).toEqual({ valid: true });
    });
  });
});
