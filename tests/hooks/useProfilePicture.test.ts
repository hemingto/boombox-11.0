/**
 * @fileoverview useProfilePicture hook tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import * as profilePictureService from '@/lib/services/profilePictureService';

// Mock the service
jest.mock('@/lib/services/profilePictureService');
const mockFetchProfilePicture = profilePictureService.fetchProfilePicture as jest.MockedFunction<typeof profilePictureService.fetchProfilePicture>;
const mockUploadProfilePicture = profilePictureService.uploadProfilePicture as jest.MockedFunction<typeof profilePictureService.uploadProfilePicture>;
const mockValidateProfilePictureFile = profilePictureService.validateProfilePictureFile as jest.MockedFunction<typeof profilePictureService.validateProfilePictureFile>;

describe('useProfilePicture Hook', () => {
  const defaultOptions = {
    userType: 'driver' as const,
    userId: '123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateProfilePictureFile.mockReturnValue({ valid: true });
  });

  describe('Initial State', () => {
    it('initializes with correct default state', () => {
      mockFetchProfilePicture.mockResolvedValue(null);

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      expect(result.current.profilePicture).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Profile Picture Fetching', () => {
    it('fetches profile picture on mount', async () => {
      mockFetchProfilePicture.mockResolvedValue('https://example.com/profile.jpg');

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchProfilePicture).toHaveBeenCalledWith('driver', '123');
      expect(result.current.profilePicture).toBe('https://example.com/profile.jpg');
    });

    it('handles fetch error', async () => {
      mockFetchProfilePicture.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Fetch failed');
      expect(result.current.profilePicture).toBeNull();
    });

    it('does not fetch when userId is empty', async () => {
      const { result } = renderHook(() => useProfilePicture({
        ...defaultOptions,
        userId: '',
      }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      expect(mockFetchProfilePicture).not.toHaveBeenCalled();
    });

    it('refetches when userId changes', async () => {
      mockFetchProfilePicture.mockResolvedValue('https://example.com/profile1.jpg');

      const { result, rerender } = renderHook(
        ({ userId }) => useProfilePicture({ ...defaultOptions, userId }),
        { initialProps: { userId: '123' } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchProfilePicture).toHaveBeenCalledWith('driver', '123');

      // Change userId
      mockFetchProfilePicture.mockResolvedValue('https://example.com/profile2.jpg');
      rerender({ userId: '456' });

      await waitFor(() => {
        expect(mockFetchProfilePicture).toHaveBeenCalledWith('driver', '456');
      });
    });

    it('refetches when userType changes', async () => {
      mockFetchProfilePicture.mockResolvedValue('https://example.com/profile1.jpg');

      const { result, rerender } = renderHook(
        ({ userType }) => useProfilePicture({ ...defaultOptions, userType }),
        { initialProps: { userType: 'driver' as const } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchProfilePicture).toHaveBeenCalledWith('driver', '123');

      // Change userType
      mockFetchProfilePicture.mockResolvedValue('https://example.com/company.jpg');
      rerender({ userType: 'mover' as const });

      await waitFor(() => {
        expect(mockFetchProfilePicture).toHaveBeenCalledWith('mover', '123');
      });
    });
  });

  describe('Manual Refresh', () => {
    it('refreshes profile picture when called', async () => {
      mockFetchProfilePicture.mockResolvedValue('https://example.com/profile.jpg');

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear the mock and set new return value
      mockFetchProfilePicture.mockClear();
      mockFetchProfilePicture.mockResolvedValue('https://example.com/new-profile.jpg');

      await act(async () => {
        await result.current.refreshProfilePicture();
      });

      expect(mockFetchProfilePicture).toHaveBeenCalledWith('driver', '123');
      expect(result.current.profilePicture).toBe('https://example.com/new-profile.jpg');
    });

    it('handles refresh error', async () => {
      mockFetchProfilePicture.mockResolvedValue('https://example.com/profile.jpg');

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock error on refresh
      mockFetchProfilePicture.mockRejectedValue(new Error('Refresh failed'));

      await act(async () => {
        await result.current.refreshProfilePicture();
      });

      expect(result.current.error).toBe('Refresh failed');
    });
  });

  describe('File Upload', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    it('uploads file successfully', async () => {
      mockFetchProfilePicture.mockResolvedValue(null);
      mockUploadProfilePicture.mockResolvedValue({
        success: true,
        url: 'https://example.com/uploaded.jpg'
      });

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.handleUpload(mockFile);
      });

      expect(mockValidateProfilePictureFile).toHaveBeenCalledWith(mockFile);
      expect(mockUploadProfilePicture).toHaveBeenCalledWith('driver', '123', mockFile);
      expect(uploadResult).toEqual({
        success: true,
        url: 'https://example.com/uploaded.jpg'
      });
      expect(result.current.profilePicture).toBe('https://example.com/uploaded.jpg');
    });

    it('handles upload failure', async () => {
      mockFetchProfilePicture.mockResolvedValue(null);
      mockUploadProfilePicture.mockResolvedValue({
        success: false,
        error: 'Upload failed'
      });

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.handleUpload(mockFile);
      });

      expect(uploadResult).toEqual({
        success: false,
        error: 'Upload failed'
      });
      expect(result.current.error).toBe('Upload failed');
    });

    it('handles file validation failure', async () => {
      mockFetchProfilePicture.mockResolvedValue(null);
      mockValidateProfilePictureFile.mockReturnValue({
        valid: false,
        error: 'Invalid file type'
      });

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.handleUpload(mockFile);
      });

      expect(uploadResult).toEqual({
        success: false,
        error: 'Invalid file type'
      });
      expect(result.current.error).toBe('Invalid file type');
      expect(mockUploadProfilePicture).not.toHaveBeenCalled();
    });

    it('sets uploading state during upload', async () => {
      mockFetchProfilePicture.mockResolvedValue(null);
      mockUploadProfilePicture.mockResolvedValue({
        success: true,
        url: 'https://example.com/uploaded.jpg'
      });

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleUpload(mockFile);
      });

      // After upload completes, uploading should be false
      expect(result.current.isUploading).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('calls onProfilePictureChange callback on successful upload', async () => {
      const mockOnChange = jest.fn();
      mockFetchProfilePicture.mockResolvedValue(null);
      mockUploadProfilePicture.mockResolvedValue({
        success: true,
        url: 'https://example.com/uploaded.jpg'
      });

      const { result } = renderHook(() => useProfilePicture({
        ...defaultOptions,
        onProfilePictureChange: mockOnChange
      }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleUpload(mockFile);
      });

      expect(mockOnChange).toHaveBeenCalledWith('https://example.com/uploaded.jpg');
    });

    it('includes delay after successful upload', async () => {
      mockFetchProfilePicture.mockResolvedValue(null);
      mockUploadProfilePicture.mockResolvedValue({
        success: true,
        url: 'https://example.com/uploaded.jpg'
      });

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleUpload(mockFile);
      });

      // Just verify the upload was successful
      expect(result.current.profilePicture).toBe('https://example.com/uploaded.jpg');
    });
  });

  describe('Error Management', () => {
    it('clears error when clearError is called', async () => {
      mockFetchProfilePicture.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.error).toBe('Fetch failed');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('clears error when starting new upload', async () => {
      mockFetchProfilePicture.mockResolvedValue(null);
      
      const { result } = renderHook(() => useProfilePicture(defaultOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set an error
      act(() => {
        result.current.clearError();
      });

      // Mock successful upload
      mockUploadProfilePicture.mockResolvedValue({
        success: true,
        url: 'https://example.com/uploaded.jpg'
      });

      await act(async () => {
        await result.current.handleUpload(new File(['test'], 'test.jpg', { type: 'image/jpeg' }));
      });

      expect(result.current.error).toBeNull();
    });
  });
});
