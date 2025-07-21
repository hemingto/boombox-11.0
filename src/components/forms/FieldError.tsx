/**
 * @fileoverview FieldError component matching boombox-10.0 error styling patterns
 * @source boombox-10.0/src/app/components/reusablecomponents/textinput.tsx (error display pattern)
 * @source boombox-10.0/src/app/components/reusablecomponents/firstnameinput.tsx (error styling)
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx (error styling)
 * @refactor Consolidated error display patterns into reusable component
 */

import { cn } from '@/lib/utils/cn';

export interface FieldErrorProps {
  /**
   * Error message to display
   */
  message?: string;

  /**
   * Whether to show the error
   */
  show?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Unique ID for accessibility (should match field's aria-describedby)
   */
  id?: string;
}

/**
 * FieldError component that displays form field errors
 * Matches the exact styling patterns from boombox-10.0
 */
const FieldError: React.FC<FieldErrorProps> = ({
  message,
  show = true,
  className,
  id,
}) => {
  // Don't render if no message or show is false
  if (!message || !show) {
    return null;
  }

  return (
    <p
      id={id}
      className={cn(
        // Base error styles from boombox-10.0
        'text-red-500 text-sm',
        // Margin patterns from boombox-10.0 (sm:-mt-2 mb-3 or mt-1)
        'mt-1',
        className
      )}
      role="alert" // Accessibility: announce errors to screen readers
      aria-live="polite" // Don't interrupt user, but announce when convenient
    >
      {message}
    </p>
  );
};

export { FieldError };
