/**
 * @fileoverview Custom hook for login flow state management and business logic
 * @source boombox-10.0/src/app/components/login/loginform.tsx (extracted logic)
 * 
 * HOOK FUNCTIONALITY:
 * Manages the complete login flow including:
 * - Contact information (phone/email) input and validation
 * - Verification code sending and validation
 * - Multiple account selection for users with customer/driver/mover accounts
 * - Session management and conflict resolution
 * - Error handling and loading states
 * 
 * @refactor Extracted from LoginForm component to follow clean architecture patterns,
 * improve reusability, and separate business logic from UI rendering
 */

import { useState, useCallback } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import { isValidEmail } from '@/lib/utils/validationUtils';
import { isValidPhoneNumber } from '@/lib/utils/phoneUtils';

/**
 * Account type interface
 */
export interface LoginAccount {
  id: string;
  type: 'customer' | 'driver' | 'mover';
  name: string;
}

/**
 * Login form data interface
 */
export interface LoginFormData {
  phoneNumber: string;
  email: string;
}

/**
 * Login error state interface
 */
export interface LoginErrors {
  phoneNumberError: string | null;
  emailError: string | null;
  verificationError: string | null;
}

/**
 * Pending login data for session conflicts
 */
interface PendingLoginData {
  contact: string;
  code: string;
  accountType: string;
}

/**
 * useLogin hook return type
 */
export interface UseLoginReturn {
  // Form state
  formData: LoginFormData;
  errors: LoginErrors;
  hideEmailInput: boolean;
  hidePhoneInput: boolean;
  isCodeSent: boolean;
  verificationCode: string[];
  isLoading: boolean;
  
  // Account selection state
  accounts: LoginAccount[];
  selectedAccountId: string | null;
  showAccountSelection: boolean;
  
  // Session warning state
  showSessionWarning: boolean;
  
  // Form actions
  setFormData: (data: LoginFormData) => void;
  setVerificationCode: (code: string[]) => void;
  toggleInputMethod: () => void;
  handleSendVerificationCode: () => Promise<void>;
  handleResend: () => Promise<void>;
  handleBackClick: () => void;
  handleAccountSelect: (accountId: string) => void;
  handleContinueWithAccount: () => void;
  clearVerificationError: () => void;
  
  // Session warning actions
  handleSessionWarningClose: () => void;
  handleSessionWarningConfirm: () => Promise<void>;
}

/**
 * Custom hook for managing login flow
 * 
 * @returns Object containing login state and action handlers
 * 
 * @example
 * ```tsx
 * const login = useLogin();
 * 
 * return (
 *   <form onSubmit={login.handleSendVerificationCode}>
 *     <input
 *       value={login.formData.phoneNumber}
 *       onChange={(e) => login.setFormData({
 *         ...login.formData,
 *         phoneNumber: e.target.value
 *       })}
 *     />
 *   </form>
 * );
 * ```
 */
export function useLogin(): UseLoginReturn {
  const { data: session } = useSession();
  
  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    phoneNumber: '',
    email: '',
  });
  
  const [errors, setErrors] = useState<LoginErrors>({
    phoneNumberError: null,
    emailError: null,
    verificationError: null,
  });
  
  const [hideEmailInput, setHideEmailInput] = useState(true);
  const [hidePhoneInput, setHidePhoneInput] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  
  // Account selection state
  const [accounts, setAccounts] = useState<LoginAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  
  // Session warning state
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<PendingLoginData | null>(null);
  
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
    const newErrors: LoginErrors = {
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
   * Perform login with NextAuth
   */
  const performLogin = useCallback(async (contact: string, code: string, accountType: string) => {
    try {
      if (!contact || !code || !accountType) {
        throw new Error('Missing required login information');
      }
      
      const result = await signIn('credentials', {
        contact,
        code,
        accountType,
        redirect: false,
      });
      
      if (result?.error) {
        console.error('NextAuth sign in error:', result.error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          verificationError: 'Authentication failed. Please try again.',
        }));
        setIsLoading(false);
        return;
      }
      
      // Get user ID for redirection
      const userId = selectedAccountId || accounts[0]?.id;
      
      if (!accountType || !userId) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          verificationError: 'Failed to redirect. Please try again.',
        }));
        setIsLoading(false);
        return;
      }
      
      // Redirect based on account type
      const redirectPath = 
        accountType === 'customer' 
          ? `/user-page/${userId}`
          : accountType === 'driver'
          ? `/driver-account-page/${userId}`
          : `/mover-account-page/${userId}`;
      
      // Force hard reload to ensure new session is picked up
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Error during login:', error);
      setErrors((prevErrors) => ({
        ...prevErrors,
        verificationError: 'An error occurred during login. Please try again.',
      }));
      setIsLoading(false);
    }
  }, [selectedAccountId, accounts]);
  
  /**
   * Send verification code to phone/email
   */
  const handleSendVerificationCode = useCallback(async () => {
    if (!isCodeSent) {
      // First step: Send verification code
      if (validateForm()) {
        setIsLoading(true);
        
        try {
          const response = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber: hidePhoneInput ? undefined : formData.phoneNumber,
              email: hideEmailInput ? undefined : formData.email,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Check if multiple accounts were found
            if (data.multipleAccounts && data.accounts && data.accounts.length > 1) {
              setAccounts(data.accounts);
              setShowAccountSelection(true);
            } else if (data.accounts && data.accounts.length === 1) {
              // Single account found
              setAccounts(data.accounts);
              setSelectedAccountId(data.accounts[0].id);
              setIsCodeSent(true);
            } else {
              setErrors((prevErrors) => ({
                ...prevErrors,
                phoneNumberError: 'No account found with these credentials.',
                emailError: 'No account found with these credentials.',
              }));
            }
          } else {
            const data = await response.json();
            if (!hidePhoneInput) {
              setErrors((prevErrors) => ({
                ...prevErrors,
                phoneNumberError: data.message || 'Failed to send verification code.',
              }));
            } else {
              setErrors((prevErrors) => ({
                ...prevErrors,
                emailError: data.message || 'Failed to send verification code.',
              }));
            }
          }
        } catch (error) {
          console.error('Error sending verification code:', error);
          if (!hidePhoneInput) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              phoneNumberError: 'An error occurred while sending the code.',
            }));
          } else {
            setErrors((prevErrors) => ({
              ...prevErrors,
              emailError: 'An error occurred while sending the code.',
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
        const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
        
        // Check for session conflict
        if (session?.user && (!selectedAccount || session.user.id !== selectedAccount.id)) {
          setPendingLoginData({
            contact,
            code: verificationCode.join(''),
            accountType: selectedAccount?.type || accounts[0]?.type,
          });
          setShowSessionWarning(true);
          setIsLoading(false);
          return;
        }
        
        // Verify code with API
        try {
          const verifyResponse = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber: hidePhoneInput ? undefined : formData.phoneNumber,
              email: hideEmailInput ? undefined : formData.email,
              code: verificationCode.join(''),
              accountId: selectedAccountId,
              accountType: selectedAccount?.type || accounts[0]?.type,
            }),
          });
          
          if (verifyResponse.ok) {
            // If verification successful, proceed with login
            await performLogin(
              contact,
              verificationCode.join(''),
              selectedAccount?.type || accounts[0]?.type
            );
          } else {
            const data = await verifyResponse.json();
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
    session,
    accounts,
    selectedAccountId,
    verificationCode,
    performLogin,
  ]);
  
  /**
   * Resend verification code
   */
  const handleResend = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: hidePhoneInput ? undefined : formData.phoneNumber,
          email: hideEmailInput ? undefined : formData.email,
        }),
      });
      
      if (response.ok) {
        console.log('Verification code resent successfully.');
      } else {
        const data = await response.json();
        if (!hidePhoneInput) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            phoneNumberError: data.message || 'Failed to resend verification code.',
          }));
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            emailError: data.message || 'Failed to resend verification code.',
          }));
        }
      }
    } catch (error) {
      console.error('Error resending verification code:', error);
      if (!hidePhoneInput) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          phoneNumberError: 'An error occurred while resending the code.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailError: 'An error occurred while resending the code.',
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
    if (showAccountSelection) {
      setShowAccountSelection(false);
      setSelectedAccountId(null);
    } else {
      setIsCodeSent(false);
    }
  }, [showAccountSelection]);
  
  /**
   * Handle account selection
   */
  const handleAccountSelect = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
  }, []);
  
  /**
   * Continue with selected account
   */
  const handleContinueWithAccount = useCallback(() => {
    if (selectedAccountId) {
      setShowAccountSelection(false);
      setIsCodeSent(true);
    }
  }, [selectedAccountId]);
  
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
   * Handle session warning confirmation (logout and login)
   */
  const handleSessionWarningConfirm = useCallback(async () => {
    setShowSessionWarning(false);
    
    try {
      setIsLoading(true);
      
      // Sign out current user
      await signOut({ redirect: false });
      
      // Wait for session to clear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Proceed with new login
      if (pendingLoginData) {
        await performLogin(
          pendingLoginData.contact,
          pendingLoginData.code,
          pendingLoginData.accountType
        );
      }
    } catch (error) {
      console.error('Error during logout/login process:', error);
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
    
    // Account selection state
    accounts,
    selectedAccountId,
    showAccountSelection,
    
    // Session warning state
    showSessionWarning,
    
    // Form actions
    setFormData,
    setVerificationCode,
    toggleInputMethod,
    handleSendVerificationCode,
    handleResend,
    handleBackClick,
    handleAccountSelect,
    handleContinueWithAccount,
    clearVerificationError,
    
    // Session warning actions
    handleSessionWarningClose,
    handleSessionWarningConfirm,
  };
}

