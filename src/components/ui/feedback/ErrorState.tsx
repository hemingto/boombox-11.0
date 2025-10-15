/**
 * @fileoverview ErrorState component for displaying error feedback
 * @source Created for boombox-11.0 design system
 * @refactor Centralized error state component for consistent error handling across the app
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface ErrorStateProps {
  /**
   * Custom icon to display (optional)
   */
  icon?: React.ReactNode;
  
  /**
   * Error title
   */
  title: string;
  
  /**
   * Error message or description
   */
  message: string;
  
  /**
   * Optional action button or element
   */
  action?: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether to center align the content
   */
  centered?: boolean;
}

/**
 * ErrorState component for displaying error feedback
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorState
 *   title="Something went wrong"
 *   message="We couldn't load your data. Please try again."
 * />
 * 
 * // With custom action
 * <ErrorState
 *   title="Connection Error"
 *   message="Unable to connect to the server."
 *   action={<Button onClick={onRetry}>Try Again</Button>}
 * />
 * 
 * // With custom icon and size
 * <ErrorState
 *   icon={<WifiIcon className="w-12 h-12" />}
 *   title="Network Error"
 *   message="Check your internet connection."
 *   size="lg"
 * />
 * ```
 */
const ErrorState: React.FC<ErrorStateProps> = ({
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
      title: 'text-2xl font-semibold',
      message: 'text-base',
      spacing: 'space-y-4',
      iconMargin: 'mb-4',
    },
    lg: {
      icon: 'w-20 h-20',
      title: 'text-3xl font-semibold',
      message: 'text-lg',
      spacing: 'space-y-6',
      iconMargin: 'mb-4',
    },
  };

  const currentSize = sizeClasses[size];
  const defaultIcon = (
    <div className={cn(
      'mx-auto rounded-full bg-status-bg-error flex items-center justify-center',
      currentSize.iconMargin,
      currentSize.icon
    )}>
      <ExclamationTriangleIcon 
        className={cn('text-status-error', 'w-1/2 h-1/2')} 
        aria-hidden="true"
      />
    </div>
  );

  return (
    <div 
      className={cn(
        currentSize.spacing,
        centered && 'text-center',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className={cn('flex', centered ? 'justify-center' : 'justify-start')}>
        {icon || defaultIcon}
      </div>

      {/* Error Title */}
      <h3 
        className={cn(
          'text-text-primary',
          currentSize.title
        )}
      >
        {title}
      </h3>

      {/* Error Message */}
      <p 
        className={cn(
          'text-text-secondary',
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

export { ErrorState };
