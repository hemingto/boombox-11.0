/**
 * @fileoverview Modal component with Headless UI integration
 * @source boombox-10.0/src/app/components/reusablecomponents/modal.tsx
 * @source boombox-10.0/src/app/components/reusablecomponents/informationalpopup.tsx
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (modal patterns)
 * @refactor Unified modal system using Headless UI for better accessibility
 */

import { Fragment } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
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
   * Modal description
   */
  description?: string;

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
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  overlayClassName,
  children,
}) => {
  const handleClose = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const modalSizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={cn('modal-overlay', overlayClassName)} />
        </TransitionChild>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={cn(
                  'modal-content',
                  'w-full',
                  modalSizeClasses[size],
                  'relative',
                  className
                )}
              >
                {/* Close button */}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors z-10"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="w-5 h-5 text-zinc-950" />
                  </button>
                )}

                {/* Header */}
                {(title || description) && (
                  <div className="mb-6">
                    {title && (
                      <DialogTitle className="text-2xl font-semibold text-zinc-950 mb-2">
                        {title}
                      </DialogTitle>
                    )}
                    {description && (
                      <p className="text-zinc-600">{description}</p>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={cn(showCloseButton && 'pr-12')}>{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export { Modal };
