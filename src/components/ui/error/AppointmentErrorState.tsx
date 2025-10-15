/**
 * @fileoverview Appointment Error State - Enhanced error handling for appointment loading
 * @source Created for boombox-11.0 edit appointment functionality
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides comprehensive error handling with different error types, retry mechanisms,
 * and user-friendly messaging. Includes accessibility features and proper error recovery.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic error colors and design system components
 * - Implements proper ARIA attributes and error announcements
 * - Follows consistent spacing and typography patterns
 * 
 * @refactor Created as part of enhanced error states for edit appointment feature
 */

'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

export type AppointmentErrorType = 
  | 'not_found' 
  | 'network_error' 
  | 'unauthorized' 
  | 'server_error' 
  | 'validation_error'
  | 'unknown_error';

interface AppointmentErrorStateProps {
  errorType: AppointmentErrorType;
  errorMessage?: string;
  appointmentId?: string;
  userId?: string;
  onRetry?: () => Promise<void>;
  onGoHome?: () => void;
  className?: string;
}

export function AppointmentErrorState({
  errorType,
  errorMessage,
  appointmentId,
  userId,
  onRetry,
  onGoHome,
  className = ''
}: AppointmentErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  // Get error details based on type
  const getErrorDetails = () => {
    switch (errorType) {
      case 'not_found':
        return {
          title: 'Appointment Not Found',
          description: appointmentId 
            ? `We couldn't find appointment #${appointmentId}. It may have been cancelled or the ID might be incorrect.`
            : 'The requested appointment could not be found. It may have been cancelled or moved.',
          icon: ExclamationTriangleIcon,
          showRetry: false,
          actions: [
            { label: 'Go to My Appointments', action: onGoHome, variant: 'primary' as const }
          ]
        };
      
      case 'unauthorized':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to edit this appointment. Please make sure you\'re logged in with the correct account.',
          icon: ExclamationTriangleIcon,
          showRetry: false,
          actions: [
            { label: 'Go to My Appointments', action: onGoHome, variant: 'primary' as const }
          ]
        };
      
      case 'network_error':
        return {
          title: 'Connection Problem',
          description: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
          icon: ExclamationTriangleIcon,
          showRetry: true,
          actions: [
            { label: 'Try Again', action: handleRetry, variant: 'primary' as const },
            { label: 'Go Back', action: onGoHome, variant: 'secondary' as const }
          ]
        };
      
      case 'server_error':
        return {
          title: 'Server Error',
          description: 'Our servers are experiencing issues. Please try again in a few minutes.',
          icon: ExclamationTriangleIcon,
          showRetry: true,
          actions: [
            { label: 'Try Again', action: handleRetry, variant: 'primary' as const },
            { label: 'Go Back', action: onGoHome, variant: 'secondary' as const }
          ]
        };
      
      case 'validation_error':
        return {
          title: 'Invalid Appointment Data',
          description: 'The appointment data appears to be corrupted or invalid. Please contact support if this continues.',
          icon: ExclamationTriangleIcon,
          showRetry: true,
          actions: [
            { label: 'Try Again', action: handleRetry, variant: 'primary' as const },
            { label: 'Contact Support', action: () => window.open('mailto:help@boomboxstorage.com'), variant: 'secondary' as const }
          ]
        };
      
      default:
        return {
          title: 'Something Went Wrong',
          description: errorMessage || 'An unexpected error occurred while loading your appointment. Please try again.',
          icon: ExclamationTriangleIcon,
          showRetry: true,
          actions: [
            { label: 'Try Again', action: handleRetry, variant: 'primary' as const },
            { label: 'Go Back', action: onGoHome, variant: 'secondary' as const }
          ]
        };
    }
  };

  async function handleRetry() {
    if (!onRetry) return;
    
    try {
      setIsRetrying(true);
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }

  const errorDetails = getErrorDetails();
  const IconComponent = errorDetails.icon;

  return (
    <div 
      className={`md:flex gap-x-8 lg:gap-x-16 mt-12 sm:mt-24 lg:px-16 px-6 justify-center mb-10 sm:mb-64 items-start ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-lg mx-auto text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-status-bg-error rounded-full flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-status-error" aria-hidden="true" />
          </div>
        </div>
        
        {/* Error Title */}
        <h1 className="text-2xl font-semibold text-text-primary mb-4">
          {errorDetails.title}
        </h1>
        
        {/* Error Description */}
        <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-md mx-auto">
          {errorDetails.description}
        </p>
        
        {/* Technical Error Details (if provided) */}
        {errorMessage && errorType !== 'not_found' && errorType !== 'unauthorized' && (
          <details className="mb-8 text-left">
            <summary className="text-sm text-text-tertiary cursor-pointer hover:text-text-secondary">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-surface-tertiary rounded-lg text-sm text-text-secondary font-mono">
              {errorMessage}
            </div>
          </details>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {errorDetails.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              disabled={isRetrying && action.label === 'Try Again'}
              className={`
                ${action.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
                ${isRetrying && action.label === 'Try Again' ? 'opacity-50 cursor-not-allowed' : ''}
                flex items-center justify-center gap-2 min-w-[140px]
              `}
              aria-describedby={action.label === 'Try Again' ? 'retry-status' : undefined}
            >
              {isRetrying && action.label === 'Try Again' ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Retrying...
                </>
              ) : action.label === 'Go to My Appointments' || action.label === 'Go Back' ? (
                <>
                  <HomeIcon className="w-4 h-4" aria-hidden="true" />
                  {action.label}
                </>
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
        
        {/* Retry Status for Screen Readers */}
        {isRetrying && (
          <div id="retry-status" className="sr-only" aria-live="polite">
            Retrying to load appointment details...
          </div>
        )}
        
        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-text-tertiary">
            Need help? Contact us at{' '}
            <a 
              href="mailto:help@boomboxstorage.com" 
              className="text-primary hover:text-primary-hover underline"
            >
              help@boomboxstorage.com
            </a>
            {appointmentId && (
              <span className="block mt-1">
                Reference: Appointment #{appointmentId}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AppointmentErrorState;
