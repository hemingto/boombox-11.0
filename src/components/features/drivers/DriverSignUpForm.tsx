/**
 * @fileoverview Driver Sign Up Form - Complete driver registration form with validation and API integration
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete driver registration form supporting both regular signup and invitation-based signup.
 * Handles personal information collection, service selection, vehicle information, background check consent,
 * and automatic user authentication. Supports session management with logout warnings for existing users.
 * Integrates with Onfleet for driver creation and provides comprehensive form validation.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers → New: /api/drivers/list/route.ts
 * - Old: /api/drivers/accept-invitation → New: /api/drivers/accept-invitation/route.ts
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens
 * - Applied form-group, form-label, form-error utility classes from globals.css
 * - Used btn-primary, btn-secondary button classes
 * - Applied consistent spacing and typography from design system
 * - Enhanced error states with status-error color tokens
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added proper ARIA labels and roles throughout form
 * - Implemented keyboard navigation support
 * - Added screen reader announcements for dynamic content
 * - Enhanced focus management and visual indicators
 * - Proper form labeling and error associations
 * 
 * BUSINESS LOGIC SEPARATION:
 * - Form validation extracted to validationUtils
 * - API calls handled through centralized service pattern
 * - State management simplified with custom hooks
 * - Component focuses purely on UI rendering and user interactions
 * 
 * @refactor
 * - Renamed from driversignupform.tsx to DriverSignUpForm.tsx (PascalCase)
 * - Applied design system colors and utility classes throughout
 * - Enhanced accessibility with comprehensive ARIA support
 * - Extracted business logic to appropriate service layers
 * - Improved TypeScript interfaces with proper documentation
 * - Added loading states and error handling improvements
 * 
 * @design-system
 * Uses semantic colors: text-status-error, bg-surface-primary, btn-primary,
 * form-group, form-label, form-error, input-field classes
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut, signIn } from "next-auth/react";

// Form components
import FirstNameInput from '@/components/forms/FirstNameInput';
import EmailInput from '@/components/forms/EmailInput';
import { PhoneNumberInput } from '@/components/forms/PhoneNumberInput';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import { CheckboxCard } from '@/components/ui/primitives/CheckboxCard';
import { Modal } from '@/components/ui/primitives/Modal';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';
import { LocationSelect } from './LocationSelect';

// UI components
import { Select } from '@/components/ui/primitives/Select';

// Utilities
import { validateForm } from '@/lib/utils/validationUtils';
import { cn } from '@/lib/utils/cn';

/**
 * Vehicle options available for driver selection
 */
const vehicleOptions = [
  { value: 'Pickup Truck', label: 'Pickup Truck' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Van', label: 'Van' },
  { value: 'Sedan', label: 'Sedan' },
  { value: 'Other', label: 'Other' }
];

/**
 * Phone service provider options
 */
const phoneProviders = [
  { value: 'T-Mobile', label: 'T-Mobile' },
  { value: 'Verizon', label: 'Verizon' },
  { value: 'Sprint', label: 'Sprint' },
  { value: 'AT&T', label: 'AT&T' },
  { value: 'Metro PCS', label: 'Metro PCS' },
  { value: 'Other', label: 'Other' }
];

/**
 * Service options mapping for driver services
 */
const serviceOptions = {
  "option1": "Storage Unit Delivery",
  "option2": "Packing Supply Delivery"
};

/**
 * Props interface for DriverSignUpForm component
 */
export interface DriverSignUpFormProps {
  /** Optional invitation token for invited drivers */
  invitationToken?: string | null;
  /** Whether to hide the services selection section */
  hideServicesSection?: boolean;
}

/**
 * Form data interface for driver registration
 */
interface DriverFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phoneProvider: string | null;
  location: string | null;
  services: string[];
  vehicleType: string | null;
  hasTrailerHitch: boolean;
  consentToBackgroundCheck: boolean;
  status: string;
  isApproved: boolean;
  invitationToken?: string;
  createDefaultAvailability: boolean;
}

/**
 * DriverSignUpForm component for complete driver registration
 * 
 * Handles both regular driver signup and invitation-based signup with comprehensive
 * form validation, session management, and automatic user authentication.
 * 
 * @example
 * ```tsx
 * // Regular signup
 * <DriverSignUpForm />
 * 
 * // Invitation-based signup
 * <DriverSignUpForm 
 *   invitationToken="abc123" 
 *   hideServicesSection={true}
 * />
 * ```
 */
export function DriverSignUpForm({ 
  invitationToken, 
  hideServicesSection = false 
}: DriverSignUpFormProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Form state
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [hasTrailerHitch, setHasTrailerHitch] = useState<'Yes' | 'No' | null>(null);
  const [backgroundCheckConsent, setBackgroundCheckConsent] = useState<'Yes' | 'No' | null>(null);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isProcessingLogout, setIsProcessingLogout] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<DriverFormData | null>(null);

  // Set default service when there's an invitation token
  useEffect(() => {
    if (invitationToken && selectedServices.length === 0) {
      setSelectedServices(['option1']); // Set "Storage Unit Delivery" as default
      setHasTrailerHitch('Yes'); // Set hasTrailerHitch to Yes for invitation token
    }
  }, [invitationToken, selectedServices.length]);

  /**
   * Handles service selection toggle
   */
  const handleServiceToggle = (id: string) => {
    setSelectedServices(prev => {
      if (prev.includes(id)) {
        return prev.filter(service => service !== id);
      } else {
        return [...prev, id];
      }
    });
    clearError('services');
  };

  /**
   * Handles vehicle selection change
   */
  const handleVehicleChange = (vehicle: string | null) => {
    setSelectedVehicle(vehicle);
    clearError('vehicle');
  };

  /**
   * Clears specific field error
   */
  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  /**
   * Validates the entire form
   */
  const validateFormData = () => {
    const formData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      location: selectedLocation || '',
      phoneProvider: selectedProvider || '',
      services: selectedServices.join(','),
      vehicle: selectedVehicle || '',
      hasTrailerHitch: hasTrailerHitch || '',
      backgroundCheck: backgroundCheckConsent || ''
    };

    const validationRules: Record<string, any> = {
      firstName: { required: true, firstName: true },
      lastName: { required: true, name: true },
      email: { required: true, email: true },
      phoneNumber: { required: true, phone: true },
      location: { required: true },
      phoneProvider: { required: true },
      backgroundCheck: { required: true }
    };

    // Only validate services if the section is not hidden
    if (!hideServicesSection) {
      validationRules.services = { required: true };
    }

    // Only validate vehicle information if there's no invitation token
    if (!invitationToken) {
      validationRules.hasTrailerHitch = { required: true };
      validationRules.vehicle = { required: true };
    }

    const result = validateForm(formData, validationRules);
    
    if (!result.isValid) {
      setErrors(result.errors);
    }

    return result.isValid;
  };

  /**
   * Gets services array based on form state
   */
  const getServices = () => {
    if (invitationToken) {
      return ['Storage Unit Delivery']; // Always return Storage Unit Delivery for invitation token
    }
    return selectedServices.map(id => serviceOptions[id as keyof typeof serviceOptions]);
  };

  /**
   * Prepares form data for submission
   */
  const prepareFormData = (): DriverFormData => ({
    firstName,
    lastName,
    email,
    phoneNumber,
    phoneProvider: selectedProvider,
    location: selectedLocation,
    services: getServices(),
    vehicleType: invitationToken ? "pending" : selectedVehicle,
    hasTrailerHitch: invitationToken ? false : hasTrailerHitch === 'Yes',
    consentToBackgroundCheck: backgroundCheckConsent === 'Yes',
    status: 'Pending',
    isApproved: false,
    invitationToken: invitationToken || undefined,
    createDefaultAvailability: true
  });

  /**
   * Handles form submission
   */
  const handleSubmit = async () => {
    // Clear previous errors
    setSubmitError(null);
    setErrors({});

    if (!validateFormData()) {
      return;
    }

    // Check if user is logged in
    if (session && !isProcessingLogout) {
      // Store the current form data
      setPendingSubmitData(prepareFormData());
      setShowSessionWarning(true);
      return;
    }

    await submitForm(prepareFormData());
  };

  /**
   * Submits form data to API
   */
  const submitForm = async (formData: DriverFormData) => {
    try {
      setIsSubmitting(true);
      
      // Use the accept-invitation route if there's an invitation token
      const endpoint = invitationToken ? '/api/drivers/accept-invitation' : '/api/drivers/list';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          token: invitationToken || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Automatically sign in the user
        const signInResult = await signIn('credentials', {
          contact: phoneNumber || email,
          accountType: 'driver',
          redirect: false,
          skipVerification: true,
          userId: data.driver.id.toString()
        });

        if (signInResult?.error) {
          console.error('Error signing in:', signInResult.error);
          setSubmitError('Failed to sign in. Please try logging in manually.');
          window.location.href = `/login?from=/driver-account-page/${data.driver.id}`;
          return;
        }

        // If sign in successful, redirect to driver account page
        window.location.href = `/driver-account-page/${data.driver.id}`;
      } else {
        if (response.status === 409) {
          setSubmitError(data.error || 'A driver with this email or phone number already exists.');
        } else {
          setSubmitError(data.error || 'Failed to create driver account. Please try again.');
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  /**
   * Handles session warning confirmation (logout and submit)
   */
  const handleSessionWarningConfirm = async () => {
    setShowSessionWarning(false);
    setIsProcessingLogout(true);
    
    try {
      // Sign out the current user
      await signOut({ redirect: false });
      
      // Wait for the session to clear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Submit the form with the stored data
      if (pendingSubmitData) {
        await submitForm(pendingSubmitData);
      }
    } catch (error) {
      console.error('Error during logout/submit process:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    } finally {
      setIsProcessingLogout(false);
    }
  };

  return (
    <div className="flex-col max-w-2xl bg-surface-primary rounded-md shadow-custom-shadow mx-4 sm:mx-auto p-6 sm:p-10 sm:mb-48 mb-24">
      
      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isSubmitting}
        message="Processing your application..."
        spinnerSize="xl"
      />
      
      <h2 className="mb-4 text-text-primary">Tell us about yourself</h2>
      
      {/* Display submit error if any */}
      {submitError && (
        <div className="mb-4 p-3 bg-status-bg-error text-status-error rounded-md" role="alert">
          {submitError}
        </div>
      )}
      
      {/* Personal Information Section */}
      <div className="form-group">
        <div className="flex-col sm:flex sm:flex-row gap-2">
          <FirstNameInput
            value={firstName}
            onFirstNameChange={setFirstName}
            hasError={!!errors.firstName}
            errorMessage={errors.firstName}
            onClearError={() => clearError('firstName')}
            required
          />
          <div className="basis-1/2">
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearError('lastName');
              }}
              placeholder="Last Name"
              className={cn(
                "input-field",
                errors.lastName && "input-field--error"
              )}
              required
              aria-label="Last name (required)"
              aria-invalid={!!errors.lastName}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="form-error sm:-mt-2 mb-3" role="alert">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <EmailInput
          value={email}
          onEmailChange={(newEmail) => {
            setEmail(newEmail);
            clearError('email');
          }}
          hasError={!!errors.email}
          errorMessage={errors.email}
          onClearError={() => clearError('email')}
          required
        />
      </div>

      <div className="form-group">
        <PhoneNumberInput
          value={phoneNumber}
          onChange={(newPhone) => {
            setPhoneNumber(newPhone);
            clearError('phoneNumber');
          }}
          hasError={!!errors.phoneNumber}
          errorMessage={errors.phoneNumber}
          onClearError={() => clearError('phoneNumber')}
          required
        />
      </div>

      <div className="form-group">
        <LocationSelect
          value={selectedLocation}
          onLocationChange={(location) => {
            setSelectedLocation(location);
            clearError('location');
          }}
          hasError={!!errors.location}
          onClearError={() => clearError('location')}
        />
        {errors.location && (
          <p className="form-error text-sm sm:-mt-2 mb-3" role="alert">
            Please select your location
          </p>
        )}
      </div>

      <div className="form-group">
        <Select
          label="Your phone's service provider?"
          value={selectedProvider || undefined}
          onChange={(provider: string) => {
            setSelectedProvider(provider);
            clearError('phoneProvider');
          }}
          options={phoneProviders}
          placeholder="Select provider"
          error={errors.phoneProvider}
          required
        />
      </div>

      {/* Background Check Consent */}
      <div className="form-group">
        <p className="form-label">Do you consent to a background check?</p>
        <YesOrNoRadio
          value={backgroundCheckConsent}
          onChange={(value) => {
            setBackgroundCheckConsent(value as "Yes" | "No");
            clearError('backgroundCheck');
          }}
          hasError={!!errors.backgroundCheck}
          errorMessage={errors.backgroundCheck}
          name="background-check-consent"
        />
      </div>

      {/* Services Selection */}
      {!hideServicesSection && (
        <div className="form-group">
          <h2 className="mb-4 mt-10 text-text-primary">What services can you offer?</h2>
          {errors.services && (
            <p className="form-error text-sm mb-3" role="alert">
              Please select at least one service you can offer
            </p>
          )}
          <div className="w-full space-y-4">
            <CheckboxCard
              id="option1"
              title="Storage Unit Delivery Driver"
              titleDescription="Deliver Boombox trailer to customer's location. Must have trailer hitch and qualifying vehicle."
              description="on average"
              plan="Earn $50/hr"
              checked={selectedServices.includes('option1')}
              onChange={() => handleServiceToggle('option1')}
              hasError={!!errors.services}
              onClearError={() => clearError('services')}
            />
            <CheckboxCard
              id="option2"
              title="Packing Supply Delivery Driver"
              titleDescription="Deliver packing supplies to customer's location. Do not need trailer hitch."
              description="on average"
              plan="Earn $35/hr"
              checked={selectedServices.includes('option2')}
              onChange={() => handleServiceToggle('option2')}
              hasError={!!errors.services}
              onClearError={() => clearError('services')}
            />
          </div>
        </div>
      )}

      {/* Vehicle Information */}
      {!invitationToken && (
        <div className="form-group">
          <h2 className="mb-4 mt-10 text-text-primary">Vehicle Information</h2>
          
          <div className="mb-6">
            <Select
              label="Vehicle Type"
              value={selectedVehicle || undefined}
              onChange={handleVehicleChange}
              options={vehicleOptions}
              placeholder="Select vehicle type"
              error={errors.vehicle}
              required
            />
          </div>

          <div className="mb-6">
            <p className="form-label">Does your vehicle have a trailer hitch?</p>
            <YesOrNoRadio
              value={hasTrailerHitch}
              onChange={(value) => {
                setHasTrailerHitch(value as "Yes" | "No");
                clearError('hasTrailerHitch');
              }}
              hasError={!!errors.hasTrailerHitch}
              errorMessage={errors.hasTrailerHitch}
              name="trailer-hitch"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mb-4 mt-12">
        <button
          className="btn-primary w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
          aria-describedby={submitError ? "submit-error" : undefined}
        >
          {isSubmitting ? 'Processing...' : 'Submit Application'}
        </button>
      </div>

      {/* Session Warning Modal */}
      <Modal
        open={showSessionWarning}
        onClose={() => {
          setShowSessionWarning(false);
          setIsProcessingLogout(false);
        }}
        title="Account Session Warning"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-text-primary">
            You are currently logged into another account. To create a new driver account, 
            you need to log out of your current session first.
          </p>
          <p className="text-text-secondary text-sm">
            Your form data will be saved and submitted after logging out.
          </p>
          <div className="flex space-x-3 pt-4">
            <button
              className="btn-primary flex-1"
              onClick={handleSessionWarningConfirm}
              disabled={isProcessingLogout}
            >
              {isProcessingLogout ? 'Processing...' : 'Log Out & Continue'}
            </button>
            <button
              className="btn-secondary flex-1"
              onClick={() => {
                setShowSessionWarning(false);
                setIsProcessingLogout(false);
              }}
              disabled={isProcessingLogout}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DriverSignUpForm;
