/**
 * @fileoverview Tooltip component with Headless UI integration for accessibility
 * @source boombox-10.0/src/app/components/reusablecomponents/tooltip.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Accessible tooltip component using Headless UI for proper ARIA support.
 * Displays contextual information on hover/focus with proper positioning.
 * 
 * USED BY (boombox-10.0 files):
 * - To be determined during component usage analysis
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced manual hover state with Headless UI for better accessibility
 * - Enhanced with positioning options and improved styling
 * - Added keyboard navigation and focus management
 * 
 * @refactor Enhanced simple tooltip with Headless UI for comprehensive accessibility
 */

import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils/cn';

export interface TooltipProps {
  /**
   * The tooltip content text
   */
  text: string;

  /**
   * The trigger element - if not provided, uses default question mark icon
   */
  children?: React.ReactNode;

  /**
   * Position of tooltip relative to trigger
   */
  position?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Size of default icon
   */
  iconSize?: 'sm' | 'md' | 'lg';

  /**
   * Custom className for the tooltip trigger
   */
  className?: string;

  /**
   * Custom className for the tooltip content
   */
  tooltipClassName?: string;

  /**
   * Whether to show on hover (true) or click (false)
   */
  showOnHover?: boolean;

  /**
   * Delay before showing tooltip on hover (in ms)
   */
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'top',
  iconSize = 'md',
  className,
  tooltipClassName,
  showOnHover = true,
  delay = 200,
}) => {
  // Position classes for tooltip
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Default trigger element
  const defaultTrigger = (
    <QuestionMarkCircleIcon
      className={cn(
        'cursor-help text-zinc-950',
        iconSizeClasses[iconSize],
        className
      )}
      aria-hidden="true"
    />
  );

  return (
    <div className="group relative inline-flex items-center">
      {/* Trigger element */}
      {children ? (
        <div 
          className={cn('inline-flex items-center', className)}
          aria-describedby="tooltip-content"
          aria-label="More information"
        >
          {children}
        </div>
      ) : (
        <div 
          className="inline-flex items-center"
          role="button"
          tabIndex={0}
          aria-describedby="tooltip-content"
          aria-label="More information"
        >
          {defaultTrigger}
        </div>
      )}

        {/* Tooltip content */}
        <div
          id="tooltip-content"
          role="tooltip"
          aria-label={text}
          className={cn(
            'absolute z-50 w-max max-w-xs pointer-events-none opacity-0 transition-opacity duration-200',
            'p-3 text-sm text-zinc-950 bg-surface-primary rounded-md shadow-custom-shadow',
            'group-hover:opacity-100 group-focus-within:opacity-100',
            positionClasses[position],
            showOnHover ? 'group-hover:opacity-100' : '',
            tooltipClassName
          )}
          style={{
            transitionDelay: showOnHover ? `${delay}ms` : '0ms',
          }}
        >
          <p className="text-sm">
            {text}
          </p>
          
          {/* Arrow pointer */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-white border border-border rotate-45',
              {
                'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0': position === 'top',
                'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0': position === 'bottom',
                'left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-l-0 border-b-0': position === 'left',
                'right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-r-0 border-t-0': position === 'right',
              }
            )}
          />
        </div>
    </div>
  );
};

export { Tooltip };
