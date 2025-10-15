/**
 * @fileoverview Tests for AdminLoginForm component
 * @source boombox-11.0/src/components/features/auth/AdminLoginForm.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLoginForm } from '@/components/features/auth/AdminLoginForm';
import { useSession } from 'next-auth/react';
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

// Mock fetch
global.fetch = jest.fn();

describe('AdminLoginForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: null });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render the admin login form with title', () => {
      render(<AdminLoginForm />);
      
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });

    it('should render email input by default', () => {
      render(<AdminLoginForm />);
      
      expect(screen.getByLabelText(/email address for login/i)).toBeInTheDocument();
    });

    it('should render send verification code button', () => {
      render(<AdminLoginForm />);
      
      expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
    });

    it('should not show back button initially', () => {
      render(<AdminLoginForm />);
      
      expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument();
    });

    it('should render in a centered container with proper styling', () => {
      const { container } = render(<AdminLoginForm />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('bg-slate-100');
    });
  });

  describe('Step 1: Contact Information', () => {
    it('should toggle between email and phone input', () => {
      render(<AdminLoginForm />);
      
      // Initially shows email
      expect(screen.getByLabelText(/email address for login/i)).toBeInTheDocument();
      
      // Click toggle link
      const toggleLink = screen.getByText(/phone number instead/i);
      fireEvent.click(toggleLink);
      
      // Should show phone now
      expect(screen.getByLabelText(/phone number for login/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/email address for login/i)).not.toBeInTheDocument();
    });

    it('should handle keyboard navigation on toggle link', () => {
      render(<AdminLoginForm />);
      
      const toggleLink = screen.getByText(/phone number instead/i);
      
      // Press Enter
      fireEvent.keyDown(toggleLink, { key: 'Enter' });
      
      // Should toggle to phone
      expect(screen.getByLabelText(/phone number for login/i)).toBeInTheDocument();
    });

    it('should clear errors when toggling input method', () => {
      render(<AdminLoginForm />);
      
      const emailInput = screen.getByLabelText(/email address for login/i);
      
      // Enter invalid email and try to submit
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      // Toggle input method
      const toggleLink = screen.getByText(/phone number instead/i);
      fireEvent.click(toggleLink);
      
      // Error should be cleared (no error text visible)
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
    });

    it('should show helper text for toggling', () => {
      render(<AdminLoginForm />);
      
      expect(screen.getByText(/Verify your account with your/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number instead/i)).toBeInTheDocument();
    });

    it('should handle form submission with Enter key', () => {
      render(<AdminLoginForm />);
      
      const form = screen.getByRole('button', { name: /send verification code/i }).closest('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Sending Verification Code', () => {
    it('should send verification code successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      
      render(<AdminLoginForm />);
      
      // Enter email
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      
      // Submit
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });
      
      // Should proceed to verification step
      await waitFor(() => {
        expect(screen.getByText(/Enter the 4-digit verification code/i)).toBeInTheDocument();
      });
    });

    it('should display error when API call fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Admin not found' }),
      });
      
      render(<AdminLoginForm />);
      
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'invalid@test.com' } });
      
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Admin not found')).toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );
      
      render(<AdminLoginForm />);
      
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      // Button should be disabled
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Step 2: Verification Code', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
    });

    it('should show verification step after code sent', async () => {
      render(<AdminLoginForm />);
      
      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Should show verification step
      await waitFor(() => {
        expect(screen.getByText(/Enter the 4-digit verification code/i)).toBeInTheDocument();
      });
    });

    it('should show back button on verification step', async () => {
      render(<AdminLoginForm />);
      
      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Should show back button
      await waitFor(() => {
        expect(screen.getByLabelText(/go back/i)).toBeInTheDocument();
      });
    });

    it('should handle back navigation', async () => {
      render(<AdminLoginForm />);
      
      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      await waitFor(() => {
        expect(screen.getByLabelText(/go back/i)).toBeInTheDocument();
      });
      
      // Click back
      const backButton = screen.getByLabelText(/go back/i);
      fireEvent.click(backButton);
      
      // Should return to contact info step
      await waitFor(() => {
        expect(screen.getByLabelText(/email address for login/i)).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation on back button', async () => {
      render(<AdminLoginForm />);
      
      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      await waitFor(() => {
        expect(screen.getByLabelText(/go back/i)).toBeInTheDocument();
      });
      
      // Press Enter on back button
      const backButton = screen.getByLabelText(/go back/i);
      fireEvent.keyDown(backButton, { key: 'Enter' });
      
      // Should return to contact info step
      await waitFor(() => {
        expect(screen.getByLabelText(/email address for login/i)).toBeInTheDocument();
      });
    });

    it('should show resend code option', async () => {
      render(<AdminLoginForm />);
      
      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      await waitFor(() => {
        expect(screen.getByText(/Didn't receive code/i)).toBeInTheDocument();
        expect(screen.getByText('Resend')).toBeInTheDocument();
      });
    });

    it('should handle resend code', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      
      render(<AdminLoginForm />);
      
      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      await waitFor(() => {
        expect(screen.getByText('Resend')).toBeInTheDocument();
      });
      
      // Click resend
      const resendButton = screen.getByText('Resend');
      fireEvent.click(resendButton);
      
      // Should call API again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should show confirmation message after sending code', async () => {
      render(<AdminLoginForm />);
      
      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Check for key parts of the message
      await waitFor(() => {
        expect(screen.getByText(/verification code to/i)).toBeInTheDocument();
        expect(screen.getByText(/admin@test.com/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter it below/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Warning Modal', () => {
    it('should show session warning when non-admin is logged in', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: '2', accountType: 'customer' },
        },
      });

      // Mock API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ admin: { id: 1 } }),
        });

      render(<AdminLoginForm />);

      // Send code
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Digit 1/i)).toBeInTheDocument();
      });

      // Enter verification code
      const inputs = screen.getAllByRole('textbox');
      const codeInputs = inputs.filter((input) =>
        input.getAttribute('aria-label')?.includes('Digit')
      );
      
      fireEvent.change(codeInputs[0], { target: { value: '1' } });
      fireEvent.change(codeInputs[1], { target: { value: '2' } });
      fireEvent.change(codeInputs[2], { target: { value: '3' } });
      fireEvent.change(codeInputs[3], { target: { value: '4' } });

      // Submit verification
      const verifyButton = screen.getByText('Verify & Login');
      fireEvent.click(verifyButton);

      // Should show session warning modal
      await waitFor(() => {
        expect(screen.getByText('Admin Login Warning')).toBeInTheDocument();
      });
    });

    it('should handle session warning confirmation', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: '2', accountType: 'customer' },
        },
      });

      // Mock API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ admin: { id: 1 } }),
        });

      render(<AdminLoginForm />);

      // Send code and verify (simplified)
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Digit 1/i)).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole('textbox');
      const codeInputs = inputs.filter((input) =>
        input.getAttribute('aria-label')?.includes('Digit')
      );
      
      codeInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: String(index + 1) } });
      });

      fireEvent.click(screen.getByText('Verify & Login'));

      await waitFor(() => {
        expect(screen.getByText('Admin Login Warning')).toBeInTheDocument();
      });

      // Click confirm button
      const confirmButton = screen.getByText('Log Out & Continue');
      expect(confirmButton).toBeInTheDocument();
    });

    it('should handle session warning cancellation', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: '2', accountType: 'customer' },
        },
      });

      // Mock API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ admin: { id: 1 } }),
        });

      render(<AdminLoginForm />);

      // Send code and verify
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.click(screen.getByText('Send Verification Code'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Digit 1/i)).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole('textbox');
      const codeInputs = inputs.filter((input) =>
        input.getAttribute('aria-label')?.includes('Digit')
      );
      
      codeInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: String(index + 1) } });
      });

      fireEvent.click(screen.getByText('Verify & Login'));

      await waitFor(() => {
        expect(screen.getByText('Admin Login Warning')).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
      fireEvent.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Admin Login Warning')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AdminLoginForm />);
      
      expect(screen.getByLabelText(/email address for login/i)).toBeInTheDocument();
    });

    it('should mark button as busy during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );
      
      render(<AdminLoginForm />);
      
      const emailInput = screen.getByLabelText(/email address for login/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should support keyboard navigation', () => {
      render(<AdminLoginForm />);
      
      const toggleLink = screen.getByText(/phone number instead/i);
      
      // Should have tabIndex
      expect(toggleLink).toHaveAttribute('tabIndex', '0');
      
      // Initially shows email
      expect(screen.getByLabelText(/email address for login/i)).toBeInTheDocument();
      
      // Should respond to Enter key
      fireEvent.keyDown(toggleLink, { key: 'Enter' });
      
      // Should toggle to phone
      expect(screen.getByLabelText(/phone number for login/i)).toBeInTheDocument();
    });
  });
});

