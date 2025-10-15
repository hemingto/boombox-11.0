/**
 * @fileoverview Jest tests for FileUploadService
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx
 * 
 * TEST COVERAGE:
 * - File upload functionality with XMLHttpRequest
 * - Progress tracking
 * - Error handling
 * - File validation
 * - Preview URL management
 * - Response parsing
 * 
 * @refactor Tests for extracted FileUploadService business logic
 */

import { FileUploadService, type FileUploadOptions } from '@/lib/services/fileUploadService';

// Mock XMLHttpRequest
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  upload: {
    onprogress: null as any,
  },
  onload: null as any,
  onerror: null as any,
  status: 200,
  responseText: '',
};

(global as any).XMLHttpRequest = jest.fn(() => mockXHR);

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url-123');
global.URL.revokeObjectURL = jest.fn();

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('FileUploadService', () => {
  const mockFile = new File(['test content'], 'test-image.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  beforeEach(() => {
    // Clear mock call history but preserve the spy setup
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    
    // Reset XHR mock state
    mockXHR.status = 200;
    mockXHR.responseText = '{"urls": ["https://cloudinary.com/test-image.jpg"]}';
  });

  const mockPdfFile = new File(['pdf content'], 'test-document.pdf', {
    type: 'application/pdf',
    lastModified: Date.now(),
  });

  const mockLargeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large-image.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockXHR.status = 200;
    mockXHR.responseText = JSON.stringify({ urls: ['https://cloudinary.com/test-image.jpg'] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadFiles', () => {
    const defaultOptions: FileUploadOptions = {
      files: [mockFile],
      uploadEndpoint: '/api/uploads/test',
      entityId: 'test-entity-123',
      entityType: 'test-type',
      photoDescription: 'test-photo',
    };

    it('uploads files successfully', async () => {
      const onProgress = jest.fn();
      const options = { ...defaultOptions, onProgress };

      // Mock successful response
      mockXHR.responseText = JSON.stringify({ 
        urls: ['https://cloudinary.com/test-image.jpg'] 
      });

      const uploadPromise = FileUploadService.uploadFiles(options);

      // Simulate XHR success
      setTimeout(() => {
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      const result = await uploadPromise;

      expect(result.success).toBe(true);
      expect(result.urls).toEqual(['https://cloudinary.com/test-image.jpg']);
      expect(result.error).toBeUndefined();
      expect(mockXHR.open).toHaveBeenCalledWith('POST', '/api/uploads/test');
      expect(mockXHR.send).toHaveBeenCalled();
    });

    it('handles upload progress tracking', async () => {
      const onProgress = jest.fn();
      const options = { ...defaultOptions, onProgress };

      const uploadPromise = FileUploadService.uploadFiles(options);

      // Simulate progress event
      setTimeout(() => {
        if (mockXHR.upload.onprogress) {
          mockXHR.upload.onprogress({
            lengthComputable: true,
            loaded: 50,
            total: 100,
          });
        }
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      await uploadPromise;

      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('handles multiple files', async () => {
      const options = {
        ...defaultOptions,
        files: [mockFile, mockPdfFile],
      };

      mockXHR.responseText = JSON.stringify({ 
        urls: ['https://cloudinary.com/image1.jpg', 'https://cloudinary.com/doc1.pdf'] 
      });

      const uploadPromise = FileUploadService.uploadFiles(options);

      setTimeout(() => {
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      const result = await uploadPromise;

      expect(result.success).toBe(true);
      expect(result.urls).toHaveLength(2);
      expect(mockXHR.send).toHaveBeenCalled();
    });

    it('handles server errors', async () => {
      mockXHR.status = 500;
      mockXHR.responseText = JSON.stringify({ message: 'Server error' });

      const uploadPromise = FileUploadService.uploadFiles(defaultOptions);

      setTimeout(() => {
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      const result = await uploadPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed: Server error');
      expect(result.urls).toEqual([]);
    });

    it('handles network errors', async () => {
      const uploadPromise = FileUploadService.uploadFiles(defaultOptions);

      setTimeout(() => {
        if (mockXHR.onerror) {
          mockXHR.onerror();
        }
      }, 0);

      const result = await uploadPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.urls).toEqual([]);
    });

    it('handles malformed JSON response', async () => {
      mockXHR.responseText = 'invalid json';

      const uploadPromise = FileUploadService.uploadFiles(defaultOptions);

      setTimeout(() => {
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      const result = await uploadPromise;

      expect(result.success).toBe(true);
      expect(result.urls).toEqual([]);
    });

    it('handles response without urls array', async () => {
      mockXHR.responseText = JSON.stringify({ 
        url: 'https://cloudinary.com/single-image.jpg' 
      });

      const uploadPromise = FileUploadService.uploadFiles(defaultOptions);

      setTimeout(() => {
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      const result = await uploadPromise;

      expect(result.success).toBe(true);
      expect(result.urls).toEqual(['https://cloudinary.com/single-image.jpg']);
    });

    it('returns error when no files provided', async () => {
      const options = { ...defaultOptions, files: [] };

      const result = await FileUploadService.uploadFiles(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No files provided');
      expect(result.urls).toEqual([]);
      expect(mockXHR.send).not.toHaveBeenCalled();
    });

    it('returns error when no upload endpoint provided', async () => {
      const options = { ...defaultOptions, uploadEndpoint: '' };

      const result = await FileUploadService.uploadFiles(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload endpoint is required');
      expect(result.urls).toEqual([]);
      expect(mockXHR.send).not.toHaveBeenCalled();
    });

    it('includes metadata in FormData', async () => {
      const mockFormData = {
        append: jest.fn(),
      };
      (global as any).FormData = jest.fn(() => mockFormData);

      const uploadPromise = FileUploadService.uploadFiles(defaultOptions);

      setTimeout(() => {
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      await uploadPromise;

      expect(mockFormData.append).toHaveBeenCalledWith('file', mockFile);
      expect(mockFormData.append).toHaveBeenCalledWith('entityId', 'test-entity-123');
      expect(mockFormData.append).toHaveBeenCalledWith('entityType', 'test-type');
      expect(mockFormData.append).toHaveBeenCalledWith('photoDescription', 'test-photo');
    });

    it('logs upload details for debugging', async () => {
      // Create a fresh spy for this test to avoid interference
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const uploadPromise = FileUploadService.uploadFiles(defaultOptions);

      setTimeout(() => {
        if (mockXHR.onload) {
          mockXHR.onload();
        }
      }, 0);

      await uploadPromise;

      // Check that the specific log calls were made
      expect(logSpy).toHaveBeenCalledWith('Uploading files:', ['test-image.jpg']);
      expect(logSpy).toHaveBeenCalledWith('Photo description:', 'test-photo');
      expect(logSpy).toHaveBeenCalledWith('Upload endpoint:', '/api/uploads/test');
      
      // Clean up the spy
      logSpy.mockRestore();
    });
  });

  describe('validateFiles', () => {
    it('validates files successfully', () => {
      const result = FileUploadService.validateFiles([mockFile], 1);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty file array', () => {
      const result = FileUploadService.validateFiles([], 1);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No files selected');
    });

    it('rejects too many files', () => {
      const result = FileUploadService.validateFiles([mockFile, mockPdfFile], 1);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Maximum 1 file(s) allowed');
    });

    it('rejects files that are too large', () => {
      const result = FileUploadService.validateFiles([mockLargeFile], 1, 10 * 1024 * 1024);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('is too large');
      expect(result.error).toContain('large-image.jpg');
    });

    it('accepts PDF files', () => {
      const result = FileUploadService.validateFiles([mockPdfFile], 1);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts image files', () => {
      const result = FileUploadService.validateFiles([mockFile], 1);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects unsupported file types', () => {
      const unsupportedFile = new File(['content'], 'test.txt', {
        type: 'text/plain',
      });

      const result = FileUploadService.validateFiles([unsupportedFile], 1);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not a supported format');
      expect(result.error).toContain('test.txt');
    });

    it('validates multiple files', () => {
      const result = FileUploadService.validateFiles([mockFile, mockPdfFile], 3);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('uses custom max size', () => {
      const smallMaxSize = 1024; // 1KB
      // Create a file larger than the custom max size
      const largeContent = 'x'.repeat(2000); // 2KB content
      const largeFile = new File([largeContent], 'large-file.jpg', {
        type: 'image/jpeg',
      });
      
      const result = FileUploadService.validateFiles([largeFile], 1, smallMaxSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('is too large');
    });
  });

  describe('createFilePreviewUrls', () => {
    it('creates preview URLs for files', () => {
      const files = [mockFile, mockPdfFile];
      const urls = FileUploadService.createFilePreviewUrls(files);

      expect(urls).toHaveLength(2);
      expect(urls[0]).toBe('blob:mock-url-123');
      expect(urls[1]).toBe('blob:mock-url-123');
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2);
    });

    it('handles empty file array', () => {
      const urls = FileUploadService.createFilePreviewUrls([]);

      expect(urls).toHaveLength(0);
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('revokeFilePreviewUrls', () => {
    it('revokes blob URLs', () => {
      const urls = ['blob:mock-url-1', 'blob:mock-url-2', 'https://external-url.com'];
      
      FileUploadService.revokeFilePreviewUrls(urls);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-1');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-2');
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalledWith('https://external-url.com');
    });

    it('handles empty URL array', () => {
      FileUploadService.revokeFilePreviewUrls([]);

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('handles non-blob URLs', () => {
      const urls = ['https://example.com/image.jpg', 'data:image/jpeg;base64,abc123'];
      
      FileUploadService.revokeFilePreviewUrls(urls);

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });
});
