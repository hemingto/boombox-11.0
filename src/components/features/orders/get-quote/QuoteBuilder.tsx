/**
 * @fileoverview Interactive quote builder for storage unit selection
 * @source boombox-10.0/src/app/components/getquote/quotebuilder.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides interactive UI for selecting number of storage units, loading help plan,
 * and insurance coverage. Includes:
 * - Address input with Google Places autocomplete
 * - Storage unit counter (1-5 units)
 * - Plan selection (DIY vs Full Service)
 * - Collapsible plan details
 * - Insurance coverage selection
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-primary, bg-white, border-slate-100)
 * - Applies consistent spacing patterns
 * - Integrates with design system form components
 * - Maintains accessibility standards
 * 
 * @refactor 
 * - No local state (all managed by parent/provider)
 * - Uses existing form primitives from src/components/forms/
 * - Proper TypeScript interfaces for type safety
 * - Clean separation of concerns (UI only)
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import AddressInput from '@/components/forms/AddressInput';
import StorageUnitCounter from '@/components/forms/StorageUnitCounter';
import { RadioCards } from '@/components/forms/RadioCards';
import InsuranceInput from '@/components/forms/InsuranceInput';
import LaborPlanDetails from '@/components/forms/LaborPlanDetails';
import { MovingHelpIcon } from '@/components/icons/MovingHelpIcon';
import { FurnitureIcon } from '@/components/icons/FurnitureIcon';
import type { InsuranceOption } from '@/types/insurance';

/**
 * QuoteBuilder component props
 */
export interface QuoteBuilderProps {
  // Address fields
  address: string;
  addressError: string | null;
  onAddressChange: (
    address: string,
    zipCode: string,
    coordinates: google.maps.LatLngLiteral,
    cityName: string
  ) => void;
  clearAddressError: () => void;
  
  // Storage unit fields
  storageUnitCount: number;
  initialStorageUnitCount: number;
  onStorageUnitChange: (count: number, text: string) => void;
  
  // Plan selection fields
  selectedPlan: string;
  planError: string | null;
  onPlanChange: (id: string, plan: string, description: string) => void;
  clearPlanError: () => void;
  onPlanTypeChange: (planType: string) => void;
  
  // Plan details expansion
  isPlanDetailsVisible: boolean;
  togglePlanDetails: () => void;
  contentHeight: number | null;
  contentRef: React.RefObject<HTMLDivElement>;
  
  // Insurance fields
  selectedInsurance: InsuranceOption | null;
  insuranceError: string | null;
  onInsuranceChange: (option: InsuranceOption | null) => void;
  clearInsuranceError: () => void;
}

/**
 * QuoteBuilder Component
 * 
 * Step 1 of the GetQuote flow - collects address, storage unit count,
 * loading help plan, and insurance coverage.
 * 
 * @param props - QuoteBuilder properties
 * @returns Quote builder form UI
 */
export function QuoteBuilder({
  address,
  addressError,
  onAddressChange,
  clearAddressError,
  storageUnitCount,
  initialStorageUnitCount: _initialStorageUnitCount,
  onStorageUnitChange,
  selectedPlan,
  planError,
  onPlanChange,
  clearPlanError,
  isPlanDetailsVisible,
  togglePlanDetails,
  contentHeight,
  contentRef,
  selectedInsurance,
  insuranceError,
  onInsuranceChange,
  clearInsuranceError,
  onPlanTypeChange,
}: QuoteBuilderProps) {
  /**
   * Update content height when plan details visibility changes
   */
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = isPlanDetailsVisible
        ? `${contentRef.current.scrollHeight}px`
        : '0px';
    }
  }, [isPlanDetailsVisible, contentRef]);

  return (
    <div className="w-full basis-1/2">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        {/* Header */}
        <h1 className="text-4xl mb-12">Build your quote</h1>

        {/* Address Selection */}
        <div className="mb-4 sm:mb-8">
          <AddressInput
            label="Where are we delivering your Boombox?"
            value={address}
            onAddressChange={onAddressChange}
            hasError={!!addressError}
            onClearError={clearAddressError}
          />
        </div>

        {/* Storage Unit Counter */}
        <div className="mb-4 sm:mb-8">
        <StorageUnitCounter
          onCountChange={onStorageUnitChange}
          initialCount={storageUnitCount}
        />
    
        {/* Storage Calculator Link */}
        <div className="mt-4 p-3 mb-12 border border-slate-100 bg-white rounded-md max-w-fit">
          <p className="text-xs">
            If you are unsure how many units you need, check our storage calculator{' '}
            <Link
              href="/storage-calculator"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </Link>
          </p>
        </div>
        </div>

        {/* Plan Selection */}
        <div className="pb-4">
          <p className="mb-4 mt-4">Do you need help loading your Boombox?</p>
          
          {/* Plan Options */}
          <div className="flex flex-row gap-2">
            {/* DIY Plan */}
            <div className="basis-1/2">
              <RadioCards
                id="option1"
                title="No, I'll load my storage unit myself"
                description="Free! 1st hour"
                plan="Do It Yourself Plan"
                icon={
                  <FurnitureIcon
                    className="w-14 sm:w-16 text-zinc-950"
                    hasError={!!planError}
                  />
                }
                checked={selectedPlan === 'option1'}
                onChange={(id, plan) => {
                  onPlanChange(id, plan, 'description');
                  onPlanTypeChange('Do It Yourself Plan');
                }}
                hasError={!!planError}
                onClearError={clearPlanError}
              />
            </div>

            {/* Full Service Plan */}
            <div className="basis-1/2">
              <RadioCards
                id="option2"
                title="Yes, I would love some help loading"
                description="$189/hr estimate"
                plan="Full Service Plan"
                icon={
                  <MovingHelpIcon
                    className="w-14 sm:w-16 text-zinc-950"
                    hasError={!!planError}
                  />
                }
                checked={selectedPlan === 'option2'}
                onChange={(id, plan, description) => {
                  onPlanChange(id, plan, description);
                }}
                hasError={!!planError}
                onClearError={clearPlanError}
              />
            </div>
          </div>

          {/* Plan Error Message */}
          {planError && (
            <div className="flex items-center mb-4 mt-1 text-red-500">
              <p className="ml-1 text-sm text-red-500 font-medium">{planError}</p>
            </div>
          )}

          {/* Plan Details Toggle */}
          <div className="mt-4 p-3 mb-4 sm:mb-8 bg-white border border-slate-100 rounded-md max-w-fit">
            <p className="text-xs">
              To learn what&apos;s included in each plan click{' '}
              <span
                className="underline cursor-pointer"
                onClick={togglePlanDetails}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePlanDetails();
                  }
                }}
                aria-expanded={isPlanDetailsVisible}
                aria-controls="plan-details-content"
              >
                here
              </span>
            </p>
          </div>

          {/* Collapsible Plan Details */}
          <div
            ref={contentRef}
            id="plan-details-content"
            style={{
              height: isPlanDetailsVisible ? `${contentHeight}px` : '0px',
              overflow: 'hidden',
              transition: 'height 0.5s ease',
            }}
            className={`mt-4 rounded-md bg-slate-100 transition-all duration-500 ease-in-out ${
              isPlanDetailsVisible ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!isPlanDetailsVisible}
          >
            <LaborPlanDetails />
          </div>
        </div>

        {/* Insurance Selection */}
        <div className="mb-96 sm:mb-60">
          <InsuranceInput
            value={selectedInsurance?.value ?? null}
            onInsuranceChange={onInsuranceChange}
            hasError={!!insuranceError}
            onClearError={clearInsuranceError}
          />
        </div>
      </div>
    </div>
  );
}

export default QuoteBuilder;

