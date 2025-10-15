/**
 * @fileoverview PhotoUploads form component for drag-and-drop photo uploads with modal interface
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Advanced photo upload component with modal interface, drag-and-drop support,
 * file validation, upload progress tracking, and preview capabilities.
 * Supports both direct Cloudinary uploads and local file selection workflows.
 * 
 * API ROUTES UPDATED:
 * - Uses generic upload endpoints from boombox-11.0/api-routes-migration-tracking.md
 * - Supports /api/uploads/cloudinary, /api/uploads/photos, /api/uploads/damage-photos
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied design system colors (primary, surface, text, status tokens)
 * - Used semantic color utilities from tailwind.config.ts
 * - Integrated form utility classes from globals.css (.btn-primary, .form-label, etc.)
 * - Applied consistent hover/focus states using design system colors
 * - Replaced hardcoded zinc colors with semantic tokens
 * 
 * @refactor Separated business logic into FileUploadService and usePhotoUpload hook,
 * component now focuses purely on UI rendering and user interactions.
 * Enhanced with design system compliance and accessibility improvements.
 */

'use client';

import React from 'react';
import { TrashIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { usePhotoUpload, type UsePhotoUploadOptions } from '@/hooks/usePhotoUpload';
import { cn } from '@/lib/utils/cn';

export interface PhotoUploadsProps extends UsePhotoUploadOptions {
  /**
   * Title for the photo upload modal
   */
  photoUploadTitle?: string;
  
  /**
   * Text for the upload button
   */
  buttonText?: string;
  
  /**
   * Icon to display in the upload area
   */
  icon: React.ReactNode;
  
  /**
   * Aspect ratio class for the upload area
   */
  aspectRatio?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
}

/**
 * PhotoUploads component with modal interface and drag-and-drop support
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx
 */
const PhotoUploads: React.FC<PhotoUploadsProps> = ({ 
  photoUploadTitle = "Upload Photos",
  buttonText = "Add Photos",
  icon,
  aspectRatio = "aspect-square",
  className,
  disabled = false,
  ...uploadOptions
}) => {
  const {
    selectedFiles,
    uploadState,
    uploadProgress,
    displayedImageUrl,
    isModalOpen,
    uploadError,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDrop,
    handleDelete,
    handleAddPhotosClick,
    handleCloseModal,
    handleComplete,
    handleDeleteUploadedPhoto
  } = usePhotoUpload(uploadOptions);

  // Define a consistent height variable
  const modalContentHeight = "h-64";

  /**
   * Render the upload modal content based on current state
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 280-432)
   */
  const renderModalContent = () => {
    if (uploadState === 'selecting') {
      return (
        <div className="fixed inset-0 bg-overlay-primary flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-lg shadow-custom-shadow w-full max-w-xl" role="dialog" aria-modal="true" aria-labelledby="modal-title-selecting">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 id="modal-title-selecting" className="text-lg font-medium text-text-primary">{photoUploadTitle}</h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled focus-visible"
                aria-label="Close upload modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div 
              className={cn(
                "p-8 m-4 border-2 border-dashed rounded-md text-center flex flex-col items-center justify-center transition-colors",
                modalContentHeight,
                "border-border hover:border-border-focus hover:bg-surface-secondary"
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Drag and drop files here or click to browse"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="flex justify-center items-center mb-4 text-text-secondary">
                {icon}
              </div>
              <h4 className="text-lg font-medium mb-2 text-text-primary">Drag and drop</h4>
              <p className="text-sm text-text-secondary mb-4">or browse for photos</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary focus-visible"
                type="button"
              >
                Browse
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple={uploadOptions.maxPhotos !== 1}
                accept="image/*,.pdf,application/pdf"
                className="sr-only"
                aria-hidden="true"
              />
            </div>
            
            {uploadError && (
              <div className="px-4" role="alert">
                <div className="p-4 mb-4 bg-status-bg-error border border-status-error rounded-md">
                  <p className="text-sm text-status-text-error">{uploadError}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center p-4 border-t border-border">
              <button
                onClick={handleCloseModal}
                className="btn-secondary focus-visible"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={selectedFiles.length === 0}
                className={cn(
                  "btn-primary focus-visible",
                  selectedFiles.length === 0 && "opacity-50 cursor-not-allowed"
                )}
                type="button"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (uploadState === 'preview' || uploadState === 'uploading' || uploadState === 'complete') {
      return (
        <div className="fixed inset-0 bg-overlay-primary flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-lg shadow-custom-shadow w-full max-w-xl" role="dialog" aria-modal="true" aria-labelledby="modal-title-preview">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 id="modal-title-preview" className="text-lg font-medium text-text-primary">{photoUploadTitle}</h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled focus-visible"
                aria-label="Close upload modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className={cn(
                      "relative w-full bg-surface-tertiary rounded-md overflow-hidden",
                      modalContentHeight
                    )}>
                      {file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-full h-full flex items-center justify-center bg-surface-tertiary">
                          <div className="flex flex-col items-center justify-center p-4">
                            <DocumentIcon className="w-12 h-12 text-text-secondary mb-2" />
                            <p className="text-sm font-medium text-text-primary truncate max-w-full">
                              {file.name}
                            </p>
                            <p className="text-xs text-text-secondary">
                              PDF Document
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Selected ${index}`}
                          className={cn("w-full object-cover object-center", aspectRatio)}
                          width={600}
                          height={400}
                        />
                      )}
                      {uploadState === 'preview' && (
                        <button
                          onClick={() => handleDelete(index)}
                          className="absolute top-4 right-4 w-8 h-8 bg-overlay-secondary rounded-full flex items-center justify-center text-text-inverse hover:bg-overlay-primary transition-all focus-visible"
                          aria-label={`Delete ${file.name}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Upload progress indicator */}
                    {uploadState === 'uploading' && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-surface-primary rounded-full p-2">
                          <div className="w-full bg-surface-disabled rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                              role="progressbar"
                              aria-valuenow={uploadProgress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Upload progress: ${uploadProgress}%`}
                            />
                          </div>
                          <p className="text-xs text-text-secondary mt-1 text-center">
                            {uploadProgress}% uploaded
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {uploadError && (
              <div className="px-4" role="alert">
                <div className="p-4 mb-4 bg-status-bg-error border border-status-error rounded-md">
                  <p className="text-sm text-status-text-error">{uploadError}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center p-4 border-t border-border">
              <button
                onClick={() => {
                  if (uploadState === 'preview') {
                    handleCloseModal();
                  }
                }}
                className="btn-secondary focus-visible"
                disabled={uploadState === 'uploading'}
                type="button"
              >
                {uploadState === 'preview' ? 'Back' : 'Cancel'}
              </button>
              <button
                onClick={handleComplete}
                disabled={uploadState === 'uploading'}
                className={cn(
                  "btn-primary focus-visible",
                  uploadState === 'uploading' && "opacity-50 cursor-not-allowed"
                )}
                type="button"
              >
                {uploadState === 'preview' && uploadOptions.directUpload 
                  ? 'Upload' 
                  : uploadState === 'uploading' 
                    ? 'Uploading...' 
                    : 'Done'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "w-full rounded-md flex items-center justify-center relative transition-colors",
        uploadState === 'done' 
          ? "border-2 border-solid border-border bg-surface-primary" 
          : "border-2 border-dashed border-border bg-surface-secondary",
        !disabled && "hover:border-border-focus hover:bg-surface-tertiary",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {uploadState === 'done' && selectedFiles.length > 0 ? (
          <div className="relative w-full h-full">
            {selectedFiles[0].type.includes('pdf') || selectedFiles[0].name.toLowerCase().endsWith('.pdf') ? (
              <div className="w-full h-full flex items-center justify-center bg-surface-tertiary p-10 rounded-md">
                <div className="flex flex-col items-center justify-center p-4">
                  <DocumentIcon className="w-16 h-16 text-text-secondary mb-2" />
                  <p className="text-sm font-medium text-text-primary truncate max-w-full">
                    {selectedFiles[0].name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    PDF Document
                  </p>
                </div>
              </div>
            ) : (
              <Image
                src={displayedImageUrl || ''}
                alt="Uploaded photo"
                className={cn("w-full h-full object-cover object-center rounded-md", aspectRatio)}
                width={600}
                height={400}
              />
            )}
            <button
              onClick={handleDeleteUploadedPhoto}
              className="absolute top-4 right-4 p-3 bg-overlay-secondary text-text-inverse rounded-full hover:bg-overlay-primary transition-all focus-visible"
              disabled={disabled}
              aria-label="Delete uploaded photo"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="text-text-secondary mb-2" data-testid="photo-icon">
              {icon}
            </div>
            <button 
              onClick={handleAddPhotosClick} 
              className="btn-secondary mt-2 focus-visible"
              disabled={disabled}
              type="button"
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
      
      {isModalOpen && renderModalContent()}
    </div>
  );
};

export default PhotoUploads;
