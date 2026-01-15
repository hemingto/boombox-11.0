/**
 * @fileoverview Reusable success state component for feedback and confirmation screens
 * @source boombox-10.0/src/app/components/reusablecomponents/sendquoteemailpopup.tsx (success state pattern)
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a standardized success feedback UI with customizable icon, title, message, and optional actions.
 * Designed for use in modals, forms, and other confirmation scenarios throughout the application.
 * 
 * API ROUTES UPDATED:
 * - None (Pure UI component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses design system color tokens for consistent success state styling
 * - Implements proper semantic color usage (status-success)
 * - Added consistent spacing and typography using design system tokens
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Extracted from inline success patterns into reusable component
 * - Supports flexible content and action customization
 * - Enhanced accessibility with proper ARIA attributes
 * 
 * @refactor Created as reusable primitive for success feedback patterns across the application
 */

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

export interface SuccessStateProps {
  /**
   * Success icon to display - defaults to CheckCircleIcon
   */
  icon?: React.ReactNode;
  
  /**
   * Success title/heading
   */
  title: string;
  
  /**
   * Success message/description
   */
  message: string;
  
  /**
   * Optional action button or custom content
   */
  action?: React.ReactNode;
  
  /**
   * Additional CSS classes for customization
   */
  className?: string;
  
  /**
   * Size variant for the success state
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether to center align the content
   */
  centered?: boolean;
}

/**
 * SuccessState component for displaying success feedback
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SuccessState
 *   title="Success!"
 *   message="Your quote has been sent successfully."
 * />
 * 
 * // With custom action
 * <SuccessState
 *   title="Booking Confirmed"
 *   message="Your appointment has been scheduled."
 *   action={<Button onClick={onViewDetails}>View Details</Button>}
 * />
 * 
 * // With custom icon and size
 * <SuccessState
 *   icon={<DocumentCheckIcon className="w-12 h-12" />}
 *   title="Document Uploaded"
 *   message="Your document has been processed."
 *   size="lg"
 * />
 * ```
 */
const SuccessState: React.FC<SuccessStateProps> = ({
  icon,
  title,
  message,
  action,
  className,
  size = 'md',
  centered = true,
}) => {
  const sizeClasses = {
    sm: {
      icon: 'w-12 h-12',
      title: 'text-lg font-semibold',
      message: 'text-sm',
      spacing: 'space-y-3',
      iconMargin: 'mb-2',
    },
    md: {
      icon: 'w-16 h-16',
      title: 'text-2xl font-bold',
      message: 'text-base',
      spacing: 'space-y-4',
      iconMargin: 'mb-2',
    },
    lg: {
      icon: 'w-20 h-20',
      title: 'text-3xl font-bold',
      message: 'text-lg',
      spacing: 'space-y-6',
      iconMargin: 'mb-4',
    },
  };

  const currentSize = sizeClasses[size];
  const defaultIcon = (
    <CheckCircleIcon 
      className={cn('text-status-success', currentSize.icon)} 
      aria-hidden="true"
    />
  );

  return (
    <div 
      className={cn(
        currentSize.spacing,
        centered && 'text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Success Icon */}
      <div className={cn('flex', centered ? 'justify-center' : 'justify-start')}>
        <div className={currentSize.iconMargin}>
          {icon || defaultIcon}
        </div>
      </div>

      {/* Success Title */}
      <h3 
        className={cn(
          'text-text-primary',
          currentSize.title
        )}
      >
        {title}
      </h3>

      {/* Success Message */}
      <p 
        className={cn(
          'text-text-primary',
          currentSize.message
        )}
      >
        {message}
      </p>

      {/* Optional Action */}
      {action && (
        <div className={cn('pt-2', centered && 'flex justify-center')}>
          {action}
        </div>
      )}
    </div>
  );
};

export { SuccessState };
