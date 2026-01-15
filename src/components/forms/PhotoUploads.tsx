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
import Image from 'next/image';
import { usePhotoUpload, type UsePhotoUploadOptions } from '@/hooks/usePhotoUpload';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/primitives/Button/Button';

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
  
  /**
   * Name attribute for the field (used for error message ID)
   */
  name?: string;
  
  /**
   * Error message to display (e.g., validation error)
   */
  error?: string;
  
  /**
   * Callback to clear the error when modal opens
   */
  onErrorClear?: () => void;
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
  name,
  error,
  onErrorClear,
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
   * Clone icon with error styling if needed
   */
  const renderIcon = () => {
    if (!React.isValidElement(icon)) return icon;
    
    if (error) {
      const existingClassName = (icon.props as any).className || '';
      const errorClassName = existingClassName.replace(/text-\S+/, 'text-red-100');
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: errorClassName
      });
    }
    
    return icon;
  };

  /**
   * Handle opening the modal and clear error
   */
  const handleOpenModal = () => {
    if (onErrorClear) {
      onErrorClear();
    }
    handleAddPhotosClick();
  };

  /**
   * Render the upload modal content based on current state
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 280-432)
   */
  const renderModalContent = () => {
    if (uploadState === 'selecting') {
      return (
        <div className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-lg shadow-xl w-full max-w-xl" role="dialog" aria-modal="true" aria-labelledby="modal-title-selecting">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 id="modal-title-selecting" className="text-lg font-medium">{photoUploadTitle}</h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-primary hover:bg-surface-tertiary active:bg-slate-200"
                aria-label="Close upload modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div 
              className={cn(
                "p-8 m-4 border-2 border-dashed border-slate-200 rounded-md text-center flex flex-col items-center justify-center",
                modalContentHeight
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex justify-center items-center mb-2">
                {icon}
              </div>
              <h4 className="text-lg font-medium mb-2">Drag and drop</h4>
              <p className="text-sm text-text-tertiary mb-4">or browse for photos</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-6 bg-primary text-text-inverse font-semibold rounded-md hover:bg-primary-hover active:bg-primary-active font-inter focus:outline-none"
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
                className="hidden"
              />
            </div>
            
            {uploadError && (
              <div className="px-4">
                <div className="p-4 mb-4 bg-status-bg-error border border-status-error rounded-md">
                  <p className="text-sm text-status-error">{uploadError}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center p-4 border-t">
              <Button
                onClick={handleCloseModal}
                variant="secondary"
                size="md"
                type="button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={selectedFiles.length === 0}
                variant="primary"
                size="md"
                type="button"
              >
                Upload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (uploadState === 'preview' || uploadState === 'uploading' || uploadState === 'complete') {
      return (
        <div className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-lg shadow-custom-shadow w-full max-w-xl" role="dialog" aria-modal="true" aria-labelledby="modal-title-preview">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 id="modal-title-preview" className="text-lg font-medium">{photoUploadTitle}</h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-primary hover:bg-surface-tertiary active:bg-slate-200"
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
                      "relative w-full bg-slate-100 rounded-md overflow-hidden",
                      modalContentHeight
                    )}>
                      {file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-full h-full flex items-center justify-center bg-surface-tertiary">
                          <div className="flex flex-col items-center justify-center p-4">
                            <DocumentIcon className="w-12 h-12 text-text-secondary mb-2" />
                            <p className="text-sm font-medium text-text-tertiary truncate max-w-full">
                              {file.name}
                            </p>
                            <p className="text-xs text-zinc-500">
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
                          className="absolute top-4 right-4 w-8 h-8 bg-primary bg-opacity-50 rounded-full flex items-center justify-center text-text-inverse hover:bg-opacity-80"
                          aria-label={`Delete ${file.name}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {uploadError && (
              <div className="px-4">
                <div className="p-4 mb-4 bg-status-bg-error border border-status-error rounded-md">
                  <p className="text-sm text-status-error">{uploadError}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center p-4 border-t">
              <Button
                onClick={handleCloseModal}
                variant="secondary"
                size="md"
                disabled={uploadState === 'uploading'}
                type="button"
              >
                {uploadState === 'preview' ? 'Back' : 'Cancel'}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={uploadState === 'uploading'}
                variant="primary"
                size="md"
                loading={uploadState === 'uploading'}
                type="button"
              >
                {uploadState === 'preview' && uploadOptions.directUpload 
                  ? 'Upload' 
                  : uploadState === 'uploading' 
                    ? 'Uploading...' 
                    : 'Done'}
              </Button>
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
        "w-full rounded-md flex items-center justify-center relative",
        uploadState === 'done' 
          ? "bg-surface-tertiary" 
          : "border-2 border-dashed border-slate-200 bg-surface-tertiary",
        error && "border-border-error border-dashed bg-red-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {uploadState === 'done' && selectedFiles.length > 0 ? (
          <div className="relative w-full h-full">
            {selectedFiles[0].type.includes('pdf') || selectedFiles[0].name.toLowerCase().endsWith('.pdf') ? (
              <div className="w-full h-full flex items-center justify-center bg-surface-tertiary p-10 rounded-md">
                <div className="flex flex-col items-center justify-center p-4">
                  <DocumentIcon className="w-16 h-16 text-text-secondary mb-2" />
                  <p className="text-sm font-medium text-text-tertiary truncate max-w-full">
                    {selectedFiles[0].name}
                  </p>
                  <p className="text-xs text-zinc-500">
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
              className="absolute top-4 right-4 font-inter font-semibold p-3 bg-primary bg-opacity-70 text-text-inverse rounded-full hover:bg-opacity-90 focus-visible"
              disabled={disabled}
              aria-label="Delete uploaded photo"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="mb-2" data-testid="photo-icon">
              {renderIcon()}
            </div>
            <button 
              onClick={handleOpenModal} 
              className={cn(
                "font-inter font-semibold mt-2 px-6 py-3 rounded-md text-sm focus:outline-none",
                error 
                  ? "border-border-error ring-2 ring-border-error bg-red-50 text-status-error" 
                  : "bg-surface-primary border border-text-disabled text-text-tertiary hover:bg-slate-50"
              )}
              disabled={disabled}
              type="button"
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
      
      {error && name && (
        <p id={`${name}-error`} className="form-error">
          {error}
        </p>
      )}
      
      {isModalOpen && renderModalContent()}
    </div>
  );
};

export default PhotoUploads;
