/**
 * @fileoverview Displays details for a single storage unit including image, description, and photo upload functionality.
 * @source boombox-10.0/src/app/components/user-page/storageunitscard.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Shows storage unit image with error handling and fallback.
 * - Provides editable description text area with character limit.
 * - Allows uploading photos with validation (type, size).
 * - Displays upload status messages (success, error).
 * - Triggers image gallery popup on image click.
 * - Responsive design with mobile/desktop layouts.
 *
 * API ROUTES UPDATED:
 * - Old: /api/storage-unit/${id}/upload-photos → New: /api/admin/storage-units/${id}/upload-photos
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors (e.g., bg-surface-primary, text-text-primary, border-border).
 * - Uses status colors for success/error messages (bg-status-bg-success, text-status-success, bg-status-bg-error, text-status-error).
 *
 * @refactor Migrated to boombox-11.0 customer features, integrated design system, and updated API routes.
 */

'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/20/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export interface StorageUnitCardProps {
  id: number; // Storage unit usage ID for uploads
  imageSrc: string | null;
  title: string;
  pickUpDate: string;
  lastAccessedDate: string | null;
  location: string | null;
  descriptionPlaceholder?: string;
  onDescriptionChange?: (description: string) => void;
  onUploadClick: () => void;
  onImageClick: () => void;
  description?: string;
  onPhotosUploaded?: (newPhotoUrls: string[]) => void; // Callback for when photos are uploaded
}

export function StorageUnitsCard({
  id,
  imageSrc,
  title,
  pickUpDate,
  lastAccessedDate,
  location,
  descriptionPlaceholder = 'Add a description of your stored items...',
  onDescriptionChange,
  onUploadClick,
  onImageClick,
  description = '',
  onPhotosUploaded,
}: StorageUnitCardProps) {
  const [isImageBroken, setIsImageBroken] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageError = () => {
    setIsImageBroken(true);
  };

  const handleUploadClick = () => {
    // Clear previous messages
    setUploadError(null);
    setUploadSuccess(null);

    // Trigger the file input
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const validFiles = Array.from(files).filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        setUploadError(
          `${file.name} is not a supported image format. Please use JPG, PNG, or WebP.`
        );
        return false;
      }
      if (file.size > maxSize) {
        setUploadError(`${file.name} is too large. Please use images under 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await fetch(`/api/admin/storage-units/${id}/upload-photos`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadSuccess(`Successfully uploaded ${result.uploadedUrls.length} photo(s)!`);
        // Call the callback to update parent component
        if (onPhotosUploaded) {
          onPhotosUploaded(result.uploadedUrls);
        }

        // Clear success message after 5 seconds
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        setUploadError(result.error || 'Failed to upload photos');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-surface-primary rounded-md h-auto shadow-custom-shadow">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload storage unit photos"
      />

      {/* Image (Mobile) */}
      <div
        className="block md:hidden w-full h-80 relative shrink-0 cursor-pointer flex items-center justify-center bg-surface-tertiary"
        onClick={onImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onImageClick();
          }
        }}
        aria-label={`View photos of ${title}`}
      >
        {imageSrc && !isImageBroken ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="rounded-t-md object-cover"
            onError={handleImageError}
          />
        ) : (
          <span className="text-sm text-text-tertiary text-center">Image not available</span>
        )}
      </div>

      <div className="flex mb-8">
        {/* Image (Desktop) */}
        <div
          className="hidden md:block relative shrink-0 aspect-square w-80 h-80 bg-surface-tertiary h-full flex items-center justify-center cursor-pointer"
          onClick={onImageClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onImageClick();
            }
          }}
          aria-label={`View photos of ${title}`}
        >
          {imageSrc && !isImageBroken ? (
            <>
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="rounded-l-md object-cover transition-opacity duration-300"
                onError={handleImageError}
              />
              {/* Dark overlay on hover */}
              <div className="absolute rounded-l-md inset-0 bg-primary opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full w-full text-sm text-text-tertiary text-center">
              Image not available
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          <div className="flex-grow px-4 pt-4">
            <h3
              className="text-lg font-semibold text-text-primary hover:underline underline-offset-2 w-fit cursor-pointer"
              onClick={onImageClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onImageClick();
                }
              }}
            >
              {title}
            </h3>
            <p className="text-sm mt-2">
              {pickUpDate && `Picked up ${pickUpDate}`} {location && `from ${location}`}
            </p>
            {lastAccessedDate && <p className="text-sm">Last accessed {lastAccessedDate}</p>}

            {/* Description Input */}
            <div className="mt-4">
              <label htmlFor={`description-${id}`} className="sr-only">
                Storage unit description
              </label>
              <textarea
                id={`description-${id}`}
                value={description}
                onChange={(e) => onDescriptionChange && onDescriptionChange(e.target.value)}
                placeholder={descriptionPlaceholder}
                className="w-full h-36 sm:h-32 p-3 border border-border rounded-md text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                maxLength={1000}
                aria-describedby={`description-count-${id}`}
              />
              <p
                id={`description-count-${id}`}
                className={`text-xs text-right mt-1 ${
                  description.length === 1000 ? 'text-status-error' : 'text-text-tertiary'
                }`}
              >
                {description.length}/1000
              </p>
            </div>

            {/* Upload Status Messages */}
            {uploadError && (
              <div
                className="mt-2 p-2 bg-status-bg-error border border-border-error rounded-md"
                role="alert"
              >
                <p className="text-sm text-status-error">{uploadError}</p>
              </div>
            )}
            {uploadSuccess && (
              <div
                className="mt-2 p-2 bg-status-bg-success border border-border-success rounded-md"
                role="status"
              >
                <p className="text-sm text-status-success">{uploadSuccess}</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`px-4 py-4 flex items-center justify-between w-full text-text-primary sm:hover:bg-surface-tertiary active:bg-surface-disabled rounded-br-md transition mt-auto ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={isUploading ? 'Uploading photos' : 'Upload photos of stored items'}
          >
            <ArrowUpTrayIcon className={`w-4 h-4 mr-2 ${isUploading ? 'animate-pulse' : ''}`} />
            {isUploading ? (
              'Uploading photos...'
            ) : (
              <>
                Upload photos of your <span className="hidden ml-1 mr-1 sm:block">stored</span>{' '}
                items
              </>
            )}
            <ChevronRightIcon className="w-4 h-4 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}

