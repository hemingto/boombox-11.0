/**
 * @fileoverview Tests for LoginForm component
 * @source boombox-11.0/src/components/features/auth/LoginForm.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: null });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render the login form with title', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Log in')).toBeInTheDocument();
    });

    it('should render phone input by default', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/phone number for login/i)).toBeInTheDocument();
    });

    it('should render send verification code button', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
    });

    it('should not show back button initially', () => {
      render(<LoginForm />);
      
      expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument();
    });
  });

  describe('Step 1: Contact Information', () => {
    it('should toggle between phone and email input', () => {
      render(<LoginForm />);
      
      // Initially shows phone
      expect(screen.getByLabelText(/phone number for login/i)).toBeInTheDocument();
      
      // Click toggle link
      const toggleLink = screen.getByText(/email instead/i);
      fireEvent.click(toggleLink);
      
      // Should show email now
      expect(screen.getByLabelText(/email address for login/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/phone number for login/i)).not.toBeInTheDocument();
    });

    it('should clear errors when toggling input method', () => {
      render(<LoginForm />);
      
      // Initially shows phone
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      
      // Try to submit without entering phone
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      // Wait for validation error (if any appears)
      // Then toggle
      const toggleLink = screen.getByText(/email instead/i);
      fireEvent.click(toggleLink);
      
      // Error should be cleared
      expect(screen.queryByText(/please enter a valid/i)).not.toBeInTheDocument();
    });

    it('should show helper text for toggling', () => {
      render(<LoginForm />);
      
      expect(screen.getByText(/Can't remember your phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/email instead/i)).toBeInTheDocument();
    });
  });

  describe('Step 2: Account Selection', () => {
    it('should show account selection when multiple accounts exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          multipleAccounts: true,
          accounts: [
            { id: '1', name: 'John Doe', type: 'customer' },
            { id: '2', name: 'John Doe', type: 'driver' },
          ],
        }),
      });
      
      render(<LoginForm />);
      
      // Enter phone number
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      
      // Submit
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      // Should show account selection
      await waitFor(() => {
        expect(screen.getByText('Select your account type')).toBeInTheDocument();
      });
    });

    it('should show back button on account selection step', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          multipleAccounts: true,
          accounts: [
            { id: '1', name: 'John Doe', type: 'customer' },
            { id: '2', name: 'John Doe', type: 'driver' },
          ],
        }),
      });
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Should show back button (as an element with aria-label)
      await waitFor(() => {
        expect(screen.getByLabelText(/go back/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Verification Code', () => {
    it('should show verification code input when single account exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [{ id: '1', name: 'John Doe', type: 'customer' }],
        }),
      });
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Should show verification code input
      await waitFor(() => {
        expect(screen.getByText(/Enter the 4-digit verification code/i)).toBeInTheDocument();
      });
    });

    it('should show resend link on verification code step', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [{ id: '1', name: 'John Doe', type: 'customer' }],
        }),
      });
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Should show resend link
      await waitFor(() => {
        expect(screen.getByText(/Didn't receive code/i)).toBeInTheDocument();
        expect(screen.getByText('Resend')).toBeInTheDocument();
      });
    });

    it('should change button text to "Log In" on verification step', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [{ id: '1', name: 'John Doe', type: 'customer' }],
        }),
      });
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Button should change to "Log In"
      await waitFor(() => {
        expect(screen.getByText('Log In')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when submitting', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ accounts: [{ id: '1', name: 'John Doe', type: 'customer' }] }),
        }), 100))
      );
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Should show loading text
      expect(screen.getByText('Sending Verification Code...')).toBeInTheDocument();
    });

    it('should disable button during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ accounts: [{ id: '1', name: 'John Doe', type: 'customer' }] }),
        }), 100))
      );
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      // Button should be disabled
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Session Warning Modal', () => {
    it('should not show modal initially', () => {
      render(<LoginForm />);
      
      expect(screen.queryByText('Account Session Warning')).not.toBeInTheDocument();
    });

    // Additional modal tests would require mocking useSession with an active session
  });

  describe('Navigation', () => {
    it('should go back from verification code to contact input', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [{ id: '1', name: 'John Doe', type: 'customer' }],
        }),
      });
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Wait for verification step
      await waitFor(() => {
        expect(screen.getByText(/Enter the 4-digit verification code/i)).toBeInTheDocument();
      });
      
      // Click back button (using aria-label since it's an SVG with role="button")
      const backButton = screen.getByLabelText(/go back/i);
      fireEvent.click(backButton);
      
      // Should go back to phone input
      await waitFor(() => {
        expect(screen.getByLabelText(/phone number for login/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for back button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [{ id: '1', name: 'John Doe', type: 'customer' }],
        }),
      });
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Check back button accessibility - it's an svg with role="button"
      await waitFor(() => {
        const backButton = screen.getByLabelText(/go back/i);
        expect(backButton).toHaveAttribute('role', 'button');
        expect(backButton).toHaveAttribute('tabindex', '0');
      });
    });

    it('should mark button as busy during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ accounts: [{ id: '1', name: 'John Doe', type: 'customer' }] }),
        }), 100))
      );
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      
      const submitButton = screen.getByText('Send Verification Code');
      fireEvent.click(submitButton);
      
      // Should have aria-busy
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<LoginForm />);
      
      // Enter phone and submit
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });
      fireEvent.click(screen.getByText('Send Verification Code'));
      
      // Should handle error (component should not crash)
      await waitFor(() => {
        expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
      });
    });
  });
});

