/**
 * @fileoverview AppointmentTracking component for customer-facing delivery tracking
 * @source boombox-10.0/src/app/components/appointment-tracking/appointmenttracking.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays real-time appointment tracking with expandable delivery units
 * - Shows Google Maps integration with delivery location
 * - Provides step-by-step tracking progress with status indicators
 * - Supports timer integration for active delivery tracking
 * - Handles multiple delivery units with individual progress tracking
 * - Includes external tracking link integration
 * 
 * API ROUTES UPDATED:
 * - Component no longer handles API calls directly
 * - Data fetching moved to useTrackingData custom hook
 * - Uses migrated API route: POST /api/customers/tracking/verify
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with semantic design tokens
 * - Updated status badges to use design system color classes
 * - Applied consistent text hierarchy with design system tokens
 * - Used design system utility classes for spacing and layout
 * - Implemented proper focus states and accessibility features
 * 
 * @refactor 
 * - Extracted API calls to useTrackingData custom hook
 * - Extracted height management to useExpandableHeight hook
 * - Extracted status logic to trackingStatusUtils
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * - Applied design system colors and utility classes throughout
 * - Improved component architecture with separation of concerns
 * - Added comprehensive TypeScript interfaces and JSDoc documentation
 */

'use client';

import React from 'react';
import { format, addHours } from 'date-fns';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { MapIcon, ClockIcon, DocumentCurrencyDollarIcon, StarIcon } from '@heroicons/react/24/outline';
import { ElapsedTimer } from '@/components/ui/primitives/ElapsedTimer';
import { useExpandableHeight } from '@/hooks/useExpandableHeight';
import { 
  getStatusBadgeConfig,
  getStepIndicatorClasses,
  getStepTextClasses,
  getTimestampClasses,
  getActionButtonClasses,
  getSecondaryActionButtonClasses,
  handleTrackingClick,
  formatTimestampDisplay,
  shouldShowActionButton,
  shouldShowSecondaryAction
} from '@/lib/utils/trackingStatusUtils';
import { type AppointmentTrackingProps } from '@/hooks/useTrackingData';
import { cn } from '@/lib/utils/cn';

// Map styles import - will need to be migrated to boombox-11.0 structure
const mapStyles = [
  {
    "featureType": "all",
    "elementType": "geometry.fill",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "administrative",
    "elementType": "all",
    "stylers": [{ "color": "#f2f2f2" }]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#686868" }, { "visibility": "on" }]
  },
  {
    "featureType": "landscape",
    "elementType": "all",
    "stylers": [{ "color": "#f2f2f2" }]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "all",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "all",
    "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [{ "color": "#b7e4f4" }, { "visibility": "on" }]
  }
];

// Create an icon map for dynamic icon rendering
const iconMap = {
  MapIcon,
  ClockIcon,
  DocumentCurrencyDollarIcon,
  StarIcon
} as const;

/**
 * AppointmentTracking - Customer-facing appointment tracking component
 * 
 * Displays comprehensive tracking information for storage unit deliveries
 * with interactive expandable sections, Google Maps integration, and
 * real-time status updates.
 */
export function AppointmentTracking({ 
  appointmentDate, 
  deliveryUnits, 
  location, 
  appointmentType 
}: AppointmentTrackingProps) {
  // Initialize expandable height management with first unit expanded
  const {
    expandedSections,
    maxHeights,
    contentRefs,
    toggleSection,
    setInitialExpanded
  } = useExpandableHeight([]);

  // Initialize first unit's height when delivery units are available
  React.useEffect(() => {
    if (deliveryUnits.length > 0) {
      setInitialExpanded([deliveryUnits[0].id]);
    }
  }, [deliveryUnits, setInitialExpanded]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 mb-64">
      {/* Header Section */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          {appointmentType}
        </h1>
        <p className="text-sm text-text-primary">
          {format(appointmentDate, "EEEE, MMM do 'scheduled between' h:mma")} - {format(addHours(appointmentDate, 1), 'h:mma')}
        </p>
      </header>
      
      {/* Google Maps Section */}
      <section 
        className="w-full h-32 rounded-t-md overflow-hidden mb-4"
        aria-label="Delivery location map"
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={location.coordinates}
          zoom={14}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            fullscreenControl: false,
          }}
        >
          <Marker 
            position={location.coordinates}
            title="Delivery location"
          />
        </GoogleMap>
      </section>

      {/* Delivery Units Section */}
      <section aria-label="Delivery units tracking">
        {deliveryUnits.map((unit, unitIndex) => {
          const statusConfig = getStatusBadgeConfig(unit.status);
          const isExpanded = expandedSections.includes(unit.id);
          
          return (
            <article 
              key={unit.id} 
              className="bg-surface-primary border-b border-border"
            >
              {/* Unit Header - Clickable to expand/collapse */}
              <button
                onClick={() => toggleSection(unit.id)}
                className="w-full px-4 py-4 flex items-center justify-between text-text-primary transition-colors hover:bg-surface-secondary focus:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                aria-expanded={isExpanded}
                aria-controls={`unit-content-${unit.id}`}
                aria-labelledby={`unit-header-${unit.id}`}
              >
                <div>
                  <h2 
                    id={`unit-header-${unit.id}`}
                    className="text-base font-semibold text-left"
                  >
                    Boombox delivery ({unit.unitNumber} of {unit.totalUnits})
                  </h2>
                  <p className="text-sm text-left text-text-secondary">
                    with {unit.provider}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <span 
                    className={statusConfig.className}
                    aria-label={statusConfig.ariaLabel}
                  >
                    {statusConfig.text}
                  </span>
                  
                  {/* Expand/Collapse Icon */}
                  {isExpanded ? (
                    <ChevronUpIcon 
                      className="w-5 h-5 text-text-secondary" 
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDownIcon 
                      className="w-5 h-5 text-text-secondary" 
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>

              {/* Expandable Content */}
              <div
                id={`unit-content-${unit.id}`}
                ref={(el: HTMLDivElement | null) => {
                  if (contentRefs.current) {
                    contentRefs.current[unit.id] = el;
                  }
                }}
                style={{
                  maxHeight: maxHeights[unit.id] || '0px',
                  transition: 'max-height 0.3s ease'
                }}
                className="overflow-hidden"
                aria-labelledby={`unit-header-${unit.id}`}
              >
                <div className="px-4 pb-8 pt-4">
                  {/* Tracking Steps */}
                  <div className="space-y-6" role="list" aria-label="Delivery progress steps">
                    {unit.steps.map((step, stepIndex) => {
                      const stepIndicatorClasses = getStepIndicatorClasses(step.status);
                      const stepTextClasses = getStepTextClasses(step.status);
                      const timestampClasses = getTimestampClasses(step.timestamp, step.status);
                      const showActionButton = shouldShowActionButton(
                        !!step.action,
                        step.action?.label || '',
                        unitIndex,
                        !!step.action?.trackingUrl
                      );
                      const showSecondaryAction = shouldShowSecondaryAction(
                        !!step.secondaryAction,
                        unitIndex
                      );

                      return (
                        <div 
                          key={stepIndex} 
                          className="flex items-start gap-4"
                          role="listitem"
                        >
                          {/* Step Indicator */}
                          <div 
                            className={cn(
                              'w-3 h-3 rounded-full mt-1.5',
                              stepIndicatorClasses
                            )}
                            aria-hidden="true"
                          />
                          
                          <div className="flex-1">
                            {/* Step Title */}
                            <h3 className={cn('text-sm font-medium', stepTextClasses)}>
                              {step.title}
                            </h3>
                            
                            {/* Step Timestamp */}
                            <p className={cn('mt-1 text-xs', timestampClasses)}>
                              {formatTimestampDisplay(step.timestamp)}
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {/* Primary Action Button */}
                              {showActionButton && step.action && (
                                <button 
                                  onClick={() => {
                                    if (step.action?.trackingUrl) {
                                      handleTrackingClick(step.action.trackingUrl);
                                    } else if (step.action?.url) {
                                      handleTrackingClick(step.action.url);
                                    }
                                  }}
                                  disabled={step.status === 'pending'}
                                  className={getActionButtonClasses(
                                    step.status, 
                                    step.action.iconName === 'ClockIcon'
                                  )}
                                  aria-label={`${step.action.label} for ${step.title}`}
                                >
                                  {/* Action Icon */}
                                  {step.action.iconName && (
                                    React.createElement(iconMap[step.action.iconName], { 
                                      className: cn(
                                        'w-5 h-5',
                                        step.status === 'complete' ? 'text-text-primary' : ''
                                      ),
                                      'aria-hidden': true
                                    })
                                  )}
                                  
                                  {/* Action Content - Timer or Label */}
                                  {step.action.timerData ? (
                                    <ElapsedTimer 
                                      startTime={step.action.timerData.startTime}
                                      endTime={step.action.timerData.endTime}
                                      aria-label="Elapsed delivery time"
                                    />
                                  ) : (
                                    <span>{step.action.label}</span>
                                  )}
                                </button>
                              )}
                              
                              {/* Secondary Action Button */}
                              {showSecondaryAction && step.secondaryAction && (
                                <button
                                  onClick={() => {
                                    if (step.secondaryAction?.url) {
                                      handleTrackingClick(step.secondaryAction.url);
                                    }
                                  }}
                                  disabled={step.status === 'pending'}
                                  className={getSecondaryActionButtonClasses(step.status)}
                                  aria-label={`${step.secondaryAction.label} for ${step.title}`}
                                >
                                  {/* Secondary Action Icon */}
                                  {step.secondaryAction.iconName && (
                                    React.createElement(iconMap[step.secondaryAction.iconName], { 
                                      className: "w-5 h-5",
                                      'aria-hidden': true
                                    })
                                  )}
                                  {step.secondaryAction.label}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default AppointmentTracking;
