/**
 * @fileoverview Utility functions for appointment tracking status management
 * @source boombox-10.0/src/app/components/appointment-tracking/appointmenttracking.tsx (extracted status logic)
 * 
 * UTILITY FUNCTIONALITY:
 * - Determines appropriate status badge colors and styles
 * - Handles external URL opening for tracking links
 * - Provides consistent status display logic across tracking components
 * - Maps delivery statuses to design system color tokens
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens instead of hardcoded colors
 * - Applies design system badge utility classes
 * - Consistent status color mapping across the application
 * 
 * @refactor Extracted from AppointmentTracking component to centralize status logic
 * and ensure consistent status handling across tracking features
 */

import { type DeliveryUnit } from '@/hooks/useTrackingData';

/**
 * Status badge configuration interface
 */
export interface StatusBadgeConfig {
  /** CSS classes for the status badge */
  className: string;
  /** Display text for the status */
  text: string;
  /** ARIA label for accessibility */
  ariaLabel: string;
}

/**
 * Get status badge configuration for delivery unit status
 * 
 * Maps delivery unit statuses to design system color tokens and appropriate
 * styling classes for consistent status display.
 * 
 * @param status - The delivery unit status
 * @returns Configuration object with classes, text, and accessibility info
 * 
 * @example
 * ```tsx
 * const config = getStatusBadgeConfig('in_transit');
 * return (
 *   <span 
 *     className={config.className}
 *     aria-label={config.ariaLabel}
 *   >
 *     {config.text}
 *   </span>
 * );
 * ```
 */
export function getStatusBadgeConfig(status: DeliveryUnit['status']): StatusBadgeConfig {
  switch (status) {
    case 'in_transit':
      return {
        className: 'text-status-info bg-status-bg-info px-3 py-2 rounded-md text-sm',
        text: 'In transit',
        ariaLabel: 'Delivery status: In transit'
      };
    
    case 'complete':
      return {
        className: 'text-status-success bg-status-bg-success px-3 py-2 rounded-md text-sm',
        text: 'Complete',
        ariaLabel: 'Delivery status: Complete'
      };
    
    case 'pending':
    default:
      return {
        className: 'text-text-tertiary bg-surface-tertiary px-3 py-2 rounded-md text-sm',
        text: 'Pending',
        ariaLabel: 'Delivery status: Pending'
      };
  }
}

/**
 * Get step indicator configuration for tracking step status
 * 
 * Provides consistent styling for step indicators in the tracking timeline.
 * 
 * @param status - The tracking step status
 * @returns CSS classes for the step indicator
 * 
 * @example
 * ```tsx
 * const stepClasses = getStepIndicatorClasses('complete');
 * return <div className={`w-3 h-3 rounded-full mt-1.5 ${stepClasses}`} />;
 * ```
 */
export function getStepIndicatorClasses(status: 'complete' | 'in_transit' | 'pending'): string {
  switch (status) {
    case 'complete':
      return 'bg-primary';
    
    case 'in_transit':
      return 'bg-status-info animate-pulse';
    
    case 'pending':
    default:
      return 'bg-text-tertiary';
  }
}

/**
 * Get text styling classes for tracking step content
 * 
 * Provides consistent text styling based on step status for accessibility
 * and visual hierarchy.
 * 
 * @param status - The tracking step status
 * @returns CSS classes for text styling
 * 
 * @example
 * ```tsx
 * const textClasses = getStepTextClasses('pending');
 * return <h3 className={`text-sm font-medium ${textClasses}`}>{step.title}</h3>;
 * ```
 */
export function getStepTextClasses(status: 'complete' | 'in_transit' | 'pending'): string {
  return status === 'pending' ? 'text-text-tertiary' : 'text-text-primary';
}

/**
 * Get timestamp styling classes for tracking step timestamps
 * 
 * Provides appropriate styling for timestamps, including special handling
 * for ETA displays.
 * 
 * @param timestamp - The timestamp string
 * @param status - The tracking step status
 * @returns CSS classes for timestamp styling
 * 
 * @example
 * ```tsx
 * const timestampClasses = getTimestampClasses(step.timestamp, step.status);
 * return <p className={`mt-1 text-xs ${timestampClasses}`}>{timestamp}</p>;
 * ```
 */
export function getTimestampClasses(timestamp: string, status: 'complete' | 'in_transit' | 'pending'): string {
  if (timestamp.includes('eta')) {
    return 'text-status-success font-medium';
  }
  
  return status === 'pending' ? 'text-text-tertiary' : 'text-text-secondary';
}

/**
 * Get action button styling classes based on step status
 * 
 * Provides consistent button styling for tracking actions with proper
 * disabled states and visual feedback.
 * 
 * @param status - The tracking step status
 * @param isTimerButton - Whether this is a timer button (affects cursor)
 * @returns CSS classes for action button styling
 * 
 * @example
 * ```tsx
 * const buttonClasses = getActionButtonClasses(step.status, !!step.action?.timerData);
 * return (
 *   <button 
 *     className={`mt-4 px-4 py-2 text-sm border rounded-full font-semibold inline-flex items-center gap-1 ${buttonClasses}`}
 *     disabled={step.status === 'pending'}
 *   >
 *     {step.action.label}
 *   </button>
 * );
 * ```
 */
export function getActionButtonClasses(status: 'complete' | 'in_transit' | 'pending', isTimerButton: boolean = false): string {
  const baseClasses = 'mt-4 px-4 py-2 text-sm border rounded-full font-semibold inline-flex items-center gap-1';
  
  if (status === 'pending') {
    return `${baseClasses} bg-surface-disabled border-border text-text-tertiary cursor-not-allowed`;
  }
  
  if (status === 'complete') {
    return `${baseClasses} bg-surface-primary border-border text-text-primary`;
  }
  
  // in_transit status
  const cursorClass = isTimerButton ? 'cursor-default' : '';
  return `${baseClasses} bg-primary text-text-inverse ${cursorClass}`;
}

/**
 * Get secondary action button styling classes
 * 
 * Provides styling for secondary action buttons in tracking steps.
 * 
 * @param status - The tracking step status
 * @returns CSS classes for secondary action button styling
 */
export function getSecondaryActionButtonClasses(status: 'complete' | 'in_transit' | 'pending'): string {
  const baseClasses = 'mt-4 px-4 py-2 text-sm border rounded-full font-semibold inline-flex items-center gap-1';
  
  if (status === 'pending') {
    return `${baseClasses} bg-surface-disabled border-border text-text-tertiary cursor-not-allowed`;
  }
  
  return `${baseClasses} bg-surface-primary text-text-primary border-border`;
}

/**
 * Handle external URL opening for tracking links
 * 
 * Safely opens external URLs in new tabs with proper security measures.
 * 
 * @param url - The URL to open (optional)
 * 
 * @example
 * ```tsx
 * <button onClick={() => handleTrackingClick(step.action?.trackingUrl)}>
 *   Track Package
 * </button>
 * ```
 */
export function handleTrackingClick(url: string | undefined): void {
  if (url) {
    // Open in new tab with security measures
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Fallback for popup blockers
    if (!newWindow) {
      console.warn('Unable to open tracking URL. Popup may be blocked:', url);
      // Could show a toast notification here in the future
    }
  }
}

/**
 * Format ETA timestamp for display
 * 
 * Formats ETA timestamps with appropriate prefix for user display.
 * 
 * @param timestamp - The timestamp string
 * @returns Formatted timestamp with ETA prefix if applicable
 * 
 * @example
 * ```tsx
 * const displayTime = formatTimestampDisplay(step.timestamp);
 * return <p>{displayTime}</p>; // "ETA: 2:30 PM" or "Completed at 2:30 PM"
 * ```
 */
export function formatTimestampDisplay(timestamp: string): string {
  if (timestamp.includes('eta')) {
    return `ETA: ${timestamp.replace('eta', '').trim()}`;
  }
  
  return timestamp;
}

/**
 * Check if a tracking step should show action buttons
 * 
 * Determines whether action buttons should be displayed based on step
 * configuration and unit index.
 * 
 * @param hasAction - Whether the step has an action configured
 * @param actionLabel - The action label
 * @param unitIndex - The delivery unit index
 * @param hasTrackingUrl - Whether the action has a tracking URL
 * @returns Whether to show the action button
 */
export function shouldShowActionButton(
  hasAction: boolean,
  actionLabel: string,
  unitIndex: number,
  hasTrackingUrl: boolean
): boolean {
  if (!hasAction) return false;
  
  return (actionLabel === 'Track location') || (unitIndex === 0 && !hasTrackingUrl);
}

/**
 * Check if a secondary action should be shown
 * 
 * Determines whether secondary action buttons should be displayed.
 * 
 * @param hasSecondaryAction - Whether the step has a secondary action
 * @param unitIndex - The delivery unit index
 * @returns Whether to show the secondary action button
 */
export function shouldShowSecondaryAction(hasSecondaryAction: boolean, unitIndex: number): boolean {
  return hasSecondaryAction && unitIndex === 0;
}
