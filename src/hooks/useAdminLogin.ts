/**
 * @fileoverview Custom hook for admin login flow state management and business logic
 * @source boombox-10.0/src/app/admin/login/page.tsx (extracted logic)
 * 
 * HOOK FUNCTIONALITY:
 * Manages the admin login flow including:
 * - Contact information (phone/email) input and validation
 * - Verification code sending and validation
 * - Admin-specific authentication with /api/admin/login
 * - Session management for admin accounts
 * - Error handling and loading states
 * 
 * KEY DIFFERENCES FROM useLogin:
 * - Uses /api/admin/login endpoints instead of /api/auth/*
 * - No multi-account selection (admin-only flow)
 * - Redirects to /admin dashboard
 * - Checks for admin account type in session validation
 * 
 * @refactor Extracted from admin login page to follow clean architecture patterns,
 * improve reusability, and separate business logic from UI rendering
 */

import { useState, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isValidEmail } from '@/lib/utils/validationUtils';
import { isValidPhoneNumber } from '@/lib/utils/phoneUtils';

/**
 * Admin login form data interface
 */
export interface AdminLoginFormData {
  phoneNumber: string;
  email: string;
}

/**
 * Admin login error state interface
 */
export interface AdminLoginErrors {
  phoneNumberError: string | null;
  emailError: string | null;
  verificationError: string | null;
}

/**
 * Pending admin login data for session conflicts
 */
interface PendingAdminLoginData {
  contact: string;
  userId: string;
}

/**
 * useAdminLogin hook return type
 */
export interface UseAdminLoginReturn {
  // Form state
  formData: AdminLoginFormData;
  errors: AdminLoginErrors;
  hideEmailInput: boolean;
  hidePhoneInput: boolean;
  isCodeSent: boolean;
  verificationCode: string[];
  isLoading: boolean;
  
  // Session warning state
  showSessionWarning: boolean;
  
  // Form actions
  setFormData: (data: AdminLoginFormData) => void;
  setVerificationCode: (code: string[]) => void;
  toggleInputMethod: () => void;
  handleSendVerificationCode: () => Promise<void>;
  handleResend: () => Promise<void>;
  handleBackClick: () => void;
  clearVerificationError: () => void;
  
  // Session warning actions
  handleSessionWarningClose: () => void;
  handleSessionWarningConfirm: () => Promise<void>;
}

/**
 * Custom hook for managing admin login flow
 * 
 * @returns Object containing admin login state and action handlers
 * 
 * @example
 * ```tsx
 * const adminLogin = useAdminLogin();
 * 
 * return (
 *   <form onSubmit={adminLogin.handleSendVerificationCode}>
 *     <input
 *       value={adminLogin.formData.email}
 *       onChange={(e) => adminLogin.setFormData({
 *         ...adminLogin.formData,
 *         email: e.target.value
 *       })}
 *     />
 *   </form>
 * );
 * ```
 */
export function useAdminLogin(): UseAdminLoginReturn {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Form state
  const [formData, setFormData] = useState<AdminLoginFormData>({
    phoneNumber: '',
    email: '',
  });
  
  const [errors, setErrors] = useState<AdminLoginErrors>({
    phoneNumberError: null,
    emailError: null,
    verificationError: null,
  });
  
  const [hideEmailInput, setHideEmailInput] = useState(false);
  const [hidePhoneInput, setHidePhoneInput] = useState(true);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  
  // Session warning state
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<PendingAdminLoginData | null>(null);
  
  /**
   * Toggle between phone and email input
   */
  const toggleInputMethod = useCallback(() => {
    setHideEmailInput(!hideEmailInput);
    setHidePhoneInput(!hidePhoneInput);
    setErrors({
      phoneNumberError: null,
      emailError: null,
      verificationError: null,
    });
  }, [hideEmailInput, hidePhoneInput]);
  
  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    let hasError = false;
    const newErrors: AdminLoginErrors = {
      phoneNumberError: null,
      emailError: null,
      verificationError: null,
    };
    
    // Validate phone number
    if (!hidePhoneInput) {
      if (formData.phoneNumber.trim() === '') {
        newErrors.phoneNumberError = 'Please enter a valid phone number';
        hasError = true;
      } else if (!isValidPhoneNumber(formData.phoneNumber)) {
        newErrors.phoneNumberError = 'Please enter a valid phone number';
        hasError = true;
      }
    }
    
    // Validate email
    if (!hideEmailInput) {
      if (formData.email.trim() === '') {
        newErrors.emailError = 'Please enter a valid email';
        hasError = true;
      } else if (!isValidEmail(formData.email)) {
        newErrors.emailError = 'Please enter a valid email';
        hasError = true;
      }
    }
    
    setErrors(newErrors);
    return !hasError;
  }, [hidePhoneInput, hideEmailInput, formData]);
  
  /**
   * Validate verification code
   */
  const validateVerificationCode = useCallback(() => {
    if (verificationCode.every((digit) => digit === '')) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        verificationError: 'Please enter your 4-digit verification code',
      }));
      return false;
    }
    
    if (verificationCode.some((digit) => digit === '')) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        verificationError: 'Please enter a valid 4-digit verification code',
      }));
      return false;
    }
    
    setErrors((prevErrors) => ({
      ...prevErrors,
      verificationError: null,
    }));
    return true;
  }, [verificationCode]);
  
  /**
   * Perform admin login with NextAuth
   */
  const performLogin = useCallback(async (contact: string, userId: string) => {
    try {
      // Sign in with NextAuth using admin credentials
      const result = await signIn('credentials', {
        contact,
        accountType: 'admin',
        redirect: false,
        skipVerification: true,
        userId,
      });
      
      if (result?.error) {
        console.error('NextAuth sign in error:', result.error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          verificationError: 'Failed to create session. Please try again.',
        }));
        setIsLoading(false);
        return;
      }
      
      // Redirect to admin dashboard
      router.push('/admin');
    } catch (error) {
      console.error('Error during admin login:', error);
      setErrors((prevErrors) => ({
        ...prevErrors,
        verificationError: 'An error occurred during login. Please try again.',
      }));
      setIsLoading(false);
    }
  }, [router]);
  
  /**
   * Send verification code to admin phone/email
   */
  const handleSendVerificationCode = useCallback(async () => {
    if (!isCodeSent) {
      // First step: Send verification code
      if (validateForm()) {
        setIsLoading(true);
        
        try {
          const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email || undefined,
              phoneNumber: formData.phoneNumber || undefined,
            }),
          });
          
          if (response.ok) {
            setIsCodeSent(true);
          } else {
            const data = await response.json();
            const errorMessage = data.message || 'Failed to send verification code';
            
            if (!hidePhoneInput) {
              setErrors((prevErrors) => ({
                ...prevErrors,
                phoneNumberError: errorMessage,
              }));
            } else {
              setErrors((prevErrors) => ({
                ...prevErrors,
                emailError: errorMessage,
              }));
            }
          }
        } catch (error) {
          console.error('Error sending verification code:', error);
          const errorMessage = 'An error occurred while sending the code.';
          
          if (!hidePhoneInput) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              phoneNumberError: errorMessage,
            }));
          } else {
            setErrors((prevErrors) => ({
              ...prevErrors,
              emailError: errorMessage,
            }));
          }
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Second step: Verify code and login
      if (validateVerificationCode()) {
        setIsLoading(true);
        setErrors((prevErrors) => ({ ...prevErrors, verificationError: null }));
        
        const contact = hidePhoneInput ? formData.email : formData.phoneNumber;
        
        // Check for session conflict
        if (session?.user && session.user.accountType !== 'ADMIN') {
          // Non-admin user is logged in, show warning
          try {
            // Still need to verify the code before showing warning
            const verifyResponse = await fetch('/api/admin/login', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: formData.email || undefined,
                phoneNumber: formData.phoneNumber || undefined,
                code: verificationCode.join(''),
              }),
            });
            
            const data = await verifyResponse.json();
            
            if (verifyResponse.ok) {
              // Code is valid, show session warning
              setPendingLoginData({
                contact,
                userId: data.admin.id.toString(),
              });
              setShowSessionWarning(true);
              setIsLoading(false);
              return;
            } else {
              setErrors((prevErrors) => ({
                ...prevErrors,
                verificationError: data.message || 'Verification failed.',
              }));
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error verifying code:', error);
            setErrors((prevErrors) => ({
              ...prevErrors,
              verificationError: 'An error occurred while verifying the code.',
            }));
            setIsLoading(false);
            return;
          }
        }
        
        // No session conflict, proceed with verification and login
        try {
          const verifyResponse = await fetch('/api/admin/login', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email || undefined,
              phoneNumber: formData.phoneNumber || undefined,
              code: verificationCode.join(''),
            }),
          });
          
          const data = await verifyResponse.json();
          
          if (verifyResponse.ok) {
            // Verification successful, perform login
            await performLogin(contact, data.admin.id.toString());
          } else {
            setErrors((prevErrors) => ({
              ...prevErrors,
              verificationError: data.message || 'Verification failed.',
            }));
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error verifying code:', error);
          setErrors((prevErrors) => ({
            ...prevErrors,
            verificationError: 'An error occurred while verifying the code.',
          }));
          setIsLoading(false);
        }
      }
    }
  }, [
    isCodeSent,
    validateForm,
    validateVerificationCode,
    hidePhoneInput,
    hideEmailInput,
    formData,
    verificationCode,
    session,
    performLogin,
  ]);
  
  /**
   * Resend verification code
   */
  const handleResend = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.message || 'Failed to resend verification code.';
        
        if (!hidePhoneInput) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            phoneNumberError: errorMessage,
          }));
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            emailError: errorMessage,
          }));
        }
      }
    } catch (error) {
      console.error('Error resending verification code:', error);
      const errorMessage = 'An error occurred while resending the code.';
      
      if (!hidePhoneInput) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          phoneNumberError: errorMessage,
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailError: errorMessage,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [hidePhoneInput, hideEmailInput, formData]);
  
  /**
   * Handle back navigation
   */
  const handleBackClick = useCallback(() => {
    setIsCodeSent(false);
  }, []);
  
  /**
   * Clear verification error
   */
  const clearVerificationError = useCallback(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      verificationError: null,
    }));
  }, []);
  
  /**
   * Handle session warning close
   */
  const handleSessionWarningClose = useCallback(() => {
    setShowSessionWarning(false);
    setIsLoading(false);
    setPendingLoginData(null);
  }, []);
  
  /**
   * Handle session warning confirmation (proceed with admin login)
   */
  const handleSessionWarningConfirm = useCallback(async () => {
    setShowSessionWarning(false);
    setIsLoading(true);
    
    try {
      if (pendingLoginData) {
        await performLogin(pendingLoginData.contact, pendingLoginData.userId);
      }
    } catch (error) {
      console.error('Error during admin login process:', error);
      setErrors((prev) => ({
        ...prev,
        verificationError: 'An error occurred during the login process. Please try again.',
      }));
      setIsLoading(false);
    }
  }, [pendingLoginData, performLogin]);
  
  return {
    // Form state
    formData,
    errors,
    hideEmailInput,
    hidePhoneInput,
    isCodeSent,
    verificationCode,
    isLoading,
    
    // Session warning state
    showSessionWarning,
    
    // Form actions
    setFormData,
    setVerificationCode,
    toggleInputMethod,
    handleSendVerificationCode,
    handleResend,
    handleBackClick,
    clearVerificationError,
    
    // Session warning actions
    handleSessionWarningClose,
    handleSessionWarningConfirm,
  };
}

