/**
 * @fileoverview Add Storage Step 1 - Address, storage units, plan selection, and insurance
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstoragestep1.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - First step of add storage form handling address input, storage unit selection, plan choice, and insurance
 * - Integrates with AddressInput, StorageUnitCounter, RadioCards, and InsuranceInput form components
 * - Displays plan details accordion with LaborPlanDetails component
 * - Handles form validation and error display for all step 1 fields
 * 
 * API ROUTES UPDATED:
 * - No direct API routes (uses form components that handle their own API calls)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (text-red-500, border-slate-100) with semantic tokens (text-status-error, border-border)
 * - Applied design system form styling and error states
 * - Used semantic surface colors for consistent theming
 * 
 * @refactor Replaced prop drilling with form context integration, updated imports to use
 * refactored form components, applied design system colors and utility classes
 */

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

// Form components
import { 
  AddressInput, 
  StorageUnitCounter, 
  RadioCards, 
  InsuranceInput, 
  LaborPlanDetails 
} from '@/components/forms';

// Icons
import { MovingHelpIcon, FurnitureIcon } from '@/components/icons';

// Types
import { 
  AddStorageFormState, 
  AddStorageFormErrors, 
  AddressInfo 
} from '@/types/addStorage.types';
import { InsuranceOption } from '@/types/insurance';

interface AddStorageStep1Props {
  formState: AddStorageFormState;
  errors: AddStorageFormErrors;
  onAddressChange: (addressInfo: AddressInfo) => void;
  onStorageUnitChange: (count: number, text: string) => void;
  onPlanChange: (planId: string, planName: string, planType: string) => void;
  onInsuranceChange: (insurance: InsuranceOption | null) => void;
  onTogglePlanDetails: () => void;
  onClearError: (errorKey: keyof AddStorageFormErrors) => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

export default function AddStorageStep1({
  formState,
  errors,
  onAddressChange,
  onStorageUnitChange,
  onPlanChange,
  onInsuranceChange,
  onTogglePlanDetails,
  onClearError,
  contentRef,
}: AddStorageStep1Props) {

  // Handle plan details accordion animation
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = formState.isPlanDetailsVisible
        ? `${contentRef.current.scrollHeight}px`
        : '0px';
    }
  }, [formState.isPlanDetailsVisible, contentRef]);

  // Handle address change with error clearing
  const handleAddressChange = (
    address: string,
    zipCode: string,
    coordinates: google.maps.LatLngLiteral,
    cityName: string
  ) => {
    onAddressChange({ address, zipCode, coordinates, cityName });
  };

  // Handle plan selection with error clearing
  const handlePlanChange = (id: string, plan: string) => {
    onPlanChange(id, plan, plan);
    onClearError('planError');
  };

  // Handle insurance selection with error clearing
  const handleInsuranceChange = (option: InsuranceOption | null) => {
    onInsuranceChange(option);
    onClearError('insuranceError');
  };

  return (
    <div className="w-full basis-1/2">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        <header>
          <h1 
            className="text-4xl mb-12 text-text-primary"
            id="form-title"
          >
            Add storage unit
          </h1>
        </header>
        
        {/* Address Input Section */}
        <fieldset className="mb-8">
          <legend className="mb-4 text-text-primary">Where are we delivering your Boombox?</legend>
          <AddressInput 
            value={formState.addressInfo.address} 
            onAddressChange={handleAddressChange} 
            hasError={!!errors.addressError} 
            onClearError={() => onClearError('addressError')} 
          />
          {errors.addressError && (
            <div 
              className="flex items-center mb-4 -mt-4"
              role="alert"
              aria-live="polite"
            >
              <p className="ml-1 text-sm text-status-error">{errors.addressError}</p>
            </div>
          )}
        </fieldset>

        {/* Storage Unit Counter Section */}
        <fieldset className="mb-8">
          <legend className="sr-only">Select number of storage units</legend>
          <StorageUnitCounter 
            onCountChange={onStorageUnitChange} 
            initialCount={formState.storageUnit.count} 
          />
        </fieldset>
        
        {/* Storage Calculator Link */}
        <aside 
          className="mt-4 p-3 mb-12 border border-border bg-surface-primary rounded-md max-w-fit"
          role="complementary"
          aria-label="Storage calculator help"
        >
          <p className="text-xs text-text-secondary">
            If you are unsure how many units you need, check our storage calculator{' '}
            <Link 
              href="/storage-calculator" 
              className="underline text-primary hover:text-primary-hover" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Open storage calculator in new tab"
            >
              here
            </Link>
          </p>
        </aside>

        {/* Plan Selection Section */}
        <fieldset className="pb-4">
          <legend className="mb-4 mt-4 text-text-primary">Do you need help loading your Boombox?</legend>
          <div 
            className="flex flex-row gap-2"
            role="radiogroup"
            aria-labelledby="plan-selection-legend"
          >
            {/* DIY Plan Option */}
            <div className="basis-1/2">
              <RadioCards
                id="option1"
                title="No, I'll load my storage unit myself"
                description="Free! 1st hour"
                plan="Do It Yourself Plan"
                icon={
                  <FurnitureIcon 
                    className="w-14 sm:w-16 text-primary" 
                    hasError={!!errors.planError} 
                  />
                }
                checked={formState.selectedPlan === 'option1'}
                onChange={handlePlanChange}
                hasError={!!errors.planError}
                onClearError={() => onClearError('planError')}
              />
            </div>
            
            {/* Full Service Plan Option */}
            <div className="basis-1/2">
              <RadioCards
                id="option2"
                title="Yes, I would love some help loading"
                description="$189/hr estimate"
                plan="Full Service Plan"
                icon={
                  <MovingHelpIcon 
                    className="w-14 sm:w-16 text-primary" 
                    hasError={!!errors.planError} 
                  />
                }
                checked={formState.selectedPlan === 'option2'}
                onChange={handlePlanChange}
                hasError={!!errors.planError}
                onClearError={() => onClearError('planError')}
              />
            </div>
          </div>
          
          {/* Plan Error Display */}
          {errors.planError && (
            <div 
              className="flex items-center mb-4 mt-1"
              role="alert"
              aria-live="polite"
            >
              <p className="ml-1 text-sm text-status-error">{errors.planError}</p>
            </div>
          )}
          
          {/* Plan Details Toggle */}
          <div className="mt-4 p-3 sm:mb-4 mb-2 bg-surface-primary border border-border rounded-md max-w-fit">
            <p className="text-xs text-text-secondary">
              To learn what&apos;s included in each plan click{' '}
              <button
                type="button"
                className="underline cursor-pointer text-primary hover:text-primary-hover bg-transparent border-none p-0 font-inherit"
                onClick={onTogglePlanDetails}
                aria-expanded={formState.isPlanDetailsVisible}
                aria-controls="plan-details-content"
                aria-label="Toggle plan details visibility"
              >
                here
              </button>
            </p>
          </div>

          {/* Plan Details Accordion */}
          <div
            id="plan-details-content"
            ref={contentRef}
            style={{
              height: formState.isPlanDetailsVisible ? `${formState.contentHeight}px` : '0px',
              overflow: 'hidden',
              transition: 'height 0.5s ease',
            }}
            className={`mt-4 rounded-md bg-surface-tertiary transition-all duration-500 ease-in-out ${
              formState.isPlanDetailsVisible ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!formState.isPlanDetailsVisible}
            role="region"
            aria-labelledby="plan-details-toggle"
          >
            <LaborPlanDetails />
          </div>
        </fieldset>

        {/* Insurance Selection Section */}
        <fieldset className="mb-96 sm:mb-60">
          <legend className="mb-4 mt-4 text-text-primary">Do you need additional insurance coverage?</legend>
          <InsuranceInput 
            value={formState.selectedInsurance?.value || null} 
            onInsuranceChange={handleInsuranceChange} 
            hasError={!!errors.insuranceError} 
            onClearError={() => onClearError('insuranceError')} 
          />
          {errors.insuranceError && (
            <div 
              className="flex items-center mb-4 mt-3"
              role="alert"
              aria-live="polite"
            >
              <p className="ml-1 text-sm text-status-error">{errors.insuranceError}</p>
            </div>
          )}
        </fieldset>
      </div>
    </div>
  );
}
