"use client";

/**
 * @fileoverview Unified MyQuote component for order pricing display with responsive design
 * @source boombox-10.0/src/app/components/getquote/myquote.tsx
 * @source boombox-10.0/src/app/components/getquote/mobilemyquote.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays order pricing details, map location, and appointment information in both desktop and mobile layouts.
 * Handles quote calculations, insurance pricing, storage unit costs, and loading help pricing.
 * Integrates with Google Maps for location display and SendQuoteEmail for quote sharing.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens
 * - Applied utility classes from globals.css
 * - Used design system spacing and typography patterns
 * 
 * @refactor Combined desktop and mobile versions into single responsive component with unified business logic
 */

import React, { useMemo } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Tooltip } from '@/components/ui/primitives/Tooltip/Tooltip';
import { Button } from '@/components/ui/primitives/Button/Button';
import { HelpIcon } from '@/components/icons';
import SendQuoteEmail from '@/components/forms/SendQuoteEmailModal';
import { InsuranceOption } from '@/types/insurance';
import { QuoteData } from '@/lib/services/quoteService';
import { mapStyles } from '@/app/mapstyles';
import { formatVerboseDate } from '@/lib/utils/dateUtils';
import { getBoomboxPriceByZipCode, formatStorageUnitPrice, formatInsurancePrice } from '@/lib/utils/pricingUtils';
import { useQuote } from '@/hooks/useQuote';
import { accessStorageUnitPricing } from '@/data/accessStorageUnitPricing';

interface MyQuoteProps {
  title?: string;
  showSendQuoteEmail?: boolean;
  address: string;
  scheduledDate: Date | null;
  scheduledTimeSlot: string | null;
  storageUnitCount?: number;
  storageUnitText?: string;
  selectedPlanName: string;
  loadingHelpPrice: string;
  loadingHelpDescription: string;
  selectedInsurance?: InsuranceOption | null;
  zipCode: string;
  handleSubmit: () => void;
  coordinates: google.maps.LatLngLiteral | null;
  currentStep: number;
  accessStorageUnitCount?: number;
  onCalculateTotal?: (total: number) => void;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  buttonTexts?: { [step: number]: string };
  setMonthlyStorageRate: (rate: number) => void;
  setMonthlyInsuranceRate: (rate: number) => void;
  isAccessStorage: boolean;
  
  // Edit mode specific props
  isEditMode?: boolean;
  appointmentId?: string;
  originalTotal?: number;
  showPriceComparison?: boolean;
  editModeTitle?: string;
  
  // Button state props
  isButtonDisabled?: boolean;
}

const containerStyle = {
  width: '100%',
  height: '128px',
  borderRadius: '0.375rem',
};

export function MyQuote({ 
  title = "My Quote",
  showSendQuoteEmail = true,
  address, 
  scheduledDate, 
  scheduledTimeSlot, 
  storageUnitCount, 
  storageUnitText, 
  selectedPlanName, 
  loadingHelpPrice, 
  loadingHelpDescription, 
  selectedInsurance,
  zipCode,
  handleSubmit,
  coordinates,
  currentStep,
  accessStorageUnitCount,
  onCalculateTotal,
  buttonTexts,
  monthlyStorageRate,
  monthlyInsuranceRate,
  setMonthlyStorageRate,
  setMonthlyInsuranceRate,
  isAccessStorage,
  
  // Edit mode props
  isEditMode = false,
  appointmentId,
  originalTotal,
  showPriceComparison = false,
  editModeTitle,
  
  // Button state props
  isButtonDisabled = false,
}: MyQuoteProps) {
  // Use custom hook for quote state management and calculations
  const {
    isExpanded,
    setIsExpanded,
    contentHeight,
    contentRef,
    mapCenter,
    mapZoom,
    pricing,
  } = useQuote({
    zipCode,
    storageUnitCount,
    selectedInsurance,
    loadingHelpPrice,
    accessStorageUnitCount,
    isAccessStorage,
    coordinates,
    onCalculateTotal,
    setMonthlyStorageRate,
    setMonthlyInsuranceRate,
  });

  // Get Boombox price for display
  const boomboxPrice = getBoomboxPriceByZipCode(zipCode);

  // Determine the display title based on edit mode
  const displayTitle = useMemo(() => {
    if (editModeTitle) return editModeTitle;
    if (isEditMode) {
      return `Edit ${title}`;
    }
    return title;
  }, [title, isEditMode, editModeTitle]);

  // Calculate price comparison for edit mode
  const priceComparison = useMemo(() => {
    if (!isEditMode || !originalTotal || !showPriceComparison) {
      return null;
    }

    const currentTotal = pricing.total;
    const difference = currentTotal - originalTotal;
    
    if (Math.abs(difference) < 0.01) {
      return { type: 'same', difference: 0, message: 'No price change' };
    } else if (difference > 0) {
      return { 
        type: 'increase', 
        difference, 
        message: `+$${difference.toFixed(2)} from original` 
      };
    } else {
      return { 
        type: 'decrease', 
        difference: Math.abs(difference), 
        message: `-$${Math.abs(difference).toFixed(2)} from original` 
      };
    }
  }, [isEditMode, originalTotal, showPriceComparison, pricing.total]);

  // Prepare quote data for email
  const quoteData: QuoteData = useMemo(() => ({
    address,
    scheduledDate,
    scheduledTimeSlot,
    storageUnitCount,
    storageUnitText,
    selectedPlanName,
    loadingHelpPrice,
    loadingHelpDescription,
    selectedInsurance: selectedInsurance ? {
      label: selectedInsurance.label,
      price: selectedInsurance.price || '' // Ensure price is always a string
    } : null,
    accessStorageUnitCount,
    totalPrice: pricing.total,
    isAccessStorage,
    zipCode,
  }), [
    address,
    scheduledDate,
    scheduledTimeSlot,
    storageUnitCount,
    storageUnitText,
    selectedPlanName,
    loadingHelpPrice,
    loadingHelpDescription,
    selectedInsurance,
    accessStorageUnitCount,
    pricing.total,
    isAccessStorage,
    zipCode,
  ]);

  return (
    <>
      {/* Desktop Layout */}
      <div className="p-6 hidden md:block bg-surface-primary rounded-md shadow-custom-shadow w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-semibold text-text-primary">{displayTitle}</h3>
            {isEditMode && appointmentId && (
              <p className="text-sm text-text-secondary mt-1">
                Appointment #{appointmentId}
              </p>
            )}
          </div>
          {showSendQuoteEmail && <SendQuoteEmail quoteData={quoteData} />}
        </div>
        <div className="pb-4 mb-4 border-b border-border">
          <div className="rounded-md mb-4">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter || { lat: 37.75, lng: -122.294465 }} 
              zoom={mapZoom}
              options={{
                styles: mapStyles,
                disableDefaultUI: false,
                fullscreenControl: false,
              }}
            >
              {mapCenter && <Marker position={mapCenter} />}
            </GoogleMap>
          </div>
          <p className="text-sm text-text-tertiary mb-1">Address</p>
          <p id="address-input" className="mb-4 text-text-primary">{address || '---'}</p>
          <p className="text-sm text-text-tertiary mb-1">Date and Time</p>
          <p id="date-time-input" className="text-text-primary">{formatVerboseDate(scheduledDate)} {scheduledTimeSlot ? `between ${scheduledTimeSlot}` : ''}</p>
        </div>
        <h3 className="text-xl font-semibold mb-4 text-text-primary">Price details</h3>
        <div className="pb-4 mb-4 border-b border-border">
          {storageUnitCount !== undefined && storageUnitText !== undefined && (
            <div className="flex justify-between mb-4">
              <p className="text-text-primary">{storageUnitCount} Boombox{storageUnitCount > 1 ? 'es' : ''}</p>
              <p className="text-text-primary">
                {boomboxPrice !== null ? (
                  <>
                    <span className="text-text-tertiary line-through text-xs mr-1">
                      {formatStorageUnitPrice(boomboxPrice, storageUnitCount).strikethroughPrice}
                    </span> 
                    {formatStorageUnitPrice(boomboxPrice, storageUnitCount).price}
                  </>
                ) : (
                  '---'
                )}
              </p>
            </div>
          )}
          {accessStorageUnitCount !== undefined && (
            <div className="flex justify-between mb-4">
              <p className="text-text-primary">{accessStorageUnitCount > 0 ? accessStorageUnitCount : ''} Storage Unit {accessStorageUnitCount > 1 ? 'Deliveries' : 'Delivery'} </p>
              <p className="text-text-primary">{accessStorageUnitCount > 0 ? `$${accessStorageUnitCount * accessStorageUnitPricing}` : '---'}</p>
            </div>
          )}
          <div className="flex justify-between mb-4">
            <p className="text-text-primary">{selectedPlanName || 'Loading Help'}</p>
            <p className="text-text-primary">
              <span className="text-text-tertiary text-xs mr-1">{loadingHelpDescription}</span> 
              {loadingHelpPrice || '--- '}
            </p>
          </div>
          {selectedInsurance && (
            <div className="flex justify-between mb-4">
              <p className="text-text-primary">{selectedInsurance.label}</p>
              <p className="text-text-primary">
                {selectedInsurance.price ? (
                  <span>
                    {formatInsurancePrice(selectedInsurance, storageUnitCount || 1)}
                  </span>
                ) : (
                  <span className="text-text-primary">---</span>
                )}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-between mb-2">
          <p className="text-text-tertiary mr-1">Due Today</p>
          <p className="text-text-tertiary mr-1">$0</p>
        </div>
        <div className="flex justify-between mb-8">
          <div className="flex items-center">
            <div>
              <div className="flex items-center">
                <p className="text-xl font-semibold mr-1 text-text-primary">Total</p>
                <Tooltip 
                  text={isEditMode 
                    ? "This is the updated total amount for your appointment changes." 
                    : "This is the total amount you will pay on the day of your initial appointment."
                  } 
                />
              </div>
              {priceComparison && (
                <p className={`text-sm mt-1 ${
                  priceComparison.type === 'increase' ? 'text-status-warning' :
                  priceComparison.type === 'decrease' ? 'text-status-success' :
                  'text-text-tertiary'
                }`}>
                  {priceComparison.message}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p id="total-price" className="text-xl font-semibold text-text-primary">
              {pricing.total > 0 ? `$${pricing.total}` : '---'}
            </p>
            {isEditMode && originalTotal && originalTotal !== pricing.total && (
              <p className="text-sm text-text-tertiary line-through">
                ${originalTotal.toFixed(2)}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={isButtonDisabled || (isAccessStorage && accessStorageUnitCount === 0)}
        >
          {buttonTexts?.[currentStep] || (currentStep === 2 ? "Add Moving Help" : currentStep === 3 ? "Confirm Appointment" : "Reserve Appointment")}
        </Button>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-primary text-text-inverse">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-8 ${isExpanded ? 'bg-primary-hover' : 'bg-primary'} text-text-inverse rounded-t-full flex items-center justify-center`}
          aria-label={isExpanded ? 'Collapse quote details' : 'Expand quote details'}
        >
          <svg
            className={`w-6 h-6 mt-1 text-text-inverse transition-transform ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className="transition-all bg-primary-hover duration-300 ease-in-out overflow-hidden"
          style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
        >
          <div ref={contentRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="pt-4 px-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-2xl font-semibold text-text-inverse">{displayTitle}</h3>
                  {isEditMode && appointmentId && (
                    <p className="text-sm text-text-tertiary mt-1">
                      Appointment #{appointmentId}
                    </p>
                  )}
                </div>
                {showSendQuoteEmail && <SendQuoteEmail quoteData={quoteData} iconClassName="text-text-inverse" />}
              </div>
              <div className="pb-4 mb-4 border-b border-border-inverse">
                <div className="rounded-md mb-4">
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter || { lat: 37.75, lng: -122.294465 }}
                    zoom={mapZoom}
                    options={{
                      styles: mapStyles,
                      disableDefaultUI: false, 
                      fullscreenControl: false, 
                    }}
                  >
                    {mapCenter && <Marker position={mapCenter} />}
                  </GoogleMap>
                </div>
                <p className="text-sm text-text-secondary mb-1">Address</p>
                <p className="mb-4 text-text-inverse">{address || '---'}</p>
                <p className="text-sm text-text-secondary mb-1">Date and Time</p>
                <p id="date-time-input" className="text-text-inverse">{formatVerboseDate(scheduledDate)} {scheduledTimeSlot ? `between ${scheduledTimeSlot}` : ''}</p>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text-inverse">Price details</h3>
              <div className="pb-4">
                {storageUnitCount !== undefined && storageUnitText !== undefined && (
                  <div className="flex justify-between mb-4">
                    <p className="text-text-inverse">{storageUnitCount} Boombox{storageUnitCount > 1 ? 'es' : ''}</p>
                    <p className="text-text-inverse">
                      {boomboxPrice !== null ? (
                        <>
                          <span className="text-text-secondary line-through text-xs mr-1">
                            {formatStorageUnitPrice(boomboxPrice, storageUnitCount).strikethroughPrice}
                          </span> 
                          {formatStorageUnitPrice(boomboxPrice, storageUnitCount).price}
                        </>
                      ) : (
                        '---'
                      )}
                    </p>
                  </div>
                )}
                {accessStorageUnitCount !== undefined && (
                  <div className="flex justify-between mb-4">
                    <p className="text-text-inverse">{accessStorageUnitCount > 0 ? accessStorageUnitCount : ''} Storage Unit {accessStorageUnitCount > 1 ? 'Deliveries' : 'Delivery'} </p>
                    <p className="text-text-inverse">{accessStorageUnitCount > 0 ? `$${accessStorageUnitCount * accessStorageUnitPricing}` : '---'}</p>
                  </div>
                )}
                <div className="flex justify-between mb-4">
                  <p className="text-text-inverse">{selectedPlanName || 'Loading Help'}</p>
                  <p className="text-text-inverse">
                    <span className="text-text-secondary text-xs mr-1">{loadingHelpDescription}</span> 
                    {loadingHelpPrice || '---'}
                  </p>
                </div>
                {selectedInsurance && (
                  <div className="text-text-inverse flex justify-between mb-4">
                    <p className="text-text-inverse">{selectedInsurance.label}</p>
                    <p className="text-text-inverse">
                      {selectedInsurance.price ? (
                        <span>
                          {formatInsurancePrice(selectedInsurance, storageUnitCount || 1)}
                        </span>
                      ) : (
                        <span className="text-text-inverse">---</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <p className="text-xl font-semibold mr-1 text-text-inverse">Total</p>
                <Tooltip 
                  text={isEditMode 
                    ? "This is the updated total amount for your appointment changes." 
                    : "This is the total amount you will pay on the day of your initial appointment."
                  } 
                  className="text-text-inverse" 
                />
              </div>
              <div>
                <p className="text-text-secondary mr-1">Due Today</p>
                {priceComparison && (
                  <p className={`text-sm ${
                    priceComparison.type === 'increase' ? 'text-status-warning' :
                    priceComparison.type === 'decrease' ? 'text-status-success' :
                    'text-text-secondary'
                  }`}>
                    {priceComparison.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-4 text-right">
                <p id="total-price" className="text-xl text-text-inverse font-semibold">
                  {pricing.total > 0 ? `$${pricing.total}` : '___'}
                </p>
                <div className="flex flex-col items-end">
                  <p className="text-text-secondary">$0</p>
                  {isEditMode && originalTotal && originalTotal !== pricing.total && (
                    <p className="text-sm text-text-secondary line-through">
                      ${originalTotal.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <button
                className="btn-secondary disabled:bg-surface-disabled disabled:cursor-not-allowed disabled:text-text-tertiary"
                onClick={handleSubmit}
                disabled={isButtonDisabled || (isAccessStorage && accessStorageUnitCount === 0)}
              >
                {(() => {
                  const text = buttonTexts?.[currentStep] || (currentStep === 2 ? "Add Help" : currentStep === 3 ? "Confirm" : "Reserve");
                  if (text === "Schedule Appointment") return "Schedule";
                  if (text === "Reserve Appointment") return "Reserve";
                  return text;
                })()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section (Desktop Only) */}
      <div className="hidden px-4 pt-6 md:flex items-center">
        <HelpIcon className="w-8 h-8 text-text-primary mr-4 shrink-0" />
        <div>
          <p className="text-xs text-text-primary">Need help? Send us an email at help@boomboxstorage.com if you have any questions</p>
        </div>
      </div>
    </>
  );
}
