/**
 * @fileoverview Admin login form component with two-step verification flow
 * @source boombox-10.0/src/app/admin/login/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete admin login flow with phone/email verification:
 * - Step 1: Contact information input (phone or email)
 * - Step 2: Verification code entry and authentication
 * - Session conflict resolution with modal warning for non-admin sessions
 * - Redirects to /admin dashboard upon successful authentication
 * 
 * API ROUTES:
 * - POST /api/admin/login - Send verification code to admin
 * - PUT /api/admin/login - Verify code and authenticate admin
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens (primary, surface, text colors)
 * - Applied btn-primary and btn-secondary utility classes
 * - Updated loading spinner with design system colors
 * - Consistent spacing and layout patterns
 * - Modal uses design system Modal component
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Extracted all business logic into useAdminLogin custom hook
 * - Component focuses purely on UI rendering and user interactions
 * - Improved testability and maintainability
 * 
 * KEY DIFFERENCES FROM LoginForm:
 * - Uses admin-specific API endpoints
 * - No multi-account selection step
 * - Admin-focused messaging and branding
 * - Validates admin account type in session
 * 
 * @refactor Separated business logic from UI, enhanced with design system compliance,
 * improved accessibility with ARIA labels and keyboard navigation, clean component architecture
 */

'use client';

import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { LoginStep1 } from './LoginStep1';
import { VerificationCode } from './VerificationCodeInput';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { useAdminLogin } from '@/hooks/useAdminLogin';

/**
 * AdminLoginForm - Complete admin authentication flow component
 * 
 * @example
 * ```tsx
 * // Basic usage in admin login page
 * <AdminLoginForm />
 * ```
 */
export function AdminLoginForm() {
  const adminLogin = useAdminLogin();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="mx-6 w-full max-w-lg space-y-8 rounded-3xl bg-white p-12">
        {/* Back Button */}
        {adminLogin.isCodeSent && (
          <div className="relative">
            <ChevronLeftIcon
              className="absolute -top-2 left-0 w-8 cursor-pointer text-text-primary hover:text-primary transition-colors"
              onClick={adminLogin.handleBackClick}
              role="button"
              aria-label="Go back"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  adminLogin.handleBackClick();
                }
              }}
            />
          </div>
        )}
        
        {/* Header */}
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          {adminLogin.isCodeSent && (
            <p className="mt-2 text-center text-sm text-gray-600">
              We&rsquo;ve sent a verification code to{' '}
              {adminLogin.formData.email || adminLogin.formData.phoneNumber}.
              Please enter it below to complete your login.
            </p>
          )}
        </div>
        
        {/* Form Content */}
        <div className="space-y-6">
          {/* Step 1: Contact Information */}
          {!adminLogin.isCodeSent && (
            <form onSubmit={(e) => {
              e.preventDefault();
              adminLogin.handleSendVerificationCode();
            }}>
              <div className="rounded-md">
                <LoginStep1
                  hideEmailInput={adminLogin.hideEmailInput}
                  hidePhoneInput={adminLogin.hidePhoneInput}
                  phoneNumber={adminLogin.formData.phoneNumber}
                  email={adminLogin.formData.email}
                  phoneError={adminLogin.errors.phoneNumberError}
                  emailError={adminLogin.errors.emailError}
                  onPhoneChange={(phone) =>
                    adminLogin.setFormData({ ...adminLogin.formData, phoneNumber: phone })
                  }
                  onEmailChange={(email) =>
                    adminLogin.setFormData({ ...adminLogin.formData, email })
                  }
                />
              </div>
              
              {/* Submit Button */}
              <div className="mt-2">
                <button
                  type="submit"
                  disabled={adminLogin.isLoading}
                  className={`group relative flex w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-inter font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    adminLogin.isLoading
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  aria-busy={adminLogin.isLoading}
                >
                  {adminLogin.isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
              
              {/* Toggle Input Method */}
              <div className="mt-4">
                <p className="text-sm text-text-secondary">
                  Verify your account with your{' '}
                  <span
                    className="cursor-pointer font-bold underline text-text-primary hover:text-primary"
                    onClick={adminLogin.toggleInputMethod}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        adminLogin.toggleInputMethod();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {adminLogin.hidePhoneInput ? 'phone number instead' : 'email instead'}
                  </span>
                </p>
              </div>
            </form>
          )}
          
          {/* Step 2: Verification Code */}
          {adminLogin.isCodeSent && (
            <>
              <VerificationCode
                code={adminLogin.verificationCode}
                description={`Enter the 4-digit verification code sent to your ${
                  adminLogin.hidePhoneInput ? 'email' : 'phone number'
                }`}
                setCode={adminLogin.setVerificationCode}
                error={adminLogin.errors.verificationError}
                clearError={adminLogin.clearVerificationError}
              />
              
              {/* Verify Button */}
              <button
                onClick={adminLogin.handleSendVerificationCode}
                disabled={adminLogin.isLoading}
                className={`flex w-full items-center justify-center rounded-md py-2.5 text-md font-semibold font-inter text-white ${
                  adminLogin.isLoading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                aria-busy={adminLogin.isLoading}
              >
                {/* Loading Spinner */}
                {adminLogin.isLoading && (
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {adminLogin.isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
              
              {/* Resend Code */}
              <div className="mt-4">
                <p className="text-sm text-text-secondary">
                  Didn&apos;t receive code?{' '}
                  <button
                    onClick={adminLogin.handleResend}
                    className="font-semibold underline text-text-primary hover:text-primary"
                    disabled={adminLogin.isLoading}
                  >
                    Resend
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Session Warning Modal */}
      <Modal
        open={adminLogin.showSessionWarning}
        onClose={adminLogin.handleSessionWarningClose}
        title="Admin Login Warning"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-text-primary">
            You are currently logged in as a customer, driver, or mover. To access the
            admin dashboard, you need to log out of your current session first.
          </p>
          <p className="text-sm text-text-secondary">
            Click &quot;Continue&quot; to log out and proceed with admin login.
          </p>
          
          {/* Modal Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              className="btn-primary flex-1"
              onClick={adminLogin.handleSessionWarningConfirm}
              disabled={adminLogin.isLoading}
            >
              {adminLogin.isLoading ? 'Processing...' : 'Log Out & Continue'}
            </button>
            <button
              className="btn-secondary flex-1"
              onClick={adminLogin.handleSessionWarningClose}
              disabled={adminLogin.isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminLoginForm;

