/**
 * @fileoverview Moving partner signup form component with session management and validation
 * @source boombox-10.0/src/app/components/mover-signup/moversignupform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a comprehensive signup form for moving partner companies including company information,
 * contact details, team size, and website verification. Handles session conflicts, automatic
 * sign-in after registration, and multi-step validation with real-time error feedback.
 * 
 * API ROUTES UPDATED:
 * - Old: POST /api/movers → New: POST /api/moving-partners/list
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens (primary, status-error, surface colors)
 * - Applied form utility classes from globals.css (form-group, form-label, form-error)
 * - Used Input primitive component with consistent styling patterns
 * - Implemented Select primitive for employee count dropdown
 * - Applied btn-primary utility class for submit button
 * - Consistent error states using input-field--error patterns
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Used LoadingOverlay primitive for full-screen loading states
 * - Integrated Modal primitive for session warning dialog
 * - Used EmailInput and PhoneNumberInput form components with built-in validation
 * - Leveraged Input component for text fields with consistent error handling
 * - Used Select component for dropdown with accessibility features
 * - Validation logic uses centralized validationUtils functions
 * 
 * @refactor Migrated from inline custom styling to design system compliance with
 * reusable UI primitives, enhanced accessibility, and proper TypeScript interfaces
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import { BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import EmailInput from '@/components/forms/EmailInput';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import { Input } from '@/components/ui/primitives/Input';
import { Select, type SelectOption } from '@/components/ui/primitives/Select';
import { Modal } from '@/components/ui/primitives/Modal';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';
import { isValidEmail, isValidURL } from '@/lib/utils/validationUtils';

/**
 * Employee count options for dropdown selection
 */
const EMPLOYEE_COUNT_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select number of employees', disabled: true },
  { value: '1-5', label: '1-5' },
  { value: '6-10', label: '6-10' },
  { value: '11-20', label: '11-20' },
  { value: '21-50', label: '21-50' },
  { value: '50+', label: '50+' },
];

/**
 * Form data interface for mover signup
 */
interface MoverSignUpFormData {
  email: string;
  phoneNumber: string;
  companyName: string;
  website: string;
  employeeCount: string;
}

/**
 * Form errors interface
 */
interface FormErrors {
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  employeeCount?: string;
  submit?: string;
}

/**
 * MoverSignUpForm component provides signup functionality for moving partner companies
 */
export function MoverSignUpForm() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Form state
  const [formData, setFormData] = useState<MoverSignUpFormData>({
    email: '',
    phoneNumber: '',
    companyName: '',
    website: '',
    employeeCount: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCompanyNameFocused, setIsCompanyNameFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Session management state
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isProcessingLogout, setIsProcessingLogout] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<MoverSignUpFormData | null>(null);

  /**
   * Validate the entire form and return validation errors
   */
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Company name validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    // Email validation
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    // Website validation
    if (!formData.website.trim() || !isValidURL(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    // Employee count validation
    if (!formData.employeeCount || formData.employeeCount === '') {
      newErrors.employeeCount = 'Please select the number of employees';
    }

    // Set submit error if there are validation errors
    if (Object.keys(newErrors).length > 0) {
      newErrors.submit = 'Please fix the errors above before submitting.';
    }

    return newErrors;
  };

  /**
   * Submit form data to create mover company account
   */
  const submitFormData = async (data: MoverSignUpFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/moving-partners/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          createDefaultAvailability: true,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Automatically sign in the user
        const signInResult = await signIn('credentials', {
          contact: data.phoneNumber || data.email,
          accountType: 'mover',
          redirect: false,
          skipVerification: true,
          userId: responseData.mover.id.toString(),
        });

        if (signInResult?.error) {
          console.error('Error signing in:', signInResult.error);
          setErrors({
            submit: 'Failed to sign in. Please try logging in manually.',
          });
          window.location.href = `/login?from=/mover-account-page/${responseData.mover.id}`;
          return;
        }

        // If sign in successful, redirect to mover account page
        window.location.href = `/mover-account-page/${responseData.mover.id}`;
      } else {
        if (response.status === 409) {
          setErrors({
            submit: responseData.error || 'A mover with this email or phone number already exists.',
          });
        } else {
          setErrors({
            submit: responseData.error || 'Failed to create mover company. Please try again.',
          });
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        submit: 'An unexpected error occurred. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Check if user is logged in
    if (session && !isProcessingLogout) {
      // Store the current form data and show session warning
      setPendingSubmitData(formData);
      setShowSessionWarning(true);
      return;
    }

    // Submit form
    await submitFormData(formData);
  };

  /**
   * Handle session warning confirmation
   * Signs out current user and submits form with pending data
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
        await submitFormData(pendingSubmitData);
      }
    } catch (error) {
      console.error('Error during logout/submit process:', error);
      setErrors({
        submit: 'An unexpected error occurred. Please try again.',
      });
      setIsSubmitting(false);
    } finally {
      setIsProcessingLogout(false);
    }
  };

  /**
   * Handle session warning cancellation
   */
  const handleSessionWarningCancel = () => {
    setShowSessionWarning(false);
    setIsSubmitting(false);
    setIsProcessingLogout(false);
    setPendingSubmitData(null);
  };

  /**
   * Get icon color class based on state
   */
  const getIconColorClass = () => {
    if (errors.companyName) return 'text-status-error';
    if (formData.companyName) return 'text-primary';
    if (isCompanyNameFocused) return 'text-primary';
    return 'text-text-secondary';
  };

  return (
    <>
      <div className="flex-col max-w-2xl bg-surface-primary rounded-md shadow-custom-shadow mx-4 sm:mx-auto p-6 sm:p-10 sm:mb-48 mb-24">
        {/* Loading Overlay */}
        <LoadingOverlay
          visible={isSubmitting}
          message="Processing your application..."
        />

        <h2 className="mb-4">Tell us about your company</h2>

        {/* Company Name Input */}
        <div className="form-group">
          <div className="relative w-full">
            <span className="absolute top-3 left-3 pointer-events-none" aria-hidden="true">
              <BuildingStorefrontIcon
                className={`w-5 h-5 transition-colors duration-200 ${getIconColorClass()}`}
              />
            </span>
            <Input
              type="text"
              value={formData.companyName}
              onChange={(e) => {
                setFormData({ ...formData, companyName: e.target.value });
                setErrors({ ...errors, companyName: undefined });
              }}
              onFocus={() => {
                setIsCompanyNameFocused(true);
                setErrors({ ...errors, companyName: undefined });
              }}
              onBlur={() => setIsCompanyNameFocused(false)}
              placeholder="Enter your company name"
              error={errors.companyName}
              className="pl-10"
              fullWidth
              aria-label="Company name"
              aria-invalid={!!errors.companyName}
            />
          </div>
        </div>

        {/* Email Input */}
        <EmailInput
          value={formData.email}
          onEmailChange={(email) => {
            setFormData({ ...formData, email });
            setErrors({ ...errors, email: undefined });
          }}
          hasError={!!errors.email}
          errorMessage={errors.email}
          onClearError={() => setErrors({ ...errors, email: undefined })}
          placeholder="Enter your email address"
          required
          validateOnChange={false}
        />

        {/* Phone Number Input */}
        <PhoneNumberInput
          value={formData.phoneNumber}
          onChange={(phoneNumber) => {
            setFormData({ ...formData, phoneNumber });
            setErrors({ ...errors, phoneNumber: undefined });
          }}
          hasError={!!errors.phoneNumber}
          errorMessage={errors.phoneNumber}
          onClearError={() => setErrors({ ...errors, phoneNumber: undefined })}
          placeholder="Enter your phone number"
          required
        />

        {/* Employee Count Select */}
        <div className="mb-4 mt-6">
          <h2 className="mb-4">How big is your team?</h2>
          <Select
            options={EMPLOYEE_COUNT_OPTIONS}
            value={formData.employeeCount}
            onChange={(employeeCount) => {
              setFormData({ ...formData, employeeCount });
              setErrors({ ...errors, employeeCount: undefined });
            }}
            placeholder="Select number of employees"
            error={errors.employeeCount}
            onClearError={() => setErrors({ ...errors, employeeCount: undefined })}
            fullWidth
            name="employeeCount"
            id="employeeCount"
            aria-label="Number of employees"
          />
        </div>

        {/* Website Input */}
        <div className="mb-4 mt-10">
          <h2 className="mb-4">Link your company website</h2>
          <Input
            type="url"
            value={formData.website}
            onChange={(e) => {
              setFormData({ ...formData, website: e.target.value });
              setErrors({ ...errors, website: undefined });
            }}
            onFocus={() => setErrors({ ...errors, website: undefined })}
            placeholder="Enter your website URL or GMB page"
            error={errors.website}
            fullWidth
            aria-label="Company website"
            aria-invalid={!!errors.website}
          />
          <div className="mt-4 p-3 sm:mb-4 mb-2 border border-border bg-surface-primary rounded-md max-w-fit">
            <p className="text-sm text-text-secondary">
              If you don&apos;t have a website, you can link your Google My Business Page
            </p>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div 
            className="mb-4 p-3 bg-red-50 border border-border-error text-red-700 rounded"
            role="alert"
            aria-live="polite"
          >
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="mb-4 mt-12">
          <button
            className="btn-primary w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>

      {/* Session Warning Modal */}
      <Modal
        open={showSessionWarning}
        onClose={handleSessionWarningCancel}
        title="Already Logged In"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            You are currently logged in to another account. To continue with this signup, 
            you will be logged out of your current session.
          </p>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleSessionWarningCancel}
              className="btn-secondary"
              disabled={isProcessingLogout}
            >
              Cancel
            </button>
            <button
              onClick={handleSessionWarningConfirm}
              className="btn-primary"
              disabled={isProcessingLogout}
            >
              {isProcessingLogout ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default MoverSignUpForm;

