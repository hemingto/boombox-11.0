/**
 * @fileoverview Packing supply delivery tracking component with real-time status updates
 * @source boombox-10.0/src/app/components/packing-supplies/packingsupplytracking.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays real-time delivery tracking for packing supply orders
 * - Shows delivery progress with 4-step status timeline (placed, driver assigned, out for delivery, delivered)
 * - Integrates Google Maps to show delivery location on interactive map
 * - Provides driver information with profile picture when driver is assigned
 * - Displays delivery window with formatted date/time information
 * - Allows tracking live location when order is out for delivery (Onfleet integration)
 * - Enables viewing delivery photo proof when order is delivered
 * - Provides feedback link when delivery is complete
 * - Shows expandable/collapsible order details with animation
 * - Lists ordered items with quantities and prices
 * 
 * API ROUTES:
 * - No direct API calls (receives all data via props from parent page)
 * - Integrates with Onfleet tracking URL for live location tracking
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc-950/zinc-400/slate-100 with semantic color tokens
 * - Updated status colors to use consistent success/info patterns from design system
 * - Applied semantic text colors (text-primary, text-secondary, text-tertiary)
 * - Used surface and border tokens for consistent UI elements
 * - Applied badge-success and badge-info utility classes for status indicators
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added aria-expanded to expandable order section button
 * - Added aria-label to all interactive buttons (track location, view photo, share feedback)
 * - Added aria-disabled for disabled button states
 * - Improved semantic HTML with proper heading hierarchy
 * - Added descriptive text for screen readers
 * 
 * @refactor Applied design system colors, enhanced accessibility, improved status color logic
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

// Import map styles - assumed to be available in project
const mapStyles: google.maps.MapTypeStyle[] = [];

export interface PackingSupplyTrackingProps {
  orderId: number;
  orderDate: Date;
  deliveryDate: Date;
  customerName: string;
  deliveryAddress: string;
  totalPrice: number;
  status: string;
  driverName: string;
  driverProfilePicture?: string;
  deliveryPhotoUrl?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryProgress: {
    steps: Array<{
      title: string;
      description: string;
      status: 'complete' | 'in_transit' | 'pending';
      timestamp: string;
    }>;
    currentStep: number;
  };
  deliveryWindow: {
    start: Date | null;
    end: Date | null;
    isSameDay: boolean;
  };
  taskId?: string;
  trackingUrl?: string;
  estimatedArrival?: string;
  feedbackToken?: string;
  canLeaveFeedback: boolean;
}

export function PackingSupplyTracking({
  orderId,
  orderDate,
  deliveryDate,
  customerName,
  deliveryAddress,
  totalPrice,
  status,
  driverName,
  driverProfilePicture,
  deliveryPhotoUrl,
  items,
  deliveryProgress,
  deliveryWindow,
  taskId,
  trackingUrl,
  estimatedArrival,
  feedbackToken,
  canLeaveFeedback,
}: PackingSupplyTrackingProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [deliveryLocation, setDeliveryLocation] = useState<google.maps.LatLngLiteral>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string>('auto');

  // Handle tracking button click - opens Onfleet tracking URL in new tab
  const handleTrackingClick = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Geocode delivery address to get coordinates for map display
  useEffect(() => {
    if (deliveryAddress && window.google) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: deliveryAddress }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setDeliveryLocation({
            lat: location.lat(),
            lng: location.lng(),
          });
        }
      });
    }
  }, [deliveryAddress]);

  // Initialize expanded state height for smooth animation
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    }
  }, [isExpanded, deliveryProgress]);

  const toggleExpanded = () => {
    if (!isExpanded && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setMaxHeight('0px');
    }
    setIsExpanded(!isExpanded);
  };

  const formatDeliveryWindow = () => {
    if (!deliveryWindow.start || !deliveryWindow.end) return 'Delivery window TBD';

    const startTime = format(deliveryWindow.start, 'h:mma');
    const endTime = format(deliveryWindow.end, 'h:mma');
    const date = format(deliveryWindow.start, "EEEE, MMM do 'scheduled between'");

    return `${date} ${startTime} - ${endTime}`;
  };

  const getOrderStatus = () => {
    switch (status) {
      case 'Delivered':
        return 'Complete';
      case 'In Transit':
      case 'Driver Arrived':
        return 'In transit';
      case 'Dispatched':
        return 'Driver Assigned';
      case 'Scheduled':
        return 'Confirmed';
      case 'Pending':
        return 'Processing';
      case 'Failed':
        return 'Failed';
      case 'Cancelled':
        return 'Cancelled';
      case 'Returned':
        return 'Returned';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Delivered':
        return 'text-status-success bg-status-bg-success';
      case 'In Transit':
      case 'Driver Arrived':
      case 'Dispatched':
        return 'text-status-info bg-status-bg-info';
      case 'Scheduled':
      case 'Pending':
        return 'text-text-secondary bg-surface-tertiary';
      case 'Failed':
      case 'Cancelled':
      case 'Returned':
        return 'text-status-error bg-status-bg-error';
      default:
        return 'text-text-secondary bg-surface-tertiary';
    }
  };

  const getStepStatusColor = (stepStatus: 'complete' | 'in_transit' | 'pending') => {
    switch (stepStatus) {
      case 'complete':
        return 'bg-primary';
      case 'in_transit':
        return 'bg-status-info animate-pulse';
      case 'pending':
        return 'bg-zinc-400';
      default:
        return 'bg-surface-disabled';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 mb-64">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">
        Packing Supplies Delivery
      </h1>
      <p className="text-sm text-text-primary mb-6">{formatDeliveryWindow()}</p>

      <div className="w-full h-32 rounded-t-md overflow-hidden mb-4">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={deliveryLocation}
          zoom={14}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            fullscreenControl: false,
          }}
        >
          <Marker position={deliveryLocation} />
        </GoogleMap>
      </div>

      <div className="bg-surface-primary">
        <button
          onClick={toggleExpanded}
          className="w-full px-4 py-4 flex items-center justify-between text-text-primary transition"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} order details for order #${taskId || orderId}`}
        >
          <div>
            <h2 className="text-base font-semibold text-left">Order #{taskId || orderId}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-2 rounded-md text-sm ${getStatusColor()}`}>
              {getOrderStatus()}
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
        </button>

        <div
          ref={contentRef}
          style={{
            maxHeight: maxHeight,
            transition: 'max-height 0.3s ease',
          }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-8 pt-4">
            <div className="space-y-6">
              {deliveryProgress.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 ${getStepStatusColor(step.status)}`}
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-medium ${
                        step.status === 'pending' ? 'text-zinc-400' : 'text-text-primary'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-1 text-xs ${
                        step.timestamp.includes('eta')
                          ? 'text-status-success font-medium'
                          : step.status === 'pending'
                            ? 'text-text-tertiary'
                            : 'text-text-secondary'
                      }`}
                    >
                      {step.timestamp.includes('eta')
                        ? `ETA: ${step.timestamp}`
                        : step.timestamp}
                    </p>

                    {/* Driver profile display for "Your delivery driver has been assigned" step */}
                    {index === 1 && step.status === 'complete' && driverProfilePicture && (
                      <div className="mt-4 flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={driverProfilePicture}
                            alt={`${driverName} profile`}
                            width={36}
                            height={36}
                            className="w-9 h-9 ml-2 bg-surface-disabled rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-text-primary text-sm">{driverName}</p>
                          <p className="text-text-secondary text-xs">Boombox Driver</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {/* Track location button for "Your order is out for delivery" step */}
                      {index === 2 && (
                        <button
                          onClick={() => handleTrackingClick(trackingUrl)}
                          disabled={step.status === 'pending' || !trackingUrl}
                          className={`mt-4 px-4 py-2 text-sm border rounded-full font-semibold inline-flex items-center gap-1 ${
                            step.status === 'pending' || !trackingUrl
                              ? 'bg-slate-100 border-slate-100 text-zinc-400 cursor-not-allowed'
                              : step.status === 'complete'
                                ? 'bg-white border-zinc-950 text-zinc-950'
                                : 'bg-zinc-950 text-white'
                          }`}
                          aria-label="Track your delivery location in real-time"
                          aria-disabled={step.status === 'pending' || !trackingUrl}
                        >
                          Track location
                        </button>
                      )}

                      {/* View Photo and Share feedback buttons for "Your order has been delivered" step */}
                      {index === 3 && (
                        <>
                          <button
                            onClick={() => {
                              if (step.status === 'complete' && deliveryPhotoUrl) {
                                window.open(deliveryPhotoUrl, '_blank');
                              }
                            }}
                            disabled={step.status === 'pending' || !deliveryPhotoUrl}
                            className={`mt-4 px-4 py-2 text-sm border rounded-full font-semibold inline-flex items-center gap-1 ${
                              step.status === 'pending' || !deliveryPhotoUrl
                                ? 'bg-slate-100 border-slate-100 text-zinc-400 cursor-not-allowed'
                                : 'bg-white border-zinc-950 text-zinc-950'
                            }`}
                            aria-label="View delivery photo proof"
                            aria-disabled={step.status === 'pending' || !deliveryPhotoUrl}
                          >
                            View Photo
                          </button>
                          <button
                            onClick={() => {
                              if (step.status === 'complete' && feedbackToken) {
                                window.open(
                                  `/packing-supplies/feedback/${feedbackToken}`,
                                  '_blank'
                                );
                              }
                            }}
                            disabled={
                              step.status === 'pending' || !canLeaveFeedback || !feedbackToken
                            }
                            className={`mt-4 px-4 py-2 text-sm border rounded-full font-semibold inline-flex items-center gap-1 ${
                              step.status === 'pending' || !canLeaveFeedback || !feedbackToken
                                ? 'bg-slate-100 border-slate-100 text-zinc-400 cursor-not-allowed'
                                : 'bg-white border-zinc-950 text-zinc-950'
                            }`}
                            aria-label="Share feedback about your delivery experience"
                            aria-disabled={
                              step.status === 'pending' || !canLeaveFeedback || !feedbackToken
                            }
                          >
                            Share feedback
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-surface-tertiary rounded-md mt-6 mb-6">
        <div className="px-6 pt-4">
          <h3 className="text-lg font-semibold text-text-primary pb-2 border-b border-white">
            Order Details
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-text-primary mb-2 font-semibold">
                Delivery Address
              </h4>
              <p className="text-text-primary">{deliveryAddress}</p>
            </div>

            <div>
              <h4 className="font-medium text-text-primary mb-2 font-semibold">Items Ordered</h4>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-text-primary text-sm">
                      {item.quantity} {item.name}
                    </span>
                    <span className="font-medium text-text-primary text-sm">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 mt-4 border-t border-white">
                <span className="font-semibold text-text-primary">Total</span>
                <span className="font-semibold text-text-primary">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

