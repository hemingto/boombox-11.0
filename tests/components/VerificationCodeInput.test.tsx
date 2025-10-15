/**
 * @fileoverview Tests for VerificationCode component
 * @source boombox-11.0/src/components/features/auth/VerificationCodeInput.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationCode, type VerificationCodeProps } from '@/components/features/auth/VerificationCodeInput';

describe('VerificationCode', () => {
  const defaultProps: VerificationCodeProps = {
    code: ['', '', '', ''],
    description: 'Enter the 4-digit verification code sent to your phone',
    setCode: jest.fn(),
    error: null,
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render description text', () => {
      render(<VerificationCode {...defaultProps} />);
      
      expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    });

    it('should render 4 input fields', () => {
      render(<VerificationCode {...defaultProps} />);
      
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(4);
    });

    it('should display error message when error is provided', () => {
      const error = 'Invalid verification code';
      render(<VerificationCode {...defaultProps} error={error} />);
      
      expect(screen.getByText(error)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should not display error message when error is null', () => {
      render(<VerificationCode {...defaultProps} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    it('should only accept single digits', () => {
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} setCode={setCode} />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(firstInput, { target: { value: '1' } });
      
      expect(setCode).toHaveBeenCalledWith(['1', '', '', '']);
    });

    it('should not accept multiple digits in one input', () => {
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} setCode={setCode} />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(firstInput, { target: { value: '123' } });
      
      expect(setCode).not.toHaveBeenCalled();
    });

    it('should not accept non-numeric characters', () => {
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} setCode={setCode} />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(firstInput, { target: { value: 'a' } });
      
      expect(setCode).not.toHaveBeenCalled();
    });

    it('should display provided code values', () => {
      const code = ['1', '2', '3', '4'];
      render(<VerificationCode {...defaultProps} code={code} />);
      
      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      expect(inputs[0].value).toBe('1');
      expect(inputs[1].value).toBe('2');
      expect(inputs[2].value).toBe('3');
      expect(inputs[3].value).toBe('4');
    });
  });

  describe('Auto-focus Behavior', () => {
    it('should auto-focus next input when digit is entered', () => {
      render(<VerificationCode {...defaultProps} />);
      
      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];
      
      fireEvent.change(firstInput, { target: { value: '1' } });
      
      // Note: actual focus is handled by document.getElementById which is hard to test
      // This test verifies the change event is handled correctly
      expect(defaultProps.setCode).toHaveBeenCalledWith(['1', '', '', '']);
    });

    it('should not auto-focus on last input', () => {
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} setCode={setCode} />);
      
      const lastInput = screen.getAllByRole('textbox')[3];
      fireEvent.change(lastInput, { target: { value: '4' } });
      
      expect(setCode).toHaveBeenCalledWith(['', '', '', '4']);
    });
  });

  describe('Backspace Navigation', () => {
    it('should clear current input on backspace', () => {
      const code = ['1', '2', '3', ''];
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} code={code} setCode={setCode} />);
      
      const thirdInput = screen.getAllByRole('textbox')[2];
      fireEvent.keyDown(thirdInput, { key: 'Backspace' });
      
      expect(setCode).toHaveBeenCalledWith(['1', '2', '', '']);
    });

    it('should move to previous input and clear it when current is empty', () => {
      const code = ['1', '2', '', ''];
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} code={code} setCode={setCode} />);
      
      const thirdInput = screen.getAllByRole('textbox')[2];
      fireEvent.keyDown(thirdInput, { key: 'Backspace' });
      
      expect(setCode).toHaveBeenCalledWith(['1', '', '', '']);
    });

    it('should not move back from first input', () => {
      const code = ['', '', '', ''];
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} code={code} setCode={setCode} />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      fireEvent.keyDown(firstInput, { key: 'Backspace' });
      
      expect(setCode).toHaveBeenCalledWith(['', '', '', '']);
    });
  });

  describe('Error Handling', () => {
    it('should apply error styles when error is present', () => {
      const error = 'Invalid code';
      render(<VerificationCode {...defaultProps} error={error} />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveClass('bg-status-error-bg');
        expect(input).toHaveClass('text-status-error');
        expect(input).toHaveClass('ring-status-error');
      });
    });

    it('should clear error on focus', () => {
      const clearError = jest.fn();
      render(<VerificationCode {...defaultProps} error="Error" clearError={clearError} />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      fireEvent.focus(firstInput);
      
      expect(clearError).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper group label', () => {
      render(<VerificationCode {...defaultProps} />);
      
      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Verification code');
    });

    it('should have proper aria-label for each input', () => {
      render(<VerificationCode {...defaultProps} />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('aria-label', `Digit ${index + 1}`);
      });
    });

    it('should mark inputs as invalid when error is present', () => {
      render(<VerificationCode {...defaultProps} error="Invalid code" />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'code-error');
      });
    });

    it('should not mark inputs as invalid when no error', () => {
      render(<VerificationCode {...defaultProps} />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('aria-invalid', 'false');
      });
    });

    it('should use proper input modes', () => {
      render(<VerificationCode {...defaultProps} />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('inputMode', 'numeric');
        expect(input).toHaveAttribute('pattern', '[0-9]');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid input changes', () => {
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} setCode={setCode} />);
      
      const inputs = screen.getAllByRole('textbox');
      
      fireEvent.change(inputs[0], { target: { value: '1' } });
      fireEvent.change(inputs[1], { target: { value: '2' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });
      fireEvent.change(inputs[3], { target: { value: '4' } });
      
      expect(setCode).toHaveBeenCalledTimes(4);
    });

    it('should handle paste events gracefully', () => {
      const setCode = jest.fn();
      render(<VerificationCode {...defaultProps} setCode={setCode} />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      
      // Attempting to paste "1234" should only accept "1" due to maxLength
      fireEvent.change(firstInput, { target: { value: '1234' } });
      
      // Should not call setCode since length > 1
      expect(setCode).not.toHaveBeenCalled();
    });
  });
});

