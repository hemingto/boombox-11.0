/**
 * @fileoverview Tests for useAdminLogin hook
 * Following boombox-11.0 testing standards
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminLogin } from '@/hooks/useAdminLogin';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods to reduce test noise
const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('useAdminLogin', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    (useSession as jest.Mock).mockReturnValue({ data: null });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useAdminLogin());

      expect(result.current.formData.phoneNumber).toBe('');
      expect(result.current.formData.email).toBe('');
      expect(result.current.errors.phoneNumberError).toBeNull();
      expect(result.current.errors.emailError).toBeNull();
      expect(result.current.errors.verificationError).toBeNull();
      expect(result.current.hideEmailInput).toBe(false);
      expect(result.current.hidePhoneInput).toBe(true);
      expect(result.current.isCodeSent).toBe(false);
      expect(result.current.verificationCode).toEqual(['', '', '', '']);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.showSessionWarning).toBe(false);
    });
  });

  describe('Toggle Input Method', () => {
    it('toggles between phone and email input', () => {
      const { result } = renderHook(() => useAdminLogin());

      expect(result.current.hidePhoneInput).toBe(true);
      expect(result.current.hideEmailInput).toBe(false);

      act(() => {
        result.current.toggleInputMethod();
      });

      expect(result.current.hidePhoneInput).toBe(false);
      expect(result.current.hideEmailInput).toBe(true);
    });

    it('clears errors when toggling input method', () => {
      const { result } = renderHook(() => useAdminLogin());

      // Set some errors
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'invalid',
        });
      });

      // Toggle should clear errors
      act(() => {
        result.current.toggleInputMethod();
      });

      expect(result.current.errors.phoneNumberError).toBeNull();
      expect(result.current.errors.emailError).toBeNull();
      expect(result.current.errors.verificationError).toBeNull();
    });
  });

  describe('Form Data Updates', () => {
    it('updates form data correctly', () => {
      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.setFormData({
          phoneNumber: '5551234567',
          email: 'admin@test.com',
        });
      });

      expect(result.current.formData.phoneNumber).toBe('5551234567');
      expect(result.current.formData.email).toBe('admin@test.com');
    });

    it('updates verification code correctly', () => {
      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.setVerificationCode(['1', '2', '3', '4']);
      });

      expect(result.current.verificationCode).toEqual(['1', '2', '3', '4']);
    });
  });

  describe('Send Verification Code', () => {
    it('sends verification code successfully with email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.isCodeSent).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          phoneNumber: undefined,
        }),
      });
    });

    it('sends verification code successfully with phone', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAdminLogin());

      // Toggle to phone input
      act(() => {
        result.current.toggleInputMethod();
      });

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          phoneNumber: '5551234567',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.isCodeSent).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: undefined,
          phoneNumber: '5551234567',
        }),
      });
    });

    it('handles API error when sending code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Admin not found' }),
      });

      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'invalid@test.com',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.errors.emailError).toBe('Admin not found');
      });

      expect(result.current.isCodeSent).toBe(false);
    });

    it('validates email format before sending', async () => {
      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'invalid-email',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      expect(result.current.errors.emailError).toBe('Please enter a valid email');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates phone number format before sending', async () => {
      const { result } = renderHook(() => useAdminLogin());

      // Toggle to phone input
      act(() => {
        result.current.toggleInputMethod();
      });

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          phoneNumber: '123', // Invalid phone number
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      expect(result.current.errors.phoneNumberError).toBe('Please enter a valid phone number');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Verify Code and Login', () => {
    it('verifies code and logs in successfully', async () => {
      const mockSignIn = signIn as jest.Mock;
      mockSignIn.mockResolvedValueOnce({ error: null });

      // First call: send code
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Second call: verify code
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ admin: { id: 1 } }),
      });

      const { result } = renderHook(() => useAdminLogin());

      // Step 1: Send code
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.isCodeSent).toBe(true);
      });

      // Step 2: Verify code
      act(() => {
        result.current.setVerificationCode(['1', '2', '3', '4']);
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          contact: 'admin@test.com',
          accountType: 'admin',
          redirect: false,
          skipVerification: true,
          userId: '1',
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/admin');
    });

    it('validates verification code before submitting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAdminLogin());

      // Send code first
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.isCodeSent).toBe(true);
      });

      // Try to verify with incomplete code
      act(() => {
        result.current.setVerificationCode(['1', '2', '', '']);
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      expect(result.current.errors.verificationError).toBe(
        'Please enter a valid 4-digit verification code'
      );
    });

    it('handles verification API error', async () => {
      // First call: send code
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Second call: verify code fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid code' }),
      });

      const { result } = renderHook(() => useAdminLogin());

      // Send code
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.isCodeSent).toBe(true);
      });

      // Try to verify with valid format but wrong code
      act(() => {
        result.current.setVerificationCode(['1', '2', '3', '4']);
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.errors.verificationError).toBe('Invalid code');
      });
    });
  });

  describe('Session Conflict Handling', () => {
    it('shows warning when non-admin user is logged in', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: '2', accountType: 'customer' },
        },
      });

      // First call: send code
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Second call: verify code
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ admin: { id: 1 } }),
      });

      const { result } = renderHook(() => useAdminLogin());

      // Send code
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.isCodeSent).toBe(true);
      });

      // Verify code
      act(() => {
        result.current.setVerificationCode(['1', '2', '3', '4']);
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.showSessionWarning).toBe(true);
      });
    });

    it('proceeds with login when confirming session warning', async () => {
      const mockSignIn = signIn as jest.Mock;
      mockSignIn.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useAdminLogin());

      // Manually set pending login data (simulating session conflict)
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      // Simulate showing session warning with pending data
      // (This would normally happen through the verification flow)
      
      // Test the confirmation handler
      await act(async () => {
        await result.current.handleSessionWarningConfirm();
      });

      // Should close the warning
      expect(result.current.showSessionWarning).toBe(false);
    });

    it('cancels login when closing session warning', () => {
      const { result } = renderHook(() => useAdminLogin());

      // Manually trigger session warning
      act(() => {
        result.current.handleSessionWarningClose();
      });

      expect(result.current.showSessionWarning).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Resend Code', () => {
    it('resends verification code successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleResend();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          phoneNumber: undefined,
        }),
      });
    });

    it('handles resend error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to resend' }),
      });

      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleResend();
      });

      await waitFor(() => {
        expect(result.current.errors.emailError).toBe('Failed to resend');
      });
    });
  });

  describe('Navigation', () => {
    it('handles back click from verification step', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAdminLogin());

      // Navigate to verification step
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          email: 'admin@test.com',
        });
      });

      await act(async () => {
        await result.current.handleSendVerificationCode();
      });

      await waitFor(() => {
        expect(result.current.isCodeSent).toBe(true);
      });

      // Go back
      act(() => {
        result.current.handleBackClick();
      });

      expect(result.current.isCodeSent).toBe(false);
    });
  });

  describe('Error Clearing', () => {
    it('clears verification error', () => {
      const { result } = renderHook(() => useAdminLogin());

      act(() => {
        result.current.clearVerificationError();
      });

      expect(result.current.errors.verificationError).toBeNull();
    });
  });
});

