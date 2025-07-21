/**
 * @fileoverview LoadingOverlay component for full-screen loading states
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (loading overlay pattern)
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (loading overlay)
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (loading overlay)
 * @refactor Consolidated full-screen loading patterns into reusable component
 */

import { cn } from '@/lib/utils/cn';
import { Spinner } from './Spinner';

export interface LoadingOverlayProps {
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
  message = 'Loading...',
  spinnerSize = 'xl',
  className,
  contentClassName,
}) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-zinc-950 bg-opacity-50 flex flex-col items-center justify-center z-50',
        className
      )}
    >
      <div className={cn('flex flex-col items-center', contentClassName)}>
        <Spinner size={spinnerSize} variant="white" className="mb-4" />
        {message && <p className="text-white text-sm font-medium">{message}</p>}
      </div>
    </div>
  );
};

export { LoadingOverlay };
