/**
 * @fileoverview ProfilePicture primitive component for user profile picture management
 * @source boombox-10.0/src/app/components/reusablecomponents/profilepicture.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Reusable profile picture component that handles display, upload, and management
 * of profile pictures for both drivers and moving partners. Features drag-and-drop
 * upload, image preview, loading states, and error handling.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/profile-picture → New: /api/drivers/${userId}/profile-picture
 * - Old: /api/movers/${userId}/profile-picture → New: /api/moving-partners/${userId}/profile-picture
 * - Old: /api/drivers/${userId}/upload-profile-picture → New: /api/drivers/${userId}/upload-profile-picture
 * - Old: /api/movers/${userId}/upload-profile-picture → New: /api/moving-partners/${userId}/upload-profile-picture
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied design system colors (primary, surface, text, status)
 * - Used design system utility classes (btn-primary, btn-secondary)
 * - Integrated with Modal and OptimizedImage primitives
 * - Added proper focus states and accessibility
 * 
 * @refactor Promoted to UI primitive with business logic extracted to services and hooks,
 * enhanced with design system compliance and accessibility improvements
 */

'use client';

import { useState, useRef } from 'react';
import { UserCircleIcon, CameraIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';
import { Modal } from '../Modal/Modal';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import { Skeleton } from '../Skeleton/Skeleton';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import type { UserType } from '@/lib/services/profilePictureService';

export interface ProfilePictureProps {
  /**
   * Type of user (driver or mover)
   */
  userType: UserType;
  
  /**
   * User ID
   */
  userId: string;
  
  /**
   * Custom icon to display when no profile picture exists
   */
  customIcon?: React.ReactNode;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Callback when profile picture changes
   */
  onProfilePictureChange?: (url: string) => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  userType,
  userId,
  customIcon,
  size = 'md',
  onProfilePictureChange,
  className,
  disabled = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hook for profile picture management
  const {
    profilePicture,
    isLoading,
    isUploading,
    error,
    handleUpload,
    clearError
  } = useProfilePicture({
    userType,
    userId,
    onProfilePictureChange
  });

  // Size classes mapping
  const sizeClasses = {
    sm: {
      container: 'w-24 h-24',
      icon: 'w-12 h-12',
      button: 'text-xs py-1 px-3'
    },
    md: {
      container: 'w-32 h-32',
      icon: 'w-16 h-16',
      button: 'text-sm py-1.5 px-4'
    },
    lg: {
      container: 'w-40 h-40',
      icon: 'w-20 h-20',
      button: 'text-base py-2 px-5'
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Handle browse click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Handle upload
  const handleUploadClick = async () => {
    if (!selectedFile) return;
    
    const result = await handleUpload(selectedFile);
    
    if (result.success) {
      // Close modal on success
      handleCloseModal();
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    clearError();
  };

  // Handle modal open
  const handleOpenModal = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  // Render profile picture or placeholder
  const renderProfilePicture = () => {
    if (isLoading) {
      return (
        <Skeleton className={cn(sizeClasses[size].container, "rounded-lg")} />
      );
    }

    if (profilePicture) {
      return (
        <div className="flex justify-start">
          <div className="relative flex flex-col items-center">
            <div className={cn(
              sizeClasses[size].container,
              "relative bg-surface-tertiary rounded-lg overflow-hidden"
            )}>
              <OptimizedImage 
                src={profilePicture} 
                alt="Profile Picture" 
                fill 
                className="object-cover"
                aspectRatio="square"
                showSkeleton={false}
              />
            </div>
            <button
              onClick={handleOpenModal}
              disabled={disabled}
              className={cn(
                "-mt-4 flex items-center gap-1 bg-surface-primary rounded-md shadow-custom-shadow z-10",
                "text-text-primary hover:bg-surface-secondary active:bg-surface-tertiary",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors duration-200",
                sizeClasses[size].button
              )}
              aria-label="Edit profile picture"
            >
              <CameraIcon className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="w-fit bg-status-bg-warning border border-status-warning rounded-md p-4 mb-6">
          <p className="text-status-text-warning text-sm">
            {userType === 'mover' 
              ? 'Please upload a company picture or logo to activate your account'
              : 'Please upload a profile picture to activate your account'
            }
          </p>
        </div>
        
        <div className="flex justify-start">
          <div className="flex flex-col items-center">
            <div className={cn(
              sizeClasses[size].container,
              "bg-surface-tertiary rounded-lg flex items-center justify-center"
            )}>
              {customIcon || <UserCircleIcon className={cn(sizeClasses[size].icon, "text-text-secondary")} />}
            </div>
            <button
              onClick={handleOpenModal}
              disabled={disabled}
              className={cn(
                "-mt-4 flex items-center gap-1 bg-surface-primary rounded-md shadow-custom-shadow z-10",
                "text-text-primary hover:bg-surface-secondary active:bg-surface-tertiary",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors duration-200",
                sizeClasses[size].button
              )}
              aria-label="Add profile picture"
            >
              <CameraIcon className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render modal content
  const renderModalContent = () => {
    return (
      <div className="bg-surface-primary rounded-lg shadow-xl w-full max-w-xl">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="text-lg font-medium text-text-primary">
            {profilePicture ? 'Update Profile Picture' : 'Add Profile Picture'}
          </h3>
          <button
            onClick={handleCloseModal}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {!selectedFile ? (
          <div 
            className="p-8 m-4 border-2 h-64 border-dashed border-border rounded-md text-center flex flex-col items-center justify-center hover:border-border-focus hover:bg-surface-secondary transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload area"
            onClick={handleBrowseClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBrowseClick();
              }
            }}
          >
            <div className="flex justify-center items-center mb-4">
              <PhotoIcon className="w-16 h-16 text-text-secondary mb-1" />
            </div>
            <h4 className="text-lg font-medium text-text-primary mb-2">Drag and drop</h4>
            <p className="text-sm text-text-secondary mb-4">or browse for photos</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              className="btn-primary"
              type="button"
            >
              Browse
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="sr-only"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="p-4">
            <div className="relative w-full h-64 bg-surface-tertiary rounded-md overflow-hidden">
              {previewUrl && (
                <>
                  <OptimizedImage
                    src={previewUrl}
                    alt="Selected profile picture"
                    fill
                    className="object-cover"
                    aspectRatio="landscape"
                    showSkeleton={false}
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 bg-overlay-secondary rounded-full flex items-center justify-center text-text-inverse hover:bg-overlay-primary transition-colors"
                    aria-label="Remove selected image"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {error && (
              <p className="mt-2 text-sm text-status-text-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center p-4 border-t border-border">
          <button
            onClick={handleCloseModal}
            className="btn-secondary"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadClick}
            disabled={!selectedFile || isUploading}
            className={cn(
              "btn-primary",
              (!selectedFile || isUploading) && "opacity-50 cursor-not-allowed"
            )}
            type="button"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {renderProfilePicture()}
      
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        size="lg"
        showCloseButton={false}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default ProfilePicture;
