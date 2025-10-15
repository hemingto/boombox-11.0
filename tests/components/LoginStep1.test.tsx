/**
 * @fileoverview Tests for LoginStep1 component
 * @source boombox-11.0/src/components/features/auth/LoginStep1.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoginStep1, type LoginStep1Props } from '@/components/features/auth/LoginStep1';

describe('LoginStep1', () => {
  const defaultProps: LoginStep1Props = {
    hidePhoneInput: false,
    hideEmailInput: true,
    phoneNumber: '',
    email: '',
    phoneError: null,
    emailError: null,
    onPhoneChange: jest.fn(),
    onEmailChange: jest.fn(),
  };

  describe('Rendering', () => {
    it('should render phone input when hidePhoneInput is false', () => {
      render(<LoginStep1 {...defaultProps} />);
      
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      expect(phoneInput).toBeInTheDocument();
    });

    it('should not render phone input when hidePhoneInput is true', () => {
      render(<LoginStep1 {...defaultProps} hidePhoneInput={true} hideEmailInput={false} />);
      
      const phoneInput = screen.queryByLabelText(/phone number for login/i);
      expect(phoneInput).not.toBeInTheDocument();
    });

    it('should render email input when hideEmailInput is false', () => {
      render(<LoginStep1 {...defaultProps} hideEmailInput={false} hidePhoneInput={true} />);
      
      const emailInput = screen.getByLabelText(/email address for login/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should not render email input when hideEmailInput is true', () => {
      render(<LoginStep1 {...defaultProps} />);
      
      const emailInput = screen.queryByLabelText(/email address for login/i);
      expect(emailInput).not.toBeInTheDocument();
    });
  });

  describe('Phone Number Input', () => {
    it('should display phone error when phoneError is provided', () => {
      const errorMessage = 'Please enter a valid phone number';
      render(<LoginStep1 {...defaultProps} phoneError={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should pass phone value to input', () => {
      const phoneNumber = '(555) 123-4567';
      render(<LoginStep1 {...defaultProps} phoneNumber={phoneNumber} />);
      
      const phoneInput = screen.getByLabelText(/phone number for login/i) as HTMLInputElement;
      expect(phoneInput.value).toBe(phoneNumber);
    });
  });

  describe('Email Input', () => {
    it('should display email error when emailError is provided', () => {
      const errorMessage = 'Please enter a valid email';
      render(
        <LoginStep1
          {...defaultProps}
          hidePhoneInput={true}
          hideEmailInput={false}
          emailError={errorMessage}
        />
      );
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should pass email value to input', () => {
      const email = 'test@example.com';
      render(
        <LoginStep1
          {...defaultProps}
          hidePhoneInput={true}
          hideEmailInput={false}
          email={email}
        />
      );
      
      const emailInput = screen.getByLabelText(/email address for login/i) as HTMLInputElement;
      expect(emailInput.value).toBe(email);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for phone input', () => {
      render(<LoginStep1 {...defaultProps} />);
      
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      expect(phoneInput).toHaveAttribute('aria-label', 'Phone number for login');
    });

    it('should have proper aria labels for email input', () => {
      render(
        <LoginStep1
          {...defaultProps}
          hidePhoneInput={true}
          hideEmailInput={false}
        />
      );
      
      const emailInput = screen.getByLabelText(/email address for login/i);
      expect(emailInput).toHaveAttribute('aria-label', 'Email address for login');
    });

    it('should be keyboard accessible', () => {
      render(<LoginStep1 {...defaultProps} />);
      
      const phoneInput = screen.getByLabelText(/phone number for login/i);
      expect(phoneInput).toHaveAttribute('type', 'tel');
      expect(phoneInput).toHaveAttribute('inputMode', 'tel');
    });
  });

  describe('Integration', () => {
    it('should work with both inputs hidden (edge case)', () => {
      const { container } = render(
        <LoginStep1 {...defaultProps} hidePhoneInput={true} hideEmailInput={true} />
      );
      
      // Component should render but be empty
      expect(container.querySelector('input')).not.toBeInTheDocument();
    });
  });
});

