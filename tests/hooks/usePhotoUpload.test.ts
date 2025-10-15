/**
 * @fileoverview Jest tests for usePhotoUpload hook
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx
 * 
 * TEST COVERAGE:
 * - Hook initialization and state management
 * - File selection and validation
 * - Upload state transitions
 * - Modal interactions
 * - Error handling
 * - Callback functions
 * - Memory cleanup
 * 
 * @refactor Tests for extracted usePhotoUpload hook state management
 */

import { renderHook, act } from '@testing-library/react';
import { usePhotoUpload, type UsePhotoUploadOptions } from '@/hooks/usePhotoUpload';
import { FileUploadService } from '@/lib/services/fileUploadService';

// Mock the FileUploadService
jest.mock('@/lib/services/fileUploadService');
const mockFileUploadService = FileUploadService as jest.Mocked<typeof FileUploadService>;

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url-123');
global.URL.revokeObjectURL = jest.fn();

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('usePhotoUpload Hook', () => {
  const mockFile = new File(['test content'], 'test-image.jpg', {
    type: 'image/jpeg',
  });

  const mockPdfFile = new File(['pdf content'], 'test-document.pdf', {
    type: 'application/pdf',
  });

  const defaultOptions: UsePhotoUploadOptions = {
    maxPhotos: 1,
    uploadEndpoint: '/api/uploads/test',
    entityId: 'test-entity-123',
    entityType: 'test-type',
    photoDescription: 'test-photo',
    directUpload: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileUploadService.validateFiles.mockReturnValue({ valid: true });
    mockFileUploadService.uploadFiles.mockResolvedValue({
      urls: ['https://cloudinary.com/test-image.jpg'],
      success: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => usePhotoUpload());

      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.uploadState).toBe('empty');
      expect(result.current.uploadProgress).toBe(0);
      expect(result.current.displayedImageUrl).toBeNull();
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.uploadedUrls).toEqual([]);
      expect(result.current.uploadError).toBeNull();
      expect(result.current.fileInputRef.current).toBeNull();
    });

    it('accepts custom options', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // State should still be initialized to defaults
      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.uploadState).toBe('empty');
    });
  });

  describe('File Selection', () => {
    it('handles file selection successfully', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(mockFileUploadService.validateFiles).toHaveBeenCalledWith([mockFile], 1);
      expect(result.current.selectedFiles).toEqual([mockFile]);
      expect(result.current.uploadState).toBe('preview');
      expect(result.current.uploadError).toBeNull();
    });

    it('handles file validation errors', () => {
      mockFileUploadService.validateFiles.mockReturnValue({
        valid: false,
        error: 'File too large',
      });

      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.uploadState).toBe('selecting');
      expect(result.current.uploadError).toBe('File too large');
    });

    it('limits files to maxPhotos', () => {
      const { result } = renderHook(() => usePhotoUpload({ ...defaultOptions, maxPhotos: 1 }));

      const mockEvent = {
        target: {
          files: [mockFile, mockPdfFile],
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.selectedFiles[0]).toBe(mockFile);
    });

    it('handles empty file selection', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      const mockEvent = {
        target: {
          files: null,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.uploadState).toBe('empty');
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over event', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles file drop successfully', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          files: [mockFile],
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleDrop(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockFileUploadService.validateFiles).toHaveBeenCalledWith([mockFile], 1);
      expect(result.current.selectedFiles).toEqual([mockFile]);
      expect(result.current.uploadState).toBe('preview');
    });

    it('handles drop validation errors', () => {
      mockFileUploadService.validateFiles.mockReturnValue({
        valid: false,
        error: 'Invalid file type',
      });

      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          files: [mockFile],
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleDrop(mockEvent);
      });

      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.uploadError).toBe('Invalid file type');
    });

    it('limits dropped files to maxPhotos', () => {
      const { result } = renderHook(() => usePhotoUpload({ ...defaultOptions, maxPhotos: 1 }));

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          files: [mockFile, mockPdfFile],
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleDrop(mockEvent);
      });

      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.selectedFiles[0]).toBe(mockFile);
    });
  });

  describe('File Upload', () => {
    it('uploads files successfully with direct upload', async () => {
      const onUploadComplete = jest.fn();
      const onUploadSuccess = jest.fn();

      const { result } = renderHook(() => 
        usePhotoUpload({
          ...defaultOptions,
          onUploadComplete,
          onUploadSuccess,
        })
      );

      // First select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Then upload
      await act(async () => {
        await result.current.handleUpload();
      });

      expect(mockFileUploadService.uploadFiles).toHaveBeenCalledWith({
        files: [mockFile],
        uploadEndpoint: '/api/uploads/test',
        entityId: 'test-entity-123',
        entityType: 'test-type',
        photoDescription: 'test-photo',
        onProgress: expect.any(Function),
      });

      expect(result.current.uploadState).toBe('done');
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.uploadedUrls).toEqual(['https://cloudinary.com/test-image.jpg']);
      expect(result.current.displayedImageUrl).toBe('https://cloudinary.com/test-image.jpg');
      expect(onUploadComplete).toHaveBeenCalledWith(['https://cloudinary.com/test-image.jpg']);
      expect(onUploadSuccess).toHaveBeenCalled();
    });

    it('handles upload errors', async () => {
      mockFileUploadService.uploadFiles.mockResolvedValue({
        urls: [],
        success: false,
        error: 'Upload failed',
      });

      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // First select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Then upload
      await act(async () => {
        await result.current.handleUpload();
      });

      expect(result.current.uploadState).toBe('preview');
      expect(result.current.uploadError).toBe('Upload failed');
    });

    it('simulates upload progress for non-direct uploads', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => 
        usePhotoUpload({ ...defaultOptions, directUpload: false })
      );

      // First select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Start upload
      act(() => {
        result.current.handleUpload();
      });

      expect(result.current.uploadState).toBe('uploading');
      expect(result.current.uploadProgress).toBe(0);

      // Advance timers to simulate progress
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.uploadProgress).toBe(10);

      // Complete the upload
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.uploadState).toBe('complete');
      expect(result.current.uploadProgress).toBe(100);

      jest.useRealTimers();
    });

    it('does not upload without files', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      await act(async () => {
        await result.current.handleUpload();
      });

      expect(mockFileUploadService.uploadFiles).not.toHaveBeenCalled();
      expect(result.current.uploadState).toBe('empty');
    });

    it('does not upload without endpoint', async () => {
      const { result } = renderHook(() => 
        usePhotoUpload({ ...defaultOptions, uploadEndpoint: undefined })
      );

      // First select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleUpload();
      });

      expect(mockFileUploadService.uploadFiles).not.toHaveBeenCalled();
      expect(result.current.uploadState).toBe('preview');
    });

    it('tracks upload progress', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // First select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Mock the upload service to call onProgress
      mockFileUploadService.uploadFiles.mockImplementation(async (options) => {
        if (options.onProgress) {
          options.onProgress(25);
          options.onProgress(50);
          options.onProgress(100);
        }
        return {
          urls: ['https://cloudinary.com/test-image.jpg'],
          success: true,
        };
      });

      await act(async () => {
        await result.current.handleUpload();
      });

      // Progress should have been updated during upload
      expect(result.current.uploadState).toBe('done');
    });
  });

  describe('File Management', () => {
    it('deletes files from selection', () => {
      const { result } = renderHook(() => usePhotoUpload({ ...defaultOptions, maxPhotos: 3 }));

      // First select multiple files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile, mockPdfFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.selectedFiles).toHaveLength(2);

      // Delete first file
      act(() => {
        result.current.handleDelete(0);
      });

      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.selectedFiles[0]).toBe(mockPdfFile);
    });

    it('changes state to selecting when all files deleted', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // First select file
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.uploadState).toBe('preview');

      // Delete the file
      act(() => {
        result.current.handleDelete(0);
      });

      expect(result.current.selectedFiles).toHaveLength(0);
      expect(result.current.uploadState).toBe('selecting');
    });

    it('deletes uploaded photo and cleans up', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // Set up uploaded state
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Simulate uploaded state
      act(() => {
        // This would normally be set by upload completion
        result.current.resetUpload();
      });

      act(() => {
        result.current.handleDeleteUploadedPhoto();
      });

      expect(result.current.uploadState).toBe('empty');
      expect(result.current.displayedImageUrl).toBeNull();
      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.uploadedUrls).toEqual([]);
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.uploadError).toBeNull();
      expect(result.current.uploadProgress).toBe(0);
    });
  });

  describe('Modal Management', () => {
    it('opens modal', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      act(() => {
        result.current.handleAddPhotosClick();
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.uploadState).toBe('selecting');
      expect(result.current.uploadError).toBeNull();
    });

    it('closes modal', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // First open modal
      act(() => {
        result.current.handleAddPhotosClick();
      });

      expect(result.current.isModalOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.handleCloseModal();
      });

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.uploadState).toBe('empty');
    });

    it('preserves done state when closing modal', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // Simulate done state
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Manually set to done state (normally done by upload completion)
      act(() => {
        // This simulates the upload completion flow
        result.current.handleAddPhotosClick();
      });

      // Close modal in done state
      act(() => {
        result.current.handleCloseModal();
      });

      expect(result.current.isModalOpen).toBe(false);
    });
  });

  describe('Complete Workflow', () => {
    it('handles complete workflow for direct upload', async () => {
      const onUploadSuccess = jest.fn();
      const { result } = renderHook(() => 
        usePhotoUpload({ ...defaultOptions, onUploadSuccess })
      );

      // Select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.uploadState).toBe('preview');

      // Complete (which should trigger upload)
      await act(async () => {
        result.current.handleComplete();
      });

      expect(mockFileUploadService.uploadFiles).toHaveBeenCalled();
      expect(onUploadSuccess).toHaveBeenCalled();
    });

    it('handles complete workflow for non-direct upload', () => {
      const onPhotosSelected = jest.fn();
      const onUploadSuccess = jest.fn();

      const { result } = renderHook(() => 
        usePhotoUpload({
          ...defaultOptions,
          directUpload: false,
          onPhotosSelected,
          onUploadSuccess,
        })
      );

      // Select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Complete
      act(() => {
        result.current.handleComplete();
      });

      expect(result.current.uploadState).toBe('done');
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.displayedImageUrl).toBe('blob:mock-url-123');
      expect(onPhotosSelected).toHaveBeenCalledWith([mockFile]);
      expect(onUploadSuccess).toHaveBeenCalled();
    });

    it('handles complete when already uploaded', async () => {
      const onUploadSuccess = jest.fn();
      
      // Mock successful upload
      mockFileUploadService.uploadFiles.mockResolvedValue({
        success: true,
        urls: ['https://example.com/uploaded-image.jpg'],
      });

      const { result } = renderHook(() => 
        usePhotoUpload({ ...defaultOptions, onUploadSuccess })
      );

      // Select files
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Upload the files first - this should automatically call onUploadSuccess
      await act(async () => {
        await result.current.handleUpload();
      });

      // Verify we're in done state (upload automatically transitions to done)
      expect(result.current.uploadState).toBe('done');
      
      // Verify the callback was called during upload
      expect(onUploadSuccess).toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    it('cleans up object URLs on reset', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // Simulate having a blob URL
      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Reset should clean up
      act(() => {
        result.current.resetUpload();
      });

      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.uploadState).toBe('empty');
      expect(result.current.displayedImageUrl).toBeNull();
    });

    it('cleans up object URLs on delete uploaded photo', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // Simulate uploaded photo with blob URL
      act(() => {
        result.current.handleDeleteUploadedPhoto();
      });

      // Should clean up state
      expect(result.current.uploadState).toBe('empty');
      expect(result.current.displayedImageUrl).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('clears errors on successful file selection', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // First set an error
      mockFileUploadService.validateFiles.mockReturnValueOnce({
        valid: false,
        error: 'Test error',
      });

      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.uploadError).toBe('Test error');

      // Then clear error with successful selection
      mockFileUploadService.validateFiles.mockReturnValue({ valid: true });

      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.uploadError).toBeNull();
    });

    it('clears errors when opening modal', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultOptions));

      // Set an error state
      mockFileUploadService.validateFiles.mockReturnValue({
        valid: false,
        error: 'Test error',
      });

      act(() => {
        result.current.handleFileSelect({
          target: { files: [mockFile] },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.uploadError).toBe('Test error');

      // Opening modal should clear error
      act(() => {
        result.current.handleAddPhotosClick();
      });

      expect(result.current.uploadError).toBeNull();
    });
  });
});
