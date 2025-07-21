/**
 * @fileoverview FormActions component for consistent submit/cancel button patterns
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (form button patterns)
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (form submission)
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (form actions)
 * @refactor Created reusable form actions component with consistent styling
 */

import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/primitives/Button';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';

export interface FormActionsProps {
  /**
   * Text for the submit button
   */
  submitText?: string;

  /**
   * Text for the cancel button
   */
  cancelText?: string;

  /**
   * Whether to show the cancel button
   */
  showCancel?: boolean;

  /**
   * Cancel button click handler
   */
  onCancel?: () => void;

  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean;

  /**
   * Loading message during submission
   */
  loadingMessage?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Button alignment
   */
  alignment?: 'left' | 'right' | 'center' | 'between';

  /**
   * Button size variant
   */
  buttonSize?: 'sm' | 'md' | 'lg';

  /**
   * Whether to disable the submit button
   */
  disabled?: boolean;
}

/**
 * FormActions component for consistent submit/cancel button patterns
 * Integrates with React Hook Form for form state management
 */
const FormActions: React.FC<FormActionsProps> = ({
  submitText = 'Submit',
  cancelText = 'Cancel',
  showCancel = false,
  onCancel,
  isSubmitting = false,
  loadingMessage = 'Processing...',
  className,
  alignment = 'left',
  buttonSize = 'md',
  disabled = false,
}) => {
  const {
    formState: { isValid },
  } = useFormContext();

  const containerClasses = cn(
    'flex gap-4',
    {
      'justify-start': alignment === 'left',
      'justify-end': alignment === 'right',
      'justify-center': alignment === 'center',
      'justify-between': alignment === 'between',
    },
    className
  );

  // Determine if submit should be disabled
  const isSubmitDisabled = disabled || isSubmitting || !isValid;

  return (
    <>
      <div className={containerClasses}>
        {/* Cancel Button */}
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            size={buttonSize}
            onClick={onCancel}
            disabled={isSubmitting}
            className="font-inter"
          >
            {cancelText}
          </Button>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size={buttonSize}
          disabled={isSubmitDisabled}
          loading={isSubmitting}
          className="font-inter"
        >
          {isSubmitting ? 'Processing...' : submitText}
        </Button>
      </div>

      {/* Loading Overlay (matches boombox-10.0 pattern) */}
      <LoadingOverlay
        visible={isSubmitting}
        message={loadingMessage}
        spinnerSize="lg"
      />
    </>
  );
};

// Specialized form actions for common patterns

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SubmitOnlyActionsProps
  extends Omit<FormActionsProps, 'showCancel' | 'onCancel'> {}

/**
 * Submit-only actions (most common pattern in boombox-10.0)
 */
const SubmitOnlyActions: React.FC<SubmitOnlyActionsProps> = props => {
  return <FormActions {...props} showCancel={false} />;
};

export interface StepFormActionsProps extends FormActionsProps {
  /**
   * Text for the back button
   */
  backText?: string;

  /**
   * Back button click handler
   */
  onBack?: () => void;

  /**
   * Whether to show the back button
   */
  showBack?: boolean;

  /**
   * Whether this is the last step
   */
  isLastStep?: boolean;
}

/**
 * Step form actions for multi-step forms (like quote forms)
 */
const StepFormActions: React.FC<StepFormActionsProps> = ({
  backText = 'Back',
  onBack,
  showBack = true,
  isLastStep = false,
  submitText,
  ...props
}) => {
  const finalSubmitText = isLastStep
    ? submitText || 'Submit'
    : submitText || 'Continue';

  return (
    <FormActions
      {...props}
      submitText={finalSubmitText}
      showCancel={showBack}
      cancelText={backText}
      onCancel={onBack}
      alignment="between"
    />
  );
};

export { FormActions, SubmitOnlyActions, StepFormActions };
