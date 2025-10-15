/**
 * @fileoverview Job History Popup modal displaying detailed job information for service providers
 * @source boombox-10.0/src/app/components/mover-account/job-history-popup.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays comprehensive job history details including appointment info, feedback, and payouts
 * - Supports both regular appointments and packing supply delivery routes
 * - Shows customer feedback with star ratings and comments
 * - Displays service duration, pricing, and tip information
 * - Shows route details for packing supply deliveries (stops, distance, duration)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (text-zinc-950, text-zinc-500, bg-slate-100) with semantic tokens
 * - Used design system colors: text-text-primary, text-text-secondary, bg-surface-tertiary
 * - Applied consistent hover and active states using design system colors
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Moved formatCurrency to @/lib/utils/currencyUtils
 * - Moved calculateServiceDuration to @/lib/utils/dateUtils
 * 
 * @refactor Replaced createPortal with Modal primitive component, applied design system colors,
 * extracted utility functions to centralized locations, improved accessibility with proper ARIA labels
 */

'use client';

import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/primitives/Modal';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { calculateServiceDuration } from '@/lib/utils/dateUtils';

interface RequestedStorageUnit {
  unitType: string;
  quantity: number;
}

interface JobHistoryDetails {
  id: number;
  address: string;
  date: string;
  time: string;
  appointmentType: string;
  numberOfUnits: number;
  planType: string;
  insuranceCoverage?: string;
  loadingHelpPrice?: number;
  requestedStorageUnits?: RequestedStorageUnit[];
  serviceStartTime?: string; // Unix timestamp in milliseconds
  serviceEndTime?: string; // Unix timestamp in milliseconds
  user?: {
    firstName: string;
    lastName: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    tipAmount: number;
  };
  // Packing supply route specific fields
  routeId?: string;
  routeStatus?: string;
  totalStops?: number;
  completedStops?: number;
  estimatedMiles?: number;
  estimatedDurationMinutes?: number;
  estimatedPayout?: number;
  payoutStatus?: string;
  orders?: any[];
  routeMetrics?: {
    totalDistance?: number;
    totalTime?: number;
    startTime?: Date;
    endTime?: Date;
  };
}

interface JobHistoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobHistoryDetails | null;
}

const JobHistoryPopup: React.FC<JobHistoryPopupProps> = ({
  isOpen,
  onClose,
  job
}) => {
  if (!job) return null;

  const isPackingSupplyRoute = job.appointmentType === 'Packing Supply Delivery' && job.routeId;

  // Calculate start and end times (1 hour before appointment time, 3 hours after start)
  let startTime: Date;
  try {
    startTime = new Date(job.date);
    if (isNaN(startTime.getTime())) {
      startTime = new Date(); // Fallback to current time if invalid date
    }
  } catch (error) {
    startTime = new Date(); // Fallback to current time if error
  }

  const endTime = new Date(startTime.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours in milliseconds

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={true}
      closeOnOverlayClick={true}
    >
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            {isPackingSupplyRoute ? `Route ${job.routeId}` : job.address}
          </h2>
          <p className="text-text-secondary">
            {isPackingSupplyRoute ? (
              format(startTime, "MMMM do, yyyy 'delivery route'")
            ) : (
              `${format(startTime, "MMMM do, yyyy")} ${format(startTime, "h:mmaaa")} - ${format(endTime, "h:mmaaa")}`
            )}
          </p>
          {isPackingSupplyRoute && (
            <p className="text-sm text-text-tertiary mt-1">
              {job.totalStops} stops • {job.completedStops || 0} completed
            </p>
          )}
        </div>

        {/* Feedback Section */}
        {!isPackingSupplyRoute && job.feedback && (
          <div className="mb-6 p-6 bg-surface-tertiary rounded-lg">
            <div 
              className="flex items-center mb-4"
              role="img"
              aria-label={`${job.feedback.rating} out of 5 stars`}
            >
              {[...Array(5)].map((_, index) => (
                <StarIcon
                  key={index}
                  className={`h-5 w-5 ${
                    index < job.feedback!.rating ? 'text-text-primary' : 'text-border'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            {job.feedback.comment && (
              <p className="text-text-primary mb-2">{job.feedback.comment}</p>
            )}
            <div>
              <p className="text-text-primary text-right">
                - {job.user?.firstName} {job.user?.lastName}
              </p>
              <p className="text-text-secondary text-xs text-right">
                customer
              </p>
            </div>
          </div>
        )}

        {/* Route Status Section for Packing Supply Routes */}
        {isPackingSupplyRoute && (
          <div className="mb-6 p-6 bg-surface-tertiary rounded-lg">
            <h3 className="font-medium text-text-primary mb-3 text-lg">Route Status</h3>
            <div className="space-y-2">
              <p className="text-text-primary">
                <span className="font-medium">Progress:</span> {job.completedStops || 0} of {job.totalStops} stops completed
              </p>
              <p className="text-text-primary">
                <span className="font-medium">Status:</span> {job.routeStatus?.replace('_', ' ')}
              </p>
              {job.payoutStatus && (
                <p className="text-text-primary">
                  <span className="font-medium">Payout:</span> {job.payoutStatus.replace('_', ' ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Job Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
          {isPackingSupplyRoute ? (
            // Packing Supply Route Details
            <>
              <div className="border-r border-border pr-4">
                <h3 className="font-medium text-text-primary font-semibold mb-2 text-lg">Route Details</h3>
                <div className="space-y-2">
                  <p className="text-text-primary">{job.appointmentType}</p>
                  <p className="text-text-primary">{job.totalStops} Delivery Stops</p>
                  <p className="text-text-primary">Status: {job.routeStatus?.replace('_', ' ')}</p>
                  {job.estimatedMiles && (
                    <p className="text-text-primary">Distance: {job.estimatedMiles} miles</p>
                  )}
                  {job.estimatedDurationMinutes && (
                    <p className="text-text-primary">
                      Duration: {Math.floor(job.estimatedDurationMinutes / 60)}h {job.estimatedDurationMinutes % 60}m
                    </p>
                  )}
                </div>
                
                {/* Route Orders */}
                {job.orders && job.orders.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Delivery Stops</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {job.orders.slice(0, 5).map((order: any, index: number) => (
                        <p key={index} className="text-sm text-text-primary">
                          {order.routeStopNumber}. {order.contactName} - {order.deliveryAddress}
                        </p>
                      ))}
                      {job.orders.length > 5 && (
                        <p className="text-sm text-text-tertiary">
                          +{job.orders.length - 5} more stops...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-text-primary font-semibold mb-2 text-lg">Payout Details</h3>
                <div className="space-y-2">
                  {job.driver && (
                    <p className="text-text-primary">
                      <span>Driver: </span> {job.driver.firstName} {job.driver.lastName}
                    </p>
                  )}
                  {job.estimatedPayout && (
                    <p className="text-text-primary">
                      <span>Total Payout: </span>{formatCurrency(job.estimatedPayout)}
                    </p>
                  )}
                  {job.payoutStatus && (
                    <p className="text-text-primary">
                      <span>Payout Status: </span>{job.payoutStatus.replace('_', ' ')}
                    </p>
                  )}
                  {job.routeMetrics?.startTime && job.routeMetrics?.endTime && (
                    <p className="text-text-primary">
                      <span>Route Time: </span>
                      {new Date(job.routeMetrics.startTime).toLocaleTimeString()} - {new Date(job.routeMetrics.endTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Regular Appointment Details
            <>
              <div className="border-r border-border pr-4">
                <h3 className="font-medium text-text-primary font-semibold mb-2 text-lg">Order Details</h3>
                <div className="space-y-2">
                  <p className="text-text-primary">{job.appointmentType}</p>
                  <p className="text-text-primary">{job.numberOfUnits} Boombox</p>
                  <p className="text-text-primary">{job.planType}</p>
                  {job.insuranceCoverage && (
                    <p className="text-text-primary">{job.insuranceCoverage}</p>
                  )}
                </div>
                {/* Requested Units */}
                {job.requestedStorageUnits && job.requestedStorageUnits.length > 0 && (
                  <div className="pb-4 mb-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2 text-lg">Requested Units</h4>
                    <div className="space-y-1">
                      {job.requestedStorageUnits.map((unit, index) => (
                        <p key={index} className="text-text-primary">
                          {unit.quantity}x {unit.unitType}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-text-primary font-semibold mb-2 text-lg">Job Details</h3>
                <div className="space-y-2">
                  {job.driver && (
                    <p className="text-text-primary">
                      <span>Driver : </span> {job.driver.firstName} {job.driver.lastName}
                    </p>
                  )}
                  {job.loadingHelpPrice !== undefined && job.loadingHelpPrice > 0 && (
                    <p className="text-text-primary"><span>Hourly Rate : </span> {formatCurrency(job.loadingHelpPrice)}/hr</p>
                  )}
                  {/* Service Time */}
                  {job.serviceStartTime && job.serviceEndTime && (
                    <p className="text-text-primary">
                      <span>Service Time : </span>{calculateServiceDuration(job.serviceStartTime, job.serviceEndTime)}
                    </p>
                  )}
                  {/* Tip Amount */}
                  {job.feedback?.tipAmount !== undefined && (
                    <p className="text-text-primary"><span>Tip Amount : </span>{formatCurrency(job.feedback.tipAmount)}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export { JobHistoryPopup };

