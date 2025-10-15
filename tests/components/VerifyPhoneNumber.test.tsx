/**
 * @fileoverview VerifyPhoneNumber component tests
 * @source boombox-10.0/src/app/components/getquote/verifyphonenumber.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerifyPhoneNumber, VerifyPhoneNumberProps } from '@/components/features/orders/get-quote/VerifyPhoneNumber';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock VerificationCode component
jest.mock('@/components/login/VerificationCodeInput', () => ({
  VerificationCode: ({ code, description, setCode, error, clearError }: any) => (
    <div data-testid="verification-code">
      <p>{description}</p>
      {code.map((digit: string, index: number) => (
        <input
          key={index}
          data-testid={`code-digit-${index}`}
          value={digit}
          onChange={(e) => {
            const newCode = [...code];
            newCode[index] = e.target.value;
            setCode(newCode);
          }}
          onFocus={clearError}
          maxLength={1}
        />
      ))}
      {error && <p data-testid="code-error">{error}</p>}
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const defaultProps: VerifyPhoneNumberProps = {
  initialPhoneNumber: '(415) 555-1234',
  userId: 123,
};

describe('VerifyPhoneNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Rendering', () => {
    it('should render success banner', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      expect(
        screen.getByText(/Great! We received your appointment request/i)
      ).toBeInTheDocument();
    });

    it('should render title', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      expect(screen.getByText('Verify your phone number')).toBeInTheDocument();
    });

    it('should display initial phone number', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      expect(screen.getByText('(415) 555-1234')).toBeInTheDocument();
    });

    it('should render verification code inputs', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      expect(screen.getByTestId('verification-code')).toBeInTheDocument();
    });

    it('should render resend button', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      expect(screen.getByText('Resend')).toBeInTheDocument();
    });

    it('should render verify button', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    });
  });

  describe('Phone Number Editing', () => {
    it('should show edit mode when Edit button clicked', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should format phone number input', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const input = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(input, { target: { value: '4155551234' } });

      expect(input).toHaveValue('(415) 555-1234');
    });

    it('should cancel editing and restore original number', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const input = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(input, { target: { value: '9876543210' } });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.getByText('(415) 555-1234')).toBeInTheDocument();
    });

    it('should show error for invalid phone number', async () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const input = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(input, { target: { value: '123' } });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number.')).toBeInTheDocument();
      });
    });

    it('should update phone number and send code on save', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        }) // updatephonenumber
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        }); // send-code

      render(<VerifyPhoneNumber {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const input = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(input, { target: { value: '9876543210' } });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/updatephonenumber',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ userId: 123, newPhoneNumber: '9876543210' }),
          })
        );
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/send-code',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ phoneNumber: '9876543210' }),
          })
        );
      });
    });
  });

  describe('Verification Code', () => {
    it('should show error when submitting incomplete code', async () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      // Code is ['', '', '', ''] by default
      const verifyButton = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByTestId('code-error')).toHaveTextContent(
          'Please enter a valid 4-digit verification code.'
        );
      });
    });

    it('should verify code successfully', async () => {
      const { signIn } = require('next-auth/react');
      
      mockPush.mockClear();
      (signIn as jest.Mock).mockResolvedValue({ error: null });
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userId: 123 }),
      });

      render(<VerifyPhoneNumber {...defaultProps} />);

      // Fill in code
      const codeInputs = [
        screen.getByTestId('code-digit-0'),
        screen.getByTestId('code-digit-1'),
        screen.getByTestId('code-digit-2'),
        screen.getByTestId('code-digit-3'),
      ];

      fireEvent.change(codeInputs[0], { target: { value: '1' } });
      fireEvent.change(codeInputs[1], { target: { value: '2' } });
      fireEvent.change(codeInputs[2], { target: { value: '3' } });
      fireEvent.change(codeInputs[3], { target: { value: '4' } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/verify-code',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ phoneNumber: '4155551234', code: '1234' }),
          })
        );
      });

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          redirect: false,
          contact: '4155551234',
          accountType: 'customer',
          code: '1234',
          skipVerification: 'true',
          userId: '123',
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/user-page/123');
      });
    });

    it('should handle verification error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid code' }),
      });

      render(<VerifyPhoneNumber {...defaultProps} />);

      // Fill in code
      const codeInputs = [
        screen.getByTestId('code-digit-0'),
        screen.getByTestId('code-digit-1'),
        screen.getByTestId('code-digit-2'),
        screen.getByTestId('code-digit-3'),
      ];

      fireEvent.change(codeInputs[0], { target: { value: '1' } });
      fireEvent.change(codeInputs[1], { target: { value: '2' } });
      fireEvent.change(codeInputs[2], { target: { value: '3' } });
      fireEvent.change(codeInputs[3], { target: { value: '4' } });

      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      await waitFor(() => {
        expect(screen.getByTestId('code-error')).toHaveTextContent('Invalid code');
      });
    });
  });

  describe('Resend Code', () => {
    it('should resend verification code', async () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      const resendButton = screen.getByText('Resend');
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/send-code',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ phoneNumber: '4155551234' }),
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during verification', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<VerifyPhoneNumber {...defaultProps} />);

      // Fill code
      const codeInputs = [
        screen.getByTestId('code-digit-0'),
        screen.getByTestId('code-digit-1'),
        screen.getByTestId('code-digit-2'),
        screen.getByTestId('code-digit-3'),
      ];

      fireEvent.change(codeInputs[0], { target: { value: '1' } });
      fireEvent.change(codeInputs[1], { target: { value: '2' } });
      fireEvent.change(codeInputs[2], { target: { value: '3' } });
      fireEvent.change(codeInputs[3], { target: { value: '4' } });

      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument();
      });
    });

    it('should disable button during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<VerifyPhoneNumber {...defaultProps} />);

      // Fill code
      const codeInputs = [
        screen.getByTestId('code-digit-0'),
        screen.getByTestId('code-digit-1'),
        screen.getByTestId('code-digit-2'),
        screen.getByTestId('code-digit-3'),
      ];

      fireEvent.change(codeInputs[0], { target: { value: '1' } });
      fireEvent.change(codeInputs[1], { target: { value: '2' } });
      fireEvent.change(codeInputs[2], { target: { value: '3' } });
      fireEvent.change(codeInputs[3], { target: { value: '4' } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(verifyButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const input = screen.getByPlaceholderText('Enter your phone number');
      expect(input).toHaveAttribute('aria-label', 'Phone number');
    });

    it('should have aria-invalid on error', () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const input = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have role=alert on error messages', async () => {
      render(<VerifyPhoneNumber {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const input = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('Please enter a valid phone number.');
      });
    });

    it('should have aria-busy during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<VerifyPhoneNumber {...defaultProps} />);

      // Fill code
      const codeInputs = [
        screen.getByTestId('code-digit-0'),
        screen.getByTestId('code-digit-1'),
        screen.getByTestId('code-digit-2'),
        screen.getByTestId('code-digit-3'),
      ];

      fireEvent.change(codeInputs[0], { target: { value: '1' } });
      fireEvent.change(codeInputs[1], { target: { value: '2' } });
      fireEvent.change(codeInputs[2], { target: { value: '3' } });
      fireEvent.change(codeInputs[3], { target: { value: '4' } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(verifyButton).toHaveAttribute('aria-busy', 'true');
      });
    });
  });
});

