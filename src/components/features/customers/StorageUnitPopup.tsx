/**
 * @fileoverview Modal popup for viewing storage unit photos with image carousel and description editing.
 * @source boombox-10.0/src/app/components/user-page/storageunitpopup.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Displays storage unit photos in a full-screen modal with carousel navigation.
 * - Allows users to navigate through multiple images with previous/next controls.
 * - Provides editable description overlay that can be toggled on/off.
 * - Shows storage unit details including title, pickup date, and location.
 * - Handles image loading errors with fallback display.
 * - Supports keyboard navigation and accessibility features.
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal primitive from ui/primitives for consistent modal behavior.
 * - Uses semantic colors (e.g., bg-surface-primary, text-text-primary, border-border).
 * - Applies design system button styles and transitions.
 *
 * @refactor Migrated to boombox-11.0 customer features, integrated Modal primitive, and updated design system colors.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import { Modal } from '@/components/ui/primitives/Modal';

export interface StorageUnitPopupProps {
  images: string[];
  mainImage: string | null;
  onClose: () => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  title: string;
  pickUpDate: string;
  lastAccessedDate: string | null;
  location: string | null;
  isOpen: boolean;
}

export function StorageUnitPopup({
  images,
  mainImage,
  onClose,
  description,
  onDescriptionChange,
  title,
  pickUpDate,
  lastAccessedDate,
  location,
  isOpen,
}: StorageUnitPopupProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [isImageBroken, setIsImageBroken] = useState(false);
  const [localDescription, setLocalDescription] = useState(description);
  const totalPages = images.length + (mainImage ? 1 : 0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setLocalDescription(description);
  }, [description]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(0);
      setIsDescriptionVisible(false);
      setIsImageBroken(false);
    }
  }, [isOpen]);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setIsImageBroken(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setIsImageBroken(false);
    }
  };

  const handleToggleDescription = () => {
    setIsDescriptionVisible(!isDescriptionVisible);
    // Focus the textarea when it becomes visible
    if (!isDescriptionVisible) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300); // Small delay to allow for the transition
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalDescription(newValue);
    onDescriptionChange(newValue);
  };

  const handleImageError = () => {
    setIsImageBroken(true);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentPage, totalPages]);

  const currentImage =
    currentPage === 0 && mainImage
      ? mainImage
      : images[currentPage - (mainImage ? 1 : 0)] || '/placeholder.jpg';

  return (
    <Modal open={isOpen} onClose={onClose} title={title} size="full">
      <div className="p-6">
        {/* Header Information */}
        <div className="mb-4">
          <p className="text-sm text-text-secondary">
            Picked up {pickUpDate} {location && `from ${location}`}
          </p>
          {lastAccessedDate && (
            <p className="text-sm text-text-secondary">Last Accessed: {lastAccessedDate}</p>
          )}
        </div>

        {/* Image and Description Section */}
        <div className="relative">
          <div className="bg-surface-tertiary w-full h-[400px] md:h-[600px] relative rounded-md overflow-hidden">
            {/* Image */}
            {!isImageBroken ? (
              <Image
                src={currentImage}
                alt={`${title} - Image ${currentPage + 1} of ${totalPages}`}
                fill
                className="rounded-md object-cover"
                onError={handleImageError}
                priority={currentPage === 0}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-sm text-text-tertiary text-center">
                Image not available
              </div>
            )}

            {/* Description overlay */}
            <div
              className={`absolute bottom-0 w-full bg-primary bg-opacity-50 text-text-inverse rounded-b-md transition-all duration-300 ease-in-out overflow-hidden ${
                isDescriptionVisible ? 'h-[50%] p-3' : 'h-0'
              }`}
            >
              <label htmlFor="storage-description" className="sr-only">
                Storage unit description
              </label>
              <textarea
                id="storage-description"
                ref={textareaRef}
                value={localDescription}
                onChange={handleDescriptionChange}
                placeholder="Add description of your stored items..."
                className="w-full h-full resize-none bg-transparent focus:outline-none placeholder:text-text-inverse text-text-inverse"
                maxLength={1000}
                disabled={!isDescriptionVisible}
                aria-describedby="description-hint"
              />
              <p id="description-hint" className="sr-only">
                Maximum 1000 characters
              </p>
            </div>

            {/* Add Description Button */}
            <button
              onClick={handleToggleDescription}
              className="absolute top-3 right-3 flex items-center text-xs rounded-full p-2.5 bg-surface-tertiary sm:hover:bg-surface-disabled active:bg-surface-disabled transition-colors"
              aria-label={isDescriptionVisible ? 'Hide description editor' : 'Show description editor'}
              aria-pressed={isDescriptionVisible}
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              {isDescriptionVisible ? 'Hide Description' : 'Add Description'}
            </button>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="relative flex justify-center items-center mt-4">
              {/* Previous Button */}
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
                className={`absolute left-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 transition-opacity ${
                  currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="w-5" />
              </button>

              {/* Page Counter */}
              <div className="text-sm text-text-secondary" aria-live="polite" aria-atomic="true">
                {currentPage + 1} of {totalPages}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className={`absolute right-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 transition-opacity ${
                  currentPage === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                aria-label="Next image"
              >
                <ChevronRightIcon className="w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Character Count */}
        {isDescriptionVisible && (
          <div className="mt-2 text-right">
            <span
              className={`text-xs ${
                localDescription.length === 1000 ? 'text-status-error' : 'text-text-tertiary'
              }`}
            >
              {localDescription.length}/1000
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

