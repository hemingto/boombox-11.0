/**
 * @fileoverview Custom hook for profile picture management
 * @source boombox-10.0/src/app/components/reusablecomponents/profilepicture.tsx
 * 
 * HOOK FUNCTIONALITY:
 * Manages profile picture state, loading, uploading, and error handling.
 * Provides a clean interface for components to interact with profile pictures.
 * 
 * @refactor Extracted state management and business logic from ProfilePicture component
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchProfilePicture, 
  uploadProfilePicture, 
  validateProfilePictureFile,
  type UserType,
  type UploadResult 
} from '@/lib/services/profilePictureService';

export interface UseProfilePictureOptions {
  userType: UserType;
  userId: string;
  onProfilePictureChange?: (url: string) => void;
}

export interface UseProfilePictureReturn {
  // State
  profilePicture: string | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  
  // Actions
  refreshProfilePicture: () => Promise<void>;
  handleUpload: (file: File) => Promise<UploadResult>;
  clearError: () => void;
}

/**
 * Custom hook for managing profile picture operations
 */
export function useProfilePicture({
  userType,
  userId,
  onProfilePictureChange
}: UseProfilePictureOptions): UseProfilePictureReturn {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch profile picture from API
   */
  const refreshProfilePicture = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const pictureUrl = await fetchProfilePicture(userType, userId);
      setProfilePicture(pictureUrl);
    } catch (err) {
      console.error('Error fetching profile picture:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  /**
   * Handle profile picture upload
   */
  const handleUpload = useCallback(async (file: File): Promise<UploadResult> => {
    // Validate file first
    const validation = validateProfilePictureFile(file);
    if (!validation.valid) {
      const error = validation.error || 'Invalid file';
      setError(error);
      return {
        success: false,
        error
      };
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Set loading state for the profile picture display
      setIsLoading(true);
      
      const result = await uploadProfilePicture(userType, userId, file);
      
      if (result.success && result.url) {
        // Small delay to ensure Cloudinary has processed the image
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProfilePicture(result.url);
        
        if (onProfilePictureChange) {
          onProfilePictureChange(result.url);
        }
      } else {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      const error = (err as Error).message;
      setError(error);
      return {
        success: false,
        error
      };
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  }, [userType, userId, onProfilePictureChange]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch profile picture on mount and when dependencies change
  useEffect(() => {
    refreshProfilePicture();
  }, [refreshProfilePicture]);

  return {
    profilePicture,
    isLoading,
    isUploading,
    error,
    refreshProfilePicture,
    handleUpload,
    clearError
  };
}
