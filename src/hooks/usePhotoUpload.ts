/**
 * @fileoverview Custom hook for managing photo upload state and interactions
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx
 * 
 * HOOK FUNCTIONALITY:
 * Manages complex state for photo upload workflows including file selection,
 * upload progress, modal interactions, and error handling. Provides clean
 * separation between UI state management and business logic.
 * 
 * STATE MANAGEMENT EXTRACTED:
 * - File selection and validation
 * - Upload progress tracking
 * - Modal state management
 * - Error handling and display
 * - Preview image management
 * - Upload completion workflows
 * 
 * @refactor Extracted from PhotoUploads component to separate state management
 * from UI rendering, following React best practices for custom hooks
 */

import { useState, useCallback, useRef } from 'react';
import { FileUploadService, type FileUploadOptions } from '@/lib/services/fileUploadService';

export type UploadState = 'empty' | 'selecting' | 'preview' | 'uploading' | 'complete' | 'done';

export interface UsePhotoUploadOptions {
  maxPhotos?: number;
  uploadEndpoint?: string;
  entityId?: string;
  entityType?: string;
  photoDescription?: string;
  directUpload?: boolean;
  onUploadComplete?: (urls: string[]) => void;
  onUploadSuccess?: () => void;
  onPhotosSelected?: (files: File[]) => void;
}

export interface UsePhotoUploadReturn {
  // State
  selectedFiles: File[];
  uploadState: UploadState;
  uploadProgress: number;
  displayedImageUrl: string | null;
  isModalOpen: boolean;
  uploadedUrls: string[];
  uploadError: string | null;
  
  // File input ref
  fileInputRef: React.RefObject<HTMLInputElement>;
  
  // Actions
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleUpload: () => Promise<void>;
  handleDelete: (index: number) => void;
  handleAddPhotosClick: () => void;
  handleCloseModal: () => void;
  handleComplete: () => void;
  handleDeleteUploadedPhoto: () => void;
  
  // Utilities
  resetUpload: () => void;
}

/**
 * Custom hook for managing photo upload state and interactions
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (state management logic)
 */
export function usePhotoUpload(options: UsePhotoUploadOptions = {}): UsePhotoUploadReturn {
  const {
    maxPhotos = 1,
    uploadEndpoint,
    entityId,
    entityType,
    photoDescription,
    directUpload = false,
    onUploadComplete,
    onUploadSuccess,
    onPhotosSelected
  } = options;

  // State management
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>('empty');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection from input
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 49-59)
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      console.log('Selected files:', filesArray.map(f => ({ name: f.name, type: f.type })));
      
      const limitedFiles = filesArray.slice(0, maxPhotos);
      
      // Validate files
      const validation = FileUploadService.validateFiles(limitedFiles, maxPhotos);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid files');
        setSelectedFiles([]); // Clear selected files on validation failure
        // Keep modal open in selecting state to show error
        setUploadState('selecting');
        return;
      }
      
      setSelectedFiles(limitedFiles);
      setUploadState('preview');
      setUploadError(null);
    }
  }, [maxPhotos]);

  /**
   * Handle drag over event
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 65-67)
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  /**
   * Handle file drop
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 69-79)
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const limitedFiles = filesArray.slice(0, maxPhotos);
      
      // Validate files
      const validation = FileUploadService.validateFiles(limitedFiles, maxPhotos);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid files');
        setSelectedFiles([]); // Clear selected files on validation failure
        // Keep modal open in selecting state to show error
        setUploadState('selecting');
        return;
      }
      
      setSelectedFiles(limitedFiles);
      setUploadState('preview');
      setUploadError(null);
    }
  }, [maxPhotos]);

  /**
   * Handle file upload
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 81-209)
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFiles.length || !uploadEndpoint) return;
    
    setUploadState('uploading');
    setUploadError(null);
    setUploadProgress(0);
    
    if (directUpload) {
      const uploadOptions: FileUploadOptions = {
        files: selectedFiles,
        uploadEndpoint,
        entityId,
        entityType,
        photoDescription,
        onProgress: setUploadProgress
      };
      
      const result = await FileUploadService.uploadFiles(uploadOptions);
      
      if (result.success) {
        // Store the Cloudinary URLs
        setUploadedUrls(result.urls);
        
        // Set the first image as the displayed image
        if (result.urls.length > 0) {
          setDisplayedImageUrl(result.urls[0]);
        } else if (selectedFiles.length > 0) {
          // If no URL is returned but we have files, use the local URL
          setDisplayedImageUrl(URL.createObjectURL(selectedFiles[0]));
        }
        
        setUploadState('complete');
        
        // Call the callback if provided
        if (onUploadComplete) {
          onUploadComplete(result.urls);
        }
        
        // Automatically transition to done state and call success callback
        // This handles the case where upload is triggered directly (not via handleComplete)
        setUploadState('done');
        setIsModalOpen(false);
        
        // Call onUploadSuccess callback if provided
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setUploadError(result.error || 'Upload failed');
        setUploadState('preview'); // Go back to preview state on error
      }
    } else {
      // Simulate upload progress for non-direct uploads
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadState('complete');
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
  }, [selectedFiles, uploadEndpoint, entityId, entityType, photoDescription, directUpload, onUploadComplete, onUploadSuccess]);

  /**
   * Handle file deletion from selection
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 211-222)
   */
  const handleDelete = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      
      if (newFiles.length === 0) {
        setUploadState('selecting');
      }
      
      return newFiles;
    });
  }, []);

  /**
   * Handle opening the upload modal
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 224-227)
   */
  const handleAddPhotosClick = useCallback(() => {
    setIsModalOpen(true);
    setUploadState('selecting');
    setUploadError(null);
  }, []);

  /**
   * Handle closing the upload modal
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 229-234)
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    if (uploadState !== 'done') {
      setUploadState('empty');
    }
  }, [uploadState]);

  /**
   * Handle upload completion workflow
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 236-271)
   */
  const handleComplete = useCallback(() => {
    if (selectedFiles.length > 0) {
      if (directUpload) {
        // First upload the files if we're in directUpload mode
        if (uploadState === 'preview') {
          handleUpload();
          return;
        }
        
        // Only proceed to done state after upload is complete
        if (uploadState === 'complete') {
          setUploadState('done');
          setIsModalOpen(false);
          
          // Call onUploadSuccess callback if provided
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }
      } else {
        const imageUrl = URL.createObjectURL(selectedFiles[0]);
        setDisplayedImageUrl(imageUrl);
        setUploadState('done');
        setIsModalOpen(false);
        
        if (onPhotosSelected) {
          onPhotosSelected(selectedFiles);
        }
        
        // Call onUploadSuccess callback if provided
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    }
  }, [selectedFiles, directUpload, uploadState, handleUpload, onUploadSuccess, onPhotosSelected]);

  /**
   * Handle deleting uploaded photo
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 273-278)
   */
  const handleDeleteUploadedPhoto = useCallback(() => {
    // Clean up object URLs
    if (displayedImageUrl && displayedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(displayedImageUrl);
    }
    
    setUploadState('empty');
    setDisplayedImageUrl(null);
    setSelectedFiles([]);
    setUploadedUrls([]);
    setIsModalOpen(false);
    setUploadError(null);
    setUploadProgress(0);
  }, [displayedImageUrl]);

  /**
   * Reset upload state to initial values
   */
  const resetUpload = useCallback(() => {
    // Clean up any object URLs
    if (displayedImageUrl && displayedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(displayedImageUrl);
    }
    
    setSelectedFiles([]);
    setUploadState('empty');
    setUploadProgress(0);
    setDisplayedImageUrl(null);
    setIsModalOpen(false);
    setUploadedUrls([]);
    setUploadError(null);
  }, [displayedImageUrl]);

  return {
    // State
    selectedFiles,
    uploadState,
    uploadProgress,
    displayedImageUrl,
    isModalOpen,
    uploadedUrls,
    uploadError,
    
    // File input ref
    fileInputRef,
    
    // Actions
    handleFileSelect,
    handleDragOver,
    handleDrop,
    handleUpload,
    handleDelete,
    handleAddPhotosClick,
    handleCloseModal,
    handleComplete,
    handleDeleteUploadedPhoto,
    
    // Utilities
    resetUpload
  };
}
