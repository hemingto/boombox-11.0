/**
 * @fileoverview Access Storage Step 1 - Delivery Purpose & Address Selection
 * @source boombox-10.0/src/app/components/access-storage/accessstoragestep1.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * First step of the access storage form that handles delivery purpose selection (access items vs end storage term),
 * address input with geocoding, storage unit selection, and labor plan choice. Features automatic unit selection
 * for "End storage term", real-time validation, and plan details accordion with smooth animations.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/storageUnitsByUser → New: /api/customers/storage-units-by-customer (handled by useStorageUnits hook)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic color tokens throughout (text-status-error, bg-surface-tertiary, etc.)
 * - Used form utility classes (form-label, form-error) for consistent styling
 * - Replaced hardcoded colors with design system tokens
 * - Enhanced loading states with skeleton components
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added comprehensive ARIA labels and semantic HTML structure
 * - Implemented proper heading hierarchy (h1 → h2)
 * - Added live regions for error announcements
 * - Enhanced keyboard navigation with focus management
 * - Screen reader optimized loading states and form feedback
 * 
 * @refactor Complete architectural modernization: extracted useState hooks to form context,
 * integrated with React Hook Form + Zod validation, added comprehensive accessibility,
 * implemented design system compliance, and enhanced error handling with real-time feedback.
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
 YesOrNoRadio,
 AddressInput,
 LaborPlanDetails,
 StorageUnitCheckboxList,
 LaborHelpDropdown
} from '@/components/forms';
import {
 useDeliveryReasonField,
 useAddressField,
 useStorageUnitSelectionField,
 usePlanSelectionField,
 useAccessStorageUnits,
 useAccessStorageFormState
} from './AccessStorageProvider';
import { DeliveryReason } from '@/types/accessStorage.types';

function AccessStorageStep1() {
 // ===== FORM FIELD HOOKS =====
 const deliveryReasonField = useDeliveryReasonField();
 const addressField = useAddressField();
 const storageUnitField = useStorageUnitSelectionField();
 const planField = usePlanSelectionField();
 
 // ===== DATA HOOKS =====
 const { storageUnits, isLoading: storageUnitsLoading, error: storageUnitsError } = useAccessStorageUnits();
 
 // Debug logging
 console.log('🎯 [AccessStorageStep1] Storage units data:', {
  count: storageUnits.length,
  isLoading: storageUnitsLoading,
  hasError: !!storageUnitsError,
  error: storageUnitsError,
  units: storageUnits
 });
 
 // ===== FORM STATE HOOKS =====
 const { formState, togglePlanDetails } = useAccessStorageFormState();
 
 // ===== REF AND STATE FOR PLAN DETAILS ACCORDION =====
 const contentRef = useRef<HTMLDivElement>(null);
 const [contentHeight, setContentHeight] = useState(0);

 // ===== DELIVERY REASON LOGIC =====
 const handleDeliveryReasonChange = useCallback((value: string | null) => {
  const deliveryReason = value as DeliveryReason | null;
  deliveryReasonField.onChange(deliveryReason);
  
  // Auto-select all units when ending storage term (excluding units with pending appointments)
  if (deliveryReason === DeliveryReason.END_STORAGE_TERM && storageUnits.length > 0) {
   // Filter out units that already have pending access storage appointments
   const selectableUnitIds = storageUnits
    .filter((unit) => !unit.pendingAppointment)
    .map((unit) => unit.id);
   storageUnitField.onChange(selectableUnitIds);
  } else if (deliveryReason === DeliveryReason.ACCESS_ITEMS) {
   // Clear selection when switching to access items
   storageUnitField.onChange([]);
  }
 }, [deliveryReasonField, storageUnitField, storageUnits]);

 // ===== PLAN SELECTION LOGIC =====
 const handlePlanChange = useCallback((id: string, planName: string, description: string) => {
  // The plan field onChange already handles plan type updates internally
  planField.onChange(id, planName, description);
 }, [planField]);

 // ===== PLAN DETAILS ACCORDION ANIMATION =====
 useEffect(() => {
  if (contentRef.current) {
   // Measure the full scrollHeight when we need to expand
   if (formState.isPlanDetailsVisible) {
    setContentHeight(contentRef.current.scrollHeight);
   } else {
    setContentHeight(0);
   }
  }
 }, [formState.isPlanDetailsVisible]);

 // ===== ACCESSIBILITY FOCUS MANAGEMENT =====
 useEffect(() => {
  // Focus management for error states
  if (deliveryReasonField.error) {
   const errorElement = document.querySelector('[role="alert"][aria-live="polite"]');
   errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
 }, [deliveryReasonField.error]);

 return (
  <div className="w-full basis-1/2" role="main" aria-labelledby="step1-title">
   <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
    {/* Page Title */}
    <header className="mb-12">
     <h1 id="step1-title" className="text-4xl text-text-primary">
      Access your storage
     </h1>
    </header>
    
    {/* Delivery Purpose Selection */}
    <section className="form-group mb-4 sm:mb-8" aria-labelledby="delivery-purpose-heading">
     <YesOrNoRadio
      value={deliveryReasonField.value}
      onChange={handleDeliveryReasonChange}
      yesLabel="Access items"
      noLabel="End storage term"
      hasError={!!deliveryReasonField.error}
      errorMessage={deliveryReasonField.error || 'Please make a selection'}
      name="deliveryReason"
      label="What's the purpose of your delivery?"
      className="mb-4"
      compactLabel={true}
     />
    </section>

    {/* Address Input */}
    <section className="form-group mb-10">
     <AddressInput
      value={addressField.value}
      onAddressChange={addressField.onChange}
      hasError={!!addressField.error}
      onClearError={addressField.clearError}
      label="Where are we delivering your Boombox?"
      className="mb-4"
     />
    </section>

    {/* Storage Unit Selection */}
    <section className="form-group mb-10" aria-labelledby="storage-units-heading">
     <h2 id="storage-units-heading" className="form-label mb-2">
      Which storage units do you need delivered?
     </h2>
     
     {storageUnitsError && (
      <div className="bg-status-bg-error p-4 rounded-md">
        <p className="form-error mb-4" role="alert" aria-live="polite">
        Failed to load storage units. Please refresh the page and try again.
        </p>
      </div>
     )}
     
     {storageUnitsLoading ? (
      <div className="space-y-4" role="status" aria-label="Loading storage units">
       <div className="skeleton skeleton-text w-14 h-4" aria-hidden="true"></div>
       <div className="skeleton w-full h-36" aria-hidden="true"></div>
       <div className="skeleton w-full h-36" aria-hidden="true"></div>
      </div>
     ) : (
      <>
       <StorageUnitCheckboxList
        storageUnits={storageUnits}
        onSelectionChange={storageUnitField.onChange}
        selectedIds={storageUnitField.selectedIds}
        hasError={!!storageUnitField.error}
        errorMessage={storageUnitField.error ?? undefined}
        disabled={deliveryReasonField.value === DeliveryReason.END_STORAGE_TERM}
        onClearError={storageUnitField.clearError}
        aria-describedby={
         deliveryReasonField.value === DeliveryReason.END_STORAGE_TERM 
          ? 'storage-units-help-end-term' 
          : 'storage-units-help'
        }
       />
       {storageUnits.length > 0 && (
        deliveryReasonField.value === DeliveryReason.END_STORAGE_TERM ? (
         <div id="storage-units-help-end-term" className="mt-4 p-3 sm:mb-4 mb-2 bg-surface-primary border border-border rounded-md max-w-fit">
          <p className="text-xs">All units are automatically selected when ending your storage term</p>
         </div>
        ) : (
         <div id="storage-units-help" className="mt-4 p-3 sm:mb-4 mb-2 bg-surface-primary border border-border rounded-md max-w-fit">
          <p className="text-xs">Select the units you need delivered to your address</p>
         </div>
        )
       )}
      </>
     )}
    </section>

    {/* Labor Plan Selection */}
    <section className="form-group mb-96 sm:mb-60">
     <LaborHelpDropdown
      value={planField.selectedPlan}
      onLaborChange={handlePlanChange}
      hasError={!!planField.error}
      onClearError={planField.clearError}
      label="Do you need help unloading your Boombox?"
      className="mb-4"
     />
     
     {/* Plan Details Toggle */}
     <div className="mt-4 p-3 sm:mb-4 mb-2 bg-surface-primary border border-border rounded-md max-w-fit">
      <p className="text-xs text-text-primary">
       To learn what&apos;s included in each plan click{' '}
       <button 
        type="button"
        className="underline cursor-pointer text-primary hover:text-primary-hover bg-transparent border-none p-0 font-inherit"
        onClick={togglePlanDetails}
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
       height: `${contentHeight}px`,
       overflow: 'hidden',
       transition: 'height 0.5s ease-in-out',
      }}
      className={`mt-4 rounded-md bg-surface-tertiary transition-opacity duration-500 ease-in-out ${
       formState.isPlanDetailsVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!formState.isPlanDetailsVisible}
      role="region"
      aria-labelledby="plan-details-toggle"
     >
      <LaborPlanDetails />
     </div>
    </section>
   </div>
  </div>
 );
}

// Export memoized component for performance optimization
export default React.memo(AccessStorageStep1);
