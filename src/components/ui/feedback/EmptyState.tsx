/**
 * @fileoverview EmptyState component for displaying empty data states
 * @source Created for boombox-11.0 design system
 * @refactor Centralized empty state component for consistent empty data handling across the app
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { DocumentIcon } from '@heroicons/react/24/outline';

export interface EmptyStateProps {
  /**
   * Custom icon to display (optional)
   */
  icon?: React.ReactNode;
  
  /**
   * Empty state title
   */
  title: string;
  
  /**
   * Empty state message or description
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
 * EmptyState component for displaying empty data states
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <EmptyState
 *   title="No data available"
 *   message="There's nothing to show here yet."
 * />
 * 
 * // With custom action
 * <EmptyState
 *   title="No appointments found"
 *   message="You don't have any appointments scheduled."
 *   action={<Button onClick={onCreateAppointment}>Schedule Appointment</Button>}
 * />
 * 
 * // With custom icon and size
 * <EmptyState
 *   icon={<CalendarIcon className="w-12 h-12" />}
 *   title="No Events"
 *   message="Your calendar is empty."
 *   size="lg"
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
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
      title: 'text-lg font-medium',
      message: 'text-sm',
      spacing: 'space-y-3',
      iconMargin: 'mb-2',
    },
    md: {
      icon: 'w-16 h-16',
      title: 'text-2xl font-medium',
      message: 'text-base',
      spacing: 'space-y-4',
      iconMargin: 'mb-4',
    },
    lg: {
      icon: 'w-20 h-20',
      title: 'text-3xl font-medium',
      message: 'text-lg',
      spacing: 'space-y-6',
      iconMargin: 'mb-4',
    },
  };

  const currentSize = sizeClasses[size];
  const defaultIcon = (
    <div className={cn(
      'mx-auto rounded-full bg-surface-tertiary flex items-center justify-center',
      currentSize.iconMargin,
      currentSize.icon
    )}>
      <DocumentIcon 
        className={cn('text-text-tertiary', 'w-1/2 h-1/2')} 
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
      role="status"
      aria-live="polite"
    >
      {/* Empty Icon */}
      <div className={cn('flex', centered ? 'justify-center' : 'justify-start')}>
        {icon || defaultIcon}
      </div>

      {/* Empty Title */}
      <h3 
        className={cn(
          'text-text-primary',
          currentSize.title
        )}
      >
        {title}
      </h3>

      {/* Empty Message */}
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

export { EmptyState };
