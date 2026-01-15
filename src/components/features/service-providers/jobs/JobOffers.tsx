/**
 * @fileoverview Displays pending job offers for Boombox Delivery Drivers
 * Shows appointment offers and packing supply route offers with accept/decline buttons.
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays offer cards in horizontal scrollable layout with chevron navigation
 * - Provides Accept/Decline buttons that call existing assignment APIs
 * - Returns null when no pending offers (no empty state rendered)
 * - Real-time countdown timer for offer expiration
 * 
 * API ROUTES USED:
 * - POST /api/onfleet/driver-assign - Accept/decline appointment offers
 * - POST /api/onfleet/packing-supplies/driver-response - Accept/decline route offers
 * 
 * DESIGN SYSTEM:
 * - Card-based layout with semantic surface colors
 * - Status badges for offer types
 * - Button primitives for accept/decline actions
 * - Countdown timer with amber/warning colors
 * - Horizontal scroll with chevron navigation (like HowItWorksSection)
 * 
 * ACCESSIBILITY:
 * - ARIA labels for all interactive elements
 * - role="alert" for error messages
 * - Proper button states with aria-disabled
 * - Keyboard navigation support for scroll container
 * 
 * @refactor Data fetching moved to parent page via useJobsPageData hook.
 * Component now accepts offers as props for coordinated page-level loading.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { format, subHours } from 'date-fns';
import { Button } from '@/components/ui/primitives/Button';
import type { PendingOffer, AcceptOfferResult } from '@/hooks/useJobsPageData';

// Re-export type for convenience
export type { PendingOffer, AcceptOfferResult };

interface JobOffersProps {
  /** Driver ID for API calls (accept/decline) */
  driverId: string;
  /** Pending offers to display */
  offers: PendingOffer[];
  /** Callback to update offers after accept/decline (for optimistic updates) */
  onOffersChange: (offers: PendingOffer[]) => void;
  /** 
   * Callback for accepting offers with optimistic updates.
   * Handles adding accepted job to upcoming jobs and rollback on failure.
   */
  onAcceptOffer: (
    offer: PendingOffer,
    apiCall: () => Promise<Response>
  ) => Promise<AcceptOfferResult>;
}

/**
 * Parse address into street and city/state/zip components
 */
function parseAddress(fullAddress: string): { street: string; cityStateZip: string } {
  const parts = fullAddress.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    return {
      street: parts[0],
      cityStateZip: parts.slice(1).join(', '),
    };
  } else if (parts.length === 2) {
    return {
      street: parts[0],
      cityStateZip: parts[1],
    };
  }
  return {
    street: fullAddress,
    cityStateZip: '',
  };
}

/**
 * Extract numeric pay value from pay estimate string (e.g., "$75-$85" -> "$97")
 */
function formatPayDisplay(payEstimate: string): string {
  // If it's already a clean format like "$97", return as-is
  if (/^\$\d+$/.test(payEstimate)) {
    return payEstimate;
  }
  // If it's a range like "$75-$85", take the midpoint or just show the value
  const match = payEstimate.match(/\$(\d+)/);
  if (match) {
    return `$${match[1]}`;
  }
  return payEstimate;
}

export function JobOffers({ driverId, offers, onOffersChange, onAcceptOffer }: JobOffersProps) {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<{ id: string | number; action: 'accepted' | 'declined' } | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [itemWidth, setItemWidth] = useState(320 + 16); // Default card width + gap
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update item width dynamically for responsive scrolling
  useEffect(() => {
    const updateItemWidth = () => {
      if (scrollContainerRef.current) {
        const firstItem = scrollContainerRef.current.querySelector('[data-offer-card]');
        if (firstItem) {
          const width = firstItem.getBoundingClientRect().width;
          setItemWidth(width + 16); // width + gap (gap-4 = 16px)
        }
      }
    };

    updateItemWidth();
    window.addEventListener('resize', updateItemWidth);

    const resizeObserver = new ResizeObserver(updateItemWidth);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateItemWidth);
      resizeObserver.disconnect();
    };
  }, [offers]);

  // Scroll to next/previous item
  const scrollToItem = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const offset = direction === 'left' ? -itemWidth : itemWidth;

      const nearestIndex = Math.round(scrollLeft / itemWidth);
      const newScrollPosition = nearestIndex * itemWidth + offset;

      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollLeft = () => scrollToItem('left');
  const handleScrollRight = () => scrollToItem('right');

  // Update countdown timers every second
  useEffect(() => {
    const updateCountdowns = () => {
      const now = Date.now();
      const newCountdowns: Record<string, string> = {};

      offers.forEach((offer) => {
        const offerId = offer.type === 'appointment' ? `appt-${offer.id}` : `route-${offer.id}`;
        const expiresAt = new Date(offer.expiresAt).getTime();
        const remaining = expiresAt - now;

        if (remaining <= 0) {
          newCountdowns[offerId] = 'Expired';
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

          if (hours > 0) {
            newCountdowns[offerId] = `Expires ${hours}h ${minutes}m`;
          } else {
            newCountdowns[offerId] = `Expires ${minutes}m`;
          }
        }
      });

      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [offers]);

  // Handle accept action - uses onAcceptOffer for optimistic updates
  const handleAccept = async (offer: PendingOffer) => {
    const offerId = offer.type === 'appointment' ? `appt-${offer.id}` : `route-${offer.id}`;
    setActionInProgress(`accept-${offerId}`);
    setActionError(null);
    setActionSuccess(null);

    // Create the API call function
    const apiCall = async (): Promise<Response> => {
      if (offer.type === 'appointment') {
        return fetch('/api/onfleet/driver-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: offer.appointmentId,
            driverId: parseInt(driverId),
            onfleetTaskId: offer.onfleetTaskId,
            action: 'accept',
          }),
        });
      } else {
        return fetch('/api/onfleet/packing-supplies/driver-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: offer.token,
            action: 'accept',
          }),
        });
      }
    };

    // Use the optimistic accept function from parent
    const result = await onAcceptOffer(offer, apiCall);

    if (result.success) {
      setActionSuccess({ id: offer.id, action: 'accepted' });
      // Clear success message after a delay
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      console.error('Error accepting offer:', result.error);
      setActionError(result.error || 'Failed to accept offer');
    }

    setActionInProgress(null);
  };

  // Handle decline action
  const handleDecline = async (offer: PendingOffer) => {
    const offerId = offer.type === 'appointment' ? `appt-${offer.id}` : `route-${offer.id}`;
    setActionInProgress(`decline-${offerId}`);
    setActionError(null);
    setActionSuccess(null);

    try {
      let response: Response;

      if (offer.type === 'appointment') {
        response = await fetch('/api/onfleet/driver-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: offer.appointmentId,
            driverId: parseInt(driverId),
            onfleetTaskId: offer.onfleetTaskId,
            action: 'decline',
          }),
        });
      } else {
        response = await fetch('/api/onfleet/packing-supplies/driver-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: offer.token,
            action: 'decline',
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline offer');
      }

      setActionSuccess({ id: offer.id, action: 'declined' });
      
      // Remove the offer from the list via parent callback
      onOffersChange(offers.filter((o) => o.id !== offer.id));
      
      // Clear success message after a delay
      setTimeout(() => setActionSuccess(null), 3000);

    } catch (err: any) {
      console.error('Error declining offer:', err);
      setActionError(err.message || 'Failed to decline offer');
    } finally {
      setActionInProgress(null);
    }
  };

  // Don't render the section if no offers
  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="mb-12" aria-labelledby="job-offers-heading">
      {/* Header with navigation buttons */}
      <div className="max-w-5xl lg:px-16 px-6 mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 id="job-offers-heading" className="text-2xl">
          Job Offers
        </h2>
        {offers.length > 1 && (
          <div className="flex mt-4 sm:mt-0 gap-1" role="group" aria-label="Scroll navigation">
            <button
              onClick={handleScrollLeft}
              className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2"
              aria-label="Scroll left to previous offer"
              type="button"
            >
              <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={handleScrollRight}
              className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2"
              aria-label="Scroll right to next offer"
              type="button"
            >
              <ArrowRightIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Success message */}
      {actionSuccess && (
        <div className="max-w-5xl lg:px-16 px-6 mx-auto">
          <div
            className={`mb-4 p-3 rounded-md ${
              actionSuccess.action === 'accepted'
                ? 'bg-status-success/10 border border-status-success'
                : 'bg-surface-tertiary border border-border'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className={`text-sm ${
              actionSuccess.action === 'accepted' ? 'text-status-success' : 'text-text-secondary'
            }`}>
              {actionSuccess.action === 'accepted'
                ? 'Job confirmed! Check Upcoming Jobs for details.'
                : 'Job declined. We\'ll offer it to other drivers.'}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {actionError && (
        <div className="max-w-5xl lg:px-16 px-6 mx-auto">
          <div
            className="mb-4 p-3 bg-status-error/10 border border-status-error rounded-md"
            role="alert"
          >
            <p className="text-sm text-status-error">{actionError}</p>
          </div>
        </div>
      )}

      {/* Scrollable container */}
      <div className="max-w-5xl lg:px-16 px-6 mx-auto">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide py-2"
          tabIndex={0}
          aria-label="Job offers - use arrow keys or scroll to navigate"
        >
          <div className="flex gap-4 flex-nowrap">
          {offers.map((offer) => {
            const offerId = offer.type === 'appointment' ? `appt-${offer.id}` : `route-${offer.id}`;
            const isAccepting = actionInProgress === `accept-${offerId}`;
            const isDeclining = actionInProgress === `decline-${offerId}`;
            const isActionInProgress = isAccepting || isDeclining;
            const countdown = countdowns[offerId] || 'Calculating...';
            const isExpired = countdown === 'Expired';

            if (offer.type === 'appointment') {
              const appointmentTime = new Date(offer.time);
              const displayTime = subHours(appointmentTime, 1);
              const { street, cityStateZip } = parseAddress(offer.address);
              const payDisplay = formatPayDisplay(offer.payEstimate);
              const isReconfirmation = offer.isReconfirmation || false;

              return (
                <div
                  key={offerId}
                  data-offer-card
                  className="rounded-md border p-6 w-80 sm:w-96 flex-none bg-white border-slate-100"
                >
                  {/* Header: Type badge and expiry timer */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      isReconfirmation 
                        ? 'bg-amber-100 text-amber-500' 
                        : 'bg-slate-100 text-text-primary'
                    }`}>
                      {isReconfirmation ? 'Time Change' : offer.appointmentType}
                    </span>
                    <span 
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        isExpired 
                          ? 'bg-status-error/10 text-status-error' 
                          : 'bg-amber-100 text-amber-500'
                      }`}
                    >
                      {countdown}
                    </span>
                  </div>

                  {/* Address and Pay */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-lg font-medium text-text-primary leading-tight mb-1">
                        {street}
                      </h3>
                      {cityStateZip && (
                        <p className="text-text-tertiary text-sm">
                          {cityStateZip}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-text-primary flex-shrink-0">
                      {payDisplay}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border mb-2" />


                  {/* Date and Time */}
                  <p className="text-text-tertiary text-lg mb-4">
                    {format(new Date(offer.date), 'EEE, MMM d')} • {format(displayTime, 'h:mmaaa')}
                  </p>

              
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDecline(offer)}
                      disabled={isActionInProgress || isExpired}
                      loading={isDeclining}
                      aria-label={isReconfirmation ? "Decline this job - you will be unassigned" : "Decline this job offer"}
                      className="flex-1"
                    >
                      {isDeclining ? 'Declining...' : 'Decline'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAccept(offer)}
                      disabled={isActionInProgress || isExpired}
                      loading={isAccepting}
                      aria-label={isReconfirmation ? "Confirm you can work this job" : "Accept this job offer"}
                      className="flex-1"
                    >
                      {isAccepting 
                        ? (isReconfirmation ? 'Confirming...' : 'Accepting...') 
                        : (isReconfirmation ? 'Reconfirm' : 'Accept')}
                    </Button>
                  </div>
                </div>
              );
            } else {
              // Packing Supply Route offer
              const { street, cityStateZip } = parseAddress(offer.firstStopAddress);
              const payDisplay = formatPayDisplay(offer.estimatedPayout);

              return (
                <div
                  key={offerId}
                  data-offer-card
                  className="rounded-md bg-white border border-slate-100 p-6 w-80 sm:w-96 flex-none"
                >
                  {/* Header: Type badge and expiry timer */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-slate-100 text-text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                      Delivery Route
                    </span>
                    <span 
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        isExpired 
                          ? 'bg-status-error/10 text-status-error' 
                          : 'bg-amber-100 text-amber-500'
                      }`}
                    >
                      {countdown}
                    </span>
                  </div>

                  {/* Route summary and Pay */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-lg text-text-primary leading-tight mb-1">
                        {offer.totalStops} Stop Route
                      </h3>
                      <p className="text-text-primary text-sm">
                        Starting: {street}{cityStateZip ? `, ${cityStateZip}` : ''}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-text-primary flex-shrink-0">
                      {payDisplay}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border mb-2" />

                  {/* Date and metrics */}
                  <p className="text-text-primary text-lg mb-4">
                    {format(new Date(offer.deliveryDate), 'EEE, MMM d')} • ~{offer.estimatedMiles} mi • {offer.estimatedDuration}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDecline(offer)}
                      disabled={isActionInProgress || isExpired}
                      loading={isDeclining}
                      aria-label="Decline this route offer"
                      className="flex-1"
                    >
                      {isDeclining ? 'Declining...' : 'Decline'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAccept(offer)}
                      disabled={isActionInProgress || isExpired}
                      loading={isAccepting}
                      aria-label="Accept this route offer"
                      className="flex-1"
                    >
                      {isAccepting ? 'Accepting...' : 'Accept'}
                    </Button>
                  </div>
                </div>
              );
            }
          })}
            {/* Spacer for better scroll ending */}
            <div className="bg-transparent w-4 flex-none" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
