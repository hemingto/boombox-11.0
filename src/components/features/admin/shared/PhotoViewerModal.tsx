/**
 * @fileoverview Photo viewer modal with navigation for admin pages
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * COMPONENT FUNCTIONALITY:
 * Modal for viewing photos with navigation:
 * - Displays single photo at a time
 * - Next/Previous navigation buttons
 * - Keyboard navigation (arrow keys, escape)
 * - Shows current photo index
 * - Handles empty/null photo arrays gracefully
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal component from design system
 * - Semantic colors for buttons and text
 * - Proper focus management
 * - Accessible keyboard navigation
 * 
 * @refactor Extracted from inline photo viewer implementations across 5+ management pages
 */

'use client';

import React, { useEffect } from 'react';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface PhotoViewerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Array of photo URLs to display */
  photos: (string | null)[];
  /** Current photo index */
  currentIndex: number;
  /** Callback when navigating to different photo */
  onNavigate: (newIndex: number) => void;
  /** Optional title for the modal */
  title?: string;
}

/**
 * PhotoViewerModal - Modal for viewing and navigating through photos
 * 
 * @example
 * ```tsx
 * <PhotoViewerModal
 *   isOpen={showPhotoModal}
 *   onClose={() => setShowPhotoModal(false)}
 *   photos={[photo1, photo2, photo3]}
 *   currentIndex={currentPhotoIndex}
 *   onNavigate={setCurrentPhotoIndex}
 *   title="Driver License Photos"
 * />
 * ```
 */
export function PhotoViewerModal({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onNavigate,
  title = 'Photo Viewer',
}: PhotoViewerModalProps) {
  // Filter out null photos
  const validPhotos = photos.filter((photo): photo is string => photo !== null);
  const hasPhotos = validPhotos.length > 0;
  const currentPhoto = validPhotos[currentIndex] || null;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < validPhotos.length - 1;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, hasPrevious, hasNext, onNavigate]);

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="flex flex-col items-center gap-4">
        {!hasPhotos ? (
          <div className="flex items-center justify-center h-96 text-text-secondary">
            <p>No photos available</p>
          </div>
        ) : currentPhoto ? (
          <>
            {/* Photo Display */}
            <div className="relative w-full h-96 bg-surface-tertiary rounded-lg overflow-hidden">
              <Image
                src={currentPhoto}
                alt={`Photo ${currentIndex + 1} of ${validPhotos.length}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous photo"
              >
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                Previous
              </button>

              <span className="text-sm text-text-secondary">
                {currentIndex + 1} of {validPhotos.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next photo"
              >
                Next
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-96 text-text-secondary">
            <p>Photo not available</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

