/**
 * @fileoverview Send quote email modal component using Modal primitive and EmailInput
 * @source boombox-10.0/src/app/components/reusablecomponents/sendquoteemailpopup.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a modal interface for customers to email their storage quotes. Features email validation,
 * loading states, success feedback, and comprehensive error handling. Uses the Modal primitive for
 * consistent modal behavior and EmailInput for standardized email input functionality.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/send-quote-email → New: /api/orders/send-quote-email (handled by QuoteService)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom modal implementation with Modal primitive
 * - Uses EmailInput component for consistent email input styling
 * - Applied design system color tokens throughout component
 * - Uses SuccessState component for standardized success feedback
 * - Implemented Button component for consistent button styling
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Extracted business logic into useSendQuoteEmail custom hook
 * - Separated API calls into QuoteService for reusability
 * - Component focuses purely on UI rendering and user interactions
 * - Enhanced accessibility with proper ARIA attributes and keyboard navigation
 * - Improved type safety with comprehensive TypeScript interfaces
 * 
 * @refactor Migrated from custom modal implementation to design system compliance with centralized
 * business logic, enhanced accessibility features, and clean component architecture
 */

import React from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { Button } from '@/components/ui/primitives/Button/Button';
import { SuccessState } from '@/components/ui/feedback/SuccessState';
import EmailInput from '@/components/forms/EmailInput';
import { useSendQuoteEmail } from '@/hooks/useSendQuoteEmail';
import { cn } from '@/lib/utils/cn';

// Re-export QuoteData type for convenience
export type { QuoteData } from '@/lib/services/quoteService';

export interface SendQuoteEmailModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  
  /**
   * Quote data to send via email
   */
  quoteData?: import('@/lib/services/quoteService').QuoteData;
  
  /**
   * CSS class name for the trigger button icon
   */
  iconClassName?: string;
  
  /**
   * Callback fired when email is sent successfully
   */
  onSuccess?: (email: string) => void;
  
  /**
   * Callback fired when email sending fails
   */
  onError?: (error: string) => void;
}

/**
 * Trigger button component for opening the send quote email modal
 */
export interface SendQuoteEmailTriggerProps {
  /**
   * Callback to open the modal
   */
  onClick: () => void;
  
  /**
   * CSS class name for the icon
   */
  iconClassName?: string;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

const SendQuoteEmailTrigger: React.FC<SendQuoteEmailTriggerProps> = ({
  onClick,
  iconClassName,
  disabled = false,
}) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "text-text-primary flex gap-1 items-center transition-colors",
      "hover:text-primary focus:text-primary",
      "disabled:text-text-disabled disabled:cursor-not-allowed"
    )}
    aria-label="Email your quote"
  >
    <DocumentArrowUpIcon className={cn("w-5 h-5", iconClassName)} />
  </button>
);

/**
 * SendQuoteEmailModal component for emailing storage quotes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SendQuoteEmailModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   quoteData={currentQuote}
 * />
 * 
 * // With callbacks
 * <SendQuoteEmailModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   quoteData={currentQuote}
 *   onSuccess={(email) => console.log(`Quote sent to ${email}`)}
 *   onError={(error) => console.error('Failed to send quote:', error)}
 * />
 * ```
 */
const SendQuoteEmailModal: React.FC<SendQuoteEmailModalProps> = ({
  isOpen,
  onClose,
  quoteData,
  onSuccess,
  onError,
}) => {
  // Use custom hook for business logic
  const {
    email,
    setEmail,
    error,
    isLoading,
    isSuccess,
    sendQuoteEmail,
    reset,
  } = useSendQuoteEmail({
    onSuccess,
    onError,
  });

  /**
   * Handle modal close with state reset
   */
  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quoteData) {
      return;
    }

    await sendQuoteEmail(quoteData);
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={!isSuccess ? "Email your quote" : undefined}
      size="sm"
      closeOnOverlayClick={!isLoading}
      showCloseButton={!isLoading}
      className="bg-surface-primary p-6 rounded-lg shadow-xl"
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Input */}
          <div className="mb-8">
            <EmailInput
              value={email}
              onEmailChange={setEmail}
              placeholder="Enter your email"
              required
              validateOnChange={false}
              disabled={isLoading}
              hasError={!!error}
              errorMessage={error}
              className="w-full"
              aria-describedby="quote-email-description"
            />
            
            {/* Helper text */}
            <p 
              id="quote-email-description"
              className="text-sm text-text-secondary mt-2"
            >
              We'll send a copy of your quote to this email address.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="text-sm"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading || !quoteData || !email.trim()}
              className="min-w-[80px]"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      ) : (
        <SuccessState
          title="Success!"
          message="A copy of your quote has been sent to your email address."
          size="md"
          centered
        />
      )}
    </Modal>
  );
};

/**
 * Complete SendQuoteEmail component with trigger button and modal
 * 
 * @example
 * ```tsx
 * <SendQuoteEmail
 *   quoteData={currentQuote}
 *   iconClassName="text-primary"
 * />
 * ```
 */
export interface SendQuoteEmailProps {
  /**
   * Quote data to send via email
   */
  quoteData?: import('@/lib/services/quoteService').QuoteData;
  
  /**
   * CSS class name for the trigger button icon
   */
  iconClassName?: string;
  
  /**
   * Callback fired when email is sent successfully
   */
  onSuccess?: (email: string) => void;
  
  /**
   * Callback fired when email sending fails
   */
  onError?: (error: string) => void;
}

const SendQuoteEmail: React.FC<SendQuoteEmailProps> = ({
  quoteData,
  iconClassName,
  onSuccess,
  onError,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <SendQuoteEmailTrigger
        onClick={handleOpenModal}
        iconClassName={iconClassName}
        disabled={!quoteData}
      />
      
      <SendQuoteEmailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        quoteData={quoteData}
        onSuccess={onSuccess}
        onError={onError}
      />
    </>
  );
};

export default SendQuoteEmail;
export { SendQuoteEmailModal, SendQuoteEmailTrigger };
