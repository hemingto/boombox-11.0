/**
 * @fileoverview Profile Picture Service - handles profile picture operations
 * @source boombox-10.0/src/app/components/reusablecomponents/profilepicture.tsx
 * 
 * SERVICE FUNCTIONALITY:
 * Centralized service for profile picture operations including fetching, uploading,
 * and managing profile pictures for both drivers and moving partners.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/profile-picture → New: /api/drivers/${userId}/profile-picture
 * - Old: /api/movers/${userId}/profile-picture → New: /api/moving-partners/${userId}/profile-picture
 * - Old: /api/drivers/${userId}/upload-profile-picture → New: /api/drivers/${userId}/upload-profile-picture
 * - Old: /api/movers/${userId}/upload-profile-picture → New: /api/moving-partners/${userId}/upload-profile-picture
 * 
 * @refactor Extracted business logic from ProfilePicture component to dedicated service
 */

export type UserType = 'driver' | 'mover';

export interface ProfilePictureData {
  profilePicture?: string;
  url?: string;
  profilePictureUrl?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

/**
 * Fetch user profile picture from API
 * @param userType - Type of user (driver or mover)
 * @param userId - User ID
 * @returns Profile picture URL or null if not found
 */
export async function fetchProfilePicture(
  userType: UserType, 
  userId: string
): Promise<string | null> {
  try {
    const apiRoute = userType === 'driver' 
      ? `/api/drivers/${userId}/profile-picture` 
      : `/api/moving-partners/${userId}/profile-picture`;
    
    console.log('Fetching profile picture from:', apiRoute);
    const response = await fetch(apiRoute);
    console.log('Profile picture response status:', response.status);
    
    if (response.status === 404) {
      // No profile picture found
      console.log('No profile picture found');
      return null;
    } 
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile picture');
    }
    
    const data: ProfilePictureData = await response.json();
    console.log('Profile picture data:', data);
    
    // Check if the data structure matches what we expect
    return data.profilePicture || data.url || data.profilePictureUrl || null;
  } catch (err) {
    console.error('Error fetching profile picture:', err);
    throw new Error((err as Error).message);
  }
}

/**
 * Upload profile picture file
 * @param userType - Type of user (driver or mover)
 * @param userId - User ID
 * @param file - File to upload
 * @returns Upload result with URL
 */
export async function uploadProfilePicture(
  userType: UserType,
  userId: string,
  file: File
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const apiRoute = userType === 'driver' 
      ? `/api/drivers/${userId}/upload-profile-picture` 
      : `/api/moving-partners/${userId}/upload-profile-picture`;
    
    const response = await fetch(apiRoute, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to upload profile picture'
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      url: data.url,
      message: 'Profile picture uploaded successfully'
    };
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    return {
      success: false,
      error: (err as Error).message
    };
  }
}

/**
 * Validate file for profile picture upload
 * @param file - File to validate
 * @returns Validation result
 */
export function validateProfilePictureFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please select an image file'
    };
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }
  
  // Check file format
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a JPEG, PNG, or WebP image'
    };
  }
  
  return { valid: true };
}
