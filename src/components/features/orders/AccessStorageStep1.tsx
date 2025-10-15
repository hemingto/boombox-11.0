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

import React, { useCallback, useEffect } from 'react';
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
  useAccessStorageFormState,
  useAccessStorageContext
} from './AccessStorageProvider';
import { DeliveryReason, PlanType } from '@/types/accessStorage.types';

function AccessStorageStep1() {
  // ===== FORM FIELD HOOKS =====
  const deliveryReasonField = useDeliveryReasonField();
  const addressField = useAddressField();
  const storageUnitField = useStorageUnitSelectionField();
  const planField = usePlanSelectionField();
  
  // ===== DATA HOOKS =====
  const { storageUnits, isLoading: storageUnitsLoading, error: storageUnitsError } = useAccessStorageUnits();
  
  // ===== FORM STATE HOOKS =====
  const { formState, updateFormState, togglePlanDetails } = useAccessStorageFormState();
  const { formHook, isEditMode, appointmentId } = useAccessStorageContext();

  // ===== DELIVERY REASON LOGIC =====
  const handleDeliveryReasonChange = useCallback((value: string | null) => {
    const deliveryReason = value as DeliveryReason | null;
    deliveryReasonField.onChange(deliveryReason);
    
    // Auto-select all units when ending storage term
    if (deliveryReason === DeliveryReason.END_STORAGE_TERM && storageUnits.length > 0) {
      const allUnitIds = storageUnits.map((unit) => unit.id);
      storageUnitField.onChange(allUnitIds);
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
          {isEditMode && (
            <div className="mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-tertiary border border-border text-text-secondary text-sm font-medium">
                <span className="w-2 h-2 bg-status-warning rounded-full mr-2" aria-hidden="true"></span>
                Editing Appointment {appointmentId && `#${appointmentId}`}
              </div>
            </div>
          )}
          <h1 id="step1-title" className="text-4xl text-text-primary font-medium">
            {isEditMode ? 'Edit your storage appointment' : 'Access your storage'}
          </h1>
          {isEditMode && (
            <p className="text-text-secondary text-lg mt-2">
              Update your appointment details below. Changes will be saved when you complete the form.
            </p>
          )}
        </header>
        
        {/* Delivery Purpose Selection */}
        <section className="form-group mb-10" aria-labelledby="delivery-purpose-heading">
          <h2 id="delivery-purpose-heading" className="form-label mb-4">
            What&apos;s the purpose of your delivery?
          </h2>
          <YesOrNoRadio
            value={deliveryReasonField.value}
            onChange={handleDeliveryReasonChange}
            yesLabel="Access items"
            noLabel="End storage term"
            hasError={!!deliveryReasonField.error}
            errorMessage={deliveryReasonField.error || 'Please make a selection'}
            name="deliveryReason"
            aria-describedby={deliveryReasonField.error ? 'delivery-reason-error' : undefined}
            className="mb-4"
          />
          {deliveryReasonField.error && (
            <div 
              id="delivery-reason-error"
              className="form-error" 
              role="alert" 
              aria-live="polite"
            >
              {deliveryReasonField.error}
            </div>
          )}
        </section>

        {/* Address Input */}
        <section className="form-group mb-10" aria-labelledby="address-heading">
          <h2 id="address-heading" className="form-label mb-4">
            Where are we delivering your Boombox?
          </h2>
          <AddressInput
            value={addressField.value}
            onAddressChange={addressField.onChange}
            hasError={!!addressField.error}
            onClearError={addressField.clearError}
            aria-describedby={addressField.error ? 'address-error' : 'address-help'}
            className="mb-4"
          />
          <div id="address-help" className="form-helper">
            Start typing your address and select from the dropdown options
          </div>
          {addressField.error && (
            <div 
              id="address-error"
              className="form-error" 
              role="alert" 
              aria-live="polite"
            >
              {addressField.error}
            </div>
          )}
        </section>

        {/* Storage Unit Selection */}
        <section className="form-group mb-10" aria-labelledby="storage-units-heading">
          <h2 id="storage-units-heading" className="form-label mb-4">
            Which storage units do you need delivered?
          </h2>
          
          {storageUnitsError && (
            <div className="form-error mb-4" role="alert" aria-live="polite">
              Failed to load storage units. Please refresh the page and try again.
            </div>
          )}
          
          {storageUnitsLoading ? (
            <div className="space-y-4" role="status" aria-label="Loading storage units">
              <div className="skeleton skeleton-text w-14 h-4" aria-hidden="true"></div>
              <div className="skeleton w-full h-36" aria-hidden="true"></div>
              <div className="skeleton w-full h-36" aria-hidden="true"></div>
              <span className="sr-only">Loading your storage units...</span>
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
              {deliveryReasonField.value === DeliveryReason.END_STORAGE_TERM ? (
                <div id="storage-units-help-end-term" className="form-helper mt-2">
                  All units are automatically selected when ending your storage term
                </div>
              ) : (
                <div id="storage-units-help" className="form-helper mt-2">
                  Select the units you need delivered to your address
                </div>
              )}
            </>
          )}
        </section>

        {/* Labor Plan Selection */}
        <section className="form-group mb-96 sm:mb-60" aria-labelledby="labor-help-heading">
          <h2 id="labor-help-heading" className="form-label mb-4">
            Do you need help unloading your Boombox?
          </h2>
          
          <LaborHelpDropdown
            value={planField.selectedPlan}
            onLaborChange={handlePlanChange}
            hasError={!!planField.error}
            onClearError={planField.clearError}
            aria-describedby={planField.error ? 'labor-help-error' : 'labor-help-description'}
            className="mb-4"
          />
          
          <div id="labor-help-description" className="form-helper mb-4">
            Choose your preferred unloading assistance level
          </div>
          
          {planField.error && (
            <div 
              id="labor-help-error"
              className="form-error mb-4" 
              role="alert" 
              aria-live="polite"
            >
              {planField.error}
            </div>
          )}
          
          {/* Plan Details Info */}
          <div className="mt-4 p-3 sm:mb-4 mb-2 bg-surface-primary border border-border rounded-md max-w-fit">
            <p className="text-xs text-text-secondary">
              To learn what&apos;s included in each plan click{' '}
              <button 
                type="button"
                className="underline cursor-pointer text-text-primary hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded transition-colors duration-200"
                onClick={togglePlanDetails}
                aria-expanded={formState.isPlanDetailsVisible}
                aria-controls="plan-details"
                aria-label={`${formState.isPlanDetailsVisible ? 'Hide' : 'Show'} plan details`}
              >
                here
              </button>
            </p>
          </div>

          {/* Plan Details Accordion */}
          <div
            id="plan-details"
            className={`mt-4 rounded-md bg-surface-tertiary transition-all duration-500 ease-in-out overflow-hidden ${
              formState.isPlanDetailsVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              height: formState.isPlanDetailsVisible ? `${formState.contentHeight}px` : '0px',
            }}
            aria-hidden={!formState.isPlanDetailsVisible}
            role="region"
            aria-labelledby="labor-help-heading"
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
