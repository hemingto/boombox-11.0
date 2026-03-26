'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import EmailInput from '@/components/forms/EmailInput';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import { Input } from '@/components/ui/primitives/Input';
import { Select, type SelectOption } from '@/components/ui/primitives/Select';
import { Modal } from '@/components/ui/primitives/Modal';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';
import {
  isValidEmail,
  normalizeWebsiteURL,
  isValidURL,
  convertEmployeeCountToNumber,
} from '@/lib/utils';
import Link from 'next/link';

const EMPLOYEE_COUNT_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select number of employees', disabled: true },
  { value: '1-5', label: '1-5' },
  { value: '6-10', label: '6-10' },
  { value: '11-20', label: '11-20' },
  { value: '21-50', label: '21-50' },
  { value: '50+', label: '50+' },
];

interface HaulerSignUpFormData {
  email: string;
  phoneNumber: string;
  companyName: string;
  website: string;
  employeeCount: string;
}

interface FormErrors {
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  employeeCount?: string;
  submit?: string;
}

export function HaulerSignUpForm() {
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState<HaulerSignUpFormData>({
    email: '',
    phoneNumber: '',
    companyName: '',
    website: '',
    employeeCount: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isProcessingLogout, setIsProcessingLogout] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] =
    useState<HaulerSignUpFormData | null>(null);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    const normalizedWebsite = normalizeWebsiteURL(formData.website);
    if (!normalizedWebsite || !isValidURL(normalizedWebsite)) {
      newErrors.website = 'Please enter a valid website URL';
    }
    if (!formData.employeeCount || formData.employeeCount === '') {
      newErrors.employeeCount = 'Please select the number of employees';
    }
    if (Object.keys(newErrors).length > 0) {
      newErrors.submit = 'Please fix the errors above before submitting.';
    }
    return newErrors;
  };

  const submitFormData = async (data: HaulerSignUpFormData) => {
    try {
      setIsSubmitting(true);
      const normalizedWebsite = normalizeWebsiteURL(data.website);
      const employeeCountNumber = convertEmployeeCountToNumber(
        data.employeeCount
      );

      const response = await fetch('/api/hauling-partners/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          website: normalizedWebsite,
          employeeCount: employeeCountNumber,
          createDefaultAvailability: true,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        const signInResult = await signIn('credentials', {
          contact: data.phoneNumber || data.email,
          accountType: 'HAULER',
          redirect: false,
          skipVerification: true,
          userId: responseData.hauler.id.toString(),
        });

        if (signInResult?.error) {
          setErrors({
            submit: 'Failed to sign in. Please try logging in manually.',
          });
          window.location.href = `/login?from=/service-provider/hauler/${responseData.hauler.id}`;
          return;
        }

        window.location.href = `/service-provider/hauler/${responseData.hauler.id}`;
      } else {
        if (response.status === 409) {
          setErrors({
            submit:
              responseData.error ||
              'A hauling partner with this email or phone number already exists.',
          });
        } else {
          setErrors({
            submit:
              responseData.error ||
              'Failed to create hauling partner company. Please try again.',
          });
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (session && !isProcessingLogout) {
      setPendingSubmitData(formData);
      setShowSessionWarning(true);
      return;
    }
    await submitFormData(formData);
  };

  const handleSessionWarningConfirm = async () => {
    setShowSessionWarning(false);
    setIsProcessingLogout(true);
    try {
      await signOut({ redirect: false });
      await new Promise(resolve => setTimeout(resolve, 500));
      if (pendingSubmitData) {
        await submitFormData(pendingSubmitData);
      }
    } catch (error) {
      console.error('Error during logout/submit process:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      setIsSubmitting(false);
    } finally {
      setIsProcessingLogout(false);
    }
  };

  const handleSessionWarningCancel = () => {
    setShowSessionWarning(false);
    setIsSubmitting(false);
    setIsProcessingLogout(false);
    setPendingSubmitData(null);
  };

  return (
    <>
      <div className="flex-col max-w-2xl bg-surface-primary rounded-md shadow-custom-shadow mx-4 sm:mx-auto p-6 sm:p-10 sm:mb-48 mb-24">
        <LoadingOverlay
          visible={isSubmitting}
          message="Processing your application..."
        />

        <h2 className="mb-6">Tell us about your company</h2>

        <div className="mb-4">
          <Input
            type="text"
            value={formData.companyName}
            onChange={e => {
              setFormData({ ...formData, companyName: e.target.value });
              setErrors({ ...errors, companyName: undefined });
            }}
            onFocus={() => setErrors({ ...errors, companyName: undefined })}
            label="Company Name"
            placeholder="Enter your company name"
            error={errors.companyName}
            fullWidth
            required
            aria-label="Company name"
            aria-invalid={!!errors.companyName}
          />
        </div>

        <div className="mb-4">
          <EmailInput
            value={formData.email}
            onEmailChange={email => {
              setFormData({ ...formData, email });
              setErrors({ ...errors, email: undefined });
            }}
            label="Email Address"
            hasError={!!errors.email}
            errorMessage={errors.email}
            onClearError={() => setErrors({ ...errors, email: undefined })}
            placeholder="Enter your email address"
            required
          />
        </div>

        <div className="mb-4">
          <PhoneNumberInput
            value={formData.phoneNumber}
            onChange={phoneNumber => {
              setFormData({ ...formData, phoneNumber });
              setErrors({ ...errors, phoneNumber: undefined });
            }}
            label="Phone Number"
            hasError={!!errors.phoneNumber}
            errorMessage={errors.phoneNumber}
            onClearError={() =>
              setErrors({ ...errors, phoneNumber: undefined })
            }
            placeholder="Enter your phone number"
            required
          />
        </div>

        <div className="mb-4 mt-10">
          <h2 className="mb-4">How big is your team?</h2>
          <Select
            options={EMPLOYEE_COUNT_OPTIONS}
            value={formData.employeeCount}
            onChange={employeeCount => {
              setFormData({ ...formData, employeeCount });
              setErrors({ ...errors, employeeCount: undefined });
            }}
            placeholder="Select number of employees"
            error={errors.employeeCount}
            onClearError={() =>
              setErrors({ ...errors, employeeCount: undefined })
            }
            fullWidth
            name="employeeCount"
            id="employeeCount"
            aria-label="Number of employees"
            size="sm"
          />
        </div>

        <div className="mb-4 mt-10">
          <h2 className="mb-4">Link your company website</h2>
          <Input
            type="url"
            value={formData.website}
            onChange={e => {
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
            <p className="text-xs text-text-primary">
              If you don&apos;t have a website, you can link your Google My
              Business Page by hitting the Share button and copying the URL.
              <br />
              <br />
              Example:{' '}
              <Link
                href="https://share.google/ivjXgbxQkX4sIiFcA"
                className="font-semibold hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://share.google/ivjXgbxQkX4sIiFcA
              </Link>
            </p>
          </div>
        </div>

        {errors.submit && (
          <div
            className="mb-4 p-3 bg-red-50 text-red-500 rounded"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm">{errors.submit}</p>
          </div>
        )}

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

      <Modal
        open={showSessionWarning}
        onClose={handleSessionWarningCancel}
        title="Already Logged In"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            You are currently logged in to another account. To continue with
            this signup, you will be logged out of your current session.
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

export default HaulerSignUpForm;
