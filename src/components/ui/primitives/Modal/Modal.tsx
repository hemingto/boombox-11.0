/**
 * @fileoverview Modal component with pure Tailwind CSS
 * @source boombox-10.0/src/app/components/reusablecomponents/modal.tsx
 * @source boombox-10.0/src/app/components/reusablecomponents/informationalpopup.tsx
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (modal patterns)
 * @refactor Custom modal implementation using Tailwind CSS for easy customization
 */

import { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal variant - affects styling and behavior
   */
  variant?: 'default' | 'notification';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Whether to show close button
   */
  showCloseButton?: boolean;

  /**
   * Whether clicking outside closes modal
   */
  closeOnOverlayClick?: boolean;

  /**
   * Show a default "Got it, thanks!" button for notifications
   */
  showNotificationButton?: boolean;

  /**
   * Custom text for the notification button
   */
  notificationButtonText?: string;

  /**
   * Additional CSS classes for modal content
   */
  className?: string;

  /**
   * Additional CSS classes for modal overlay
   */
  overlayClassName?: string;

  /**
   * Modal content
   */
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  showNotificationButton = false,
  notificationButtonText = 'Got it, thanks!',
  className,
  overlayClassName,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const modalSizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Set defaults for notification variant
  const isNotification = variant === 'notification';
  const effectiveSize = isNotification ? 'sm' : size;
  const effectiveCloseOnOverlayClick = isNotification ? true : closeOnOverlayClick;
  const effectiveShowCloseButton = isNotification ? true : showCloseButton;

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus the modal for accessibility
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && effectiveCloseOnOverlayClick) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Modal container with overlay */}
      <div 
        className="fixed inset-0 z-50 overflow-y-auto"
        onClick={handleOverlayClick}
      >
        {/* Background overlay */}
        <div
          className={cn('modal-overlay', overlayClassName)}
          aria-hidden="true"
        />
        <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'modal-content',
            'w-full',
            modalSizeClasses[effectiveSize],
            'relative',
            'animate-fadeIn',
            isNotification && 'bg-surface-primary p-6 rounded-lg shadow-xl',
            className
          )}
        >
          {/* Close button */}
          {effectiveShowCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-full hover:bg-surface-tertiary active:bg-surface-disabled transition-colors z-10",
                isNotification && "text-text-secondary hover:text-text-primary"
              )}
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          {title && (
            <div className="mb-4">
              <h2
                id="modal-title"
                className={cn(
                  "text-xl font-semibold text-text-primary mt-4 mb-2",
                  isNotification && "text-lg font-medium leading-6 mt-0"
                )}
              >
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className={cn(
            "[&>.flex.justify-end]:mt-8",
            isNotification && "text-sm text-text-secondary mt-2"
          )}>
            {children}
          </div>

          {/* Notification button */}
          {isNotification && showNotificationButton && (
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={onClose}
              >
                {notificationButtonText}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export { Modal };
