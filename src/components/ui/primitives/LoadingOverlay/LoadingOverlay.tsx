/**
 * @fileoverview LoadingOverlay component for full-screen loading states
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (loading overlay pattern)
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (loading overlay)
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (loading overlay)
 * @refactor Consolidated full-screen loading patterns into reusable component
 * @design Uses design system overlay colors for consistent theming
 */

import { cn } from '@/lib/utils/cn';
import { Spinner } from '../Spinner';

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the overlay is visible
   */
  visible: boolean;

  /**
   * Loading message to display
   */
  message?: string;

  /**
   * Spinner size
   */
  spinnerSize?: 'md' | 'lg' | 'xl';

  /**
   * Additional CSS classes for overlay
   */
  className?: string;

  /**
   * Additional CSS classes for content
   */
  contentClassName?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  spinnerSize = 'xl',
  className,
  contentClassName,
  ...props
}) => {
  if (!visible) return null;

  // Use default message only if message prop is not provided
  const displayMessage = message !== undefined ? message : 'Loading...';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center z-[9999]',
        'bg-overlay-primary', // Uses design system overlay color
        className
      )}
      {...props}
    >
      <div className={cn('flex flex-col items-center', contentClassName)}>
        <Spinner size={spinnerSize} variant="white" className="mb-4" label="Loading content" />
        {displayMessage && <p className="text-white text-sm font-medium">{displayMessage}</p>}
      </div>
    </div>
  );
};

export { LoadingOverlay };
