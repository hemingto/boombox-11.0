/**
 * @fileoverview Tests for useRoutingNumberInput hook
 * @source boombox-11.0/src/hooks/useRoutingNumberInput.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useRoutingNumberInput } from '@/hooks/useRoutingNumberInput';
import { ValidationMessages } from '@/lib/utils/validationUtils';

// Mock the validation utilities
jest.mock('@/lib/utils/validationUtils', () => ({
  isValidRoutingNumber: jest.fn(),
  ValidationMessages: {
    REQUIRED: 'This field is required',
    INVALID_ROUTING_NUMBER: 'Routing number must be 9 digits',
  },
}));

const mockIsValidRoutingNumber = jest.mocked(require('@/lib/utils/validationUtils').isValidRoutingNumber);

describe('useRoutingNumberInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to valid routing number
    mockIsValidRoutingNumber.mockReturnValue(true);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useRoutingNumberInput());

      expect(result.current.value).toBe('');
      expect(result.current.isFocused).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });

    it('should initialize with provided initial value', () => {
      const { result } = renderHook(() => useRoutingNumberInput('123456789'));

      expect(result.current.value).toBe('123456789');
    });

    it('should initialize with error state from options', () => {
      const { result } = renderHook(() =>
        useRoutingNumberInput('', {
          hasError: true,
          errorMessage: 'Custom error',
        })
      );

      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Custom error');
    });
  });

  describe('Input Handling', () => {
    it('should accept numeric input', () => {
      const onRoutingNumberChange = jest.fn();
      const { result } = renderHook(() =>
        useRoutingNumberInput('', { onRoutingNumberChange })
      );

      act(() => {
        result.current.handleChange({
          target: { value: '123456789' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.value).toBe('123456789');
      expect(onRoutingNumberChange).toHaveBeenCalledWith('123456789');
    });

    it('should reject non-numeric input', () => {
      const onRoutingNumberChange = jest.fn();
      const { result } = renderHook(() =>
        useRoutingNumberInput('', { onRoutingNumberChange })
      );

      act(() => {
        result.current.handleChange({
          target: { value: '123abc456' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.value).toBe('');
      expect(onRoutingNumberChange).not.toHaveBeenCalled();
    });

    it('should handle partial numeric input', () => {
      const { result } = renderHook(() => useRoutingNumberInput(''));

      act(() => {
        result.current.handleChange({
          target: { value: '12345' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.value).toBe('12345');
    });

    it('should clear error when user starts typing after error', () => {
      const { result } = renderHook(() =>
        useRoutingNumberInput('', {
          hasError: true,
          errorMessage: 'Previous error',
        })
      );

      expect(result.current.hasError).toBe(true);

      act(() => {
        result.current.handleChange({
          target: { value: '1' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });
  });

  describe('Focus and Blur Handling', () => {
    it('should handle focus correctly', () => {
      const { result } = renderHook(() =>
        useRoutingNumberInput('', {
          hasError: true,
          errorMessage: 'Error message',
        })
      );

      act(() => {
        result.current.handleFocus();
      });

      expect(result.current.isFocused).toBe(true);
      expect(result.current.hasError).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });

    it('should handle blur and validate when value exists', () => {
      mockIsValidRoutingNumber.mockReturnValue(true);
      const { result } = renderHook(() => useRoutingNumberInput('123456789'));

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.isFocused).toBe(false);
      expect(mockIsValidRoutingNumber).toHaveBeenCalledWith('123456789');
    });

    it('should not validate on blur when value is empty', () => {
      const { result } = renderHook(() => useRoutingNumberInput(''));

      act(() => {
        result.current.handleBlur();
      });

      expect(mockIsValidRoutingNumber).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate required field', () => {
      const { result } = renderHook(() =>
        useRoutingNumberInput('', { required: true })
      );

      act(() => {
        const isValid = result.current.validateRoutingNumber();
        expect(isValid).toBe(false);
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe(ValidationMessages.REQUIRED);
    });

    it('should validate routing number format', () => {
      mockIsValidRoutingNumber.mockReturnValue(false);
      const { result } = renderHook(() => useRoutingNumberInput('12345'));

      act(() => {
        const isValid = result.current.validateRoutingNumber();
        expect(isValid).toBe(false);
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe(ValidationMessages.INVALID_ROUTING_NUMBER);
      expect(mockIsValidRoutingNumber).toHaveBeenCalledWith('12345');
    });

    it('should pass validation for valid routing number', () => {
      mockIsValidRoutingNumber.mockReturnValue(true);
      const { result } = renderHook(() => useRoutingNumberInput('123456789'));

      act(() => {
        const isValid = result.current.validateRoutingNumber();
        expect(isValid).toBe(true);
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });

    it('should use custom validator when provided', () => {
      const customValidator = jest.fn().mockReturnValue({
        isValid: false,
        message: 'Custom validation error',
      });

      const { result } = renderHook(() =>
        useRoutingNumberInput('123456789', { customValidator })
      );

      act(() => {
        const isValid = result.current.validateRoutingNumber();
        expect(isValid).toBe(false);
      });

      expect(customValidator).toHaveBeenCalledWith('123456789');
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('Custom validation error');
    });

    it('should validate on change when validateOnChange is true', () => {
      mockIsValidRoutingNumber.mockReturnValue(true);
      const { result } = renderHook(() =>
        useRoutingNumberInput('', { validateOnChange: true })
      );

      act(() => {
        result.current.handleChange({
          target: { value: '123456789' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(mockIsValidRoutingNumber).toHaveBeenCalledWith('123456789');
    });
  });

  describe('Keyboard Handling', () => {
    it('should validate on Enter key press', () => {
      mockIsValidRoutingNumber.mockReturnValue(true);
      const { result } = renderHook(() => useRoutingNumberInput('123456789'));

      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
        } as React.KeyboardEvent<HTMLInputElement>);
      });

      expect(mockIsValidRoutingNumber).toHaveBeenCalledWith('123456789');
    });

    it('should not validate on other key presses', () => {
      const { result } = renderHook(() => useRoutingNumberInput('123456789'));

      act(() => {
        result.current.handleKeyDown({
          key: 'Tab',
        } as React.KeyboardEvent<HTMLInputElement>);
      });

      expect(mockIsValidRoutingNumber).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should clear error state', () => {
      const onClearError = jest.fn();
      const { result } = renderHook(() =>
        useRoutingNumberInput('', {
          hasError: true,
          errorMessage: 'Error',
          onClearError,
        })
      );

      act(() => {
        result.current.clearError();
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.errorMessage).toBe('');
      expect(onClearError).toHaveBeenCalled();
    });

    it('should set value programmatically', () => {
      const onRoutingNumberChange = jest.fn();
      const { result } = renderHook(() =>
        useRoutingNumberInput('', { onRoutingNumberChange })
      );

      act(() => {
        result.current.setValue('987654321');
      });

      expect(result.current.value).toBe('987654321');
      expect(onRoutingNumberChange).toHaveBeenCalledWith('987654321');
    });

    it('should reject non-numeric values when setting programmatically', () => {
      const onRoutingNumberChange = jest.fn();
      const { result } = renderHook(() =>
        useRoutingNumberInput('', { onRoutingNumberChange })
      );

      act(() => {
        result.current.setValue('abc123');
      });

      expect(result.current.value).toBe('');
      expect(onRoutingNumberChange).not.toHaveBeenCalled();
    });
  });

  describe('Input Props', () => {
    it('should provide correct input props', () => {
      const { result } = renderHook(() => useRoutingNumberInput('123456789'));

      const { inputProps } = result.current;

      expect(inputProps.type).toBe('text');
      expect(inputProps.inputMode).toBe('numeric');
      expect(inputProps.pattern).toBe('[0-9]*');
      expect(inputProps.maxLength).toBe(9);
      expect(inputProps.placeholder).toBe('Routing Number');
      expect(inputProps.value).toBe('123456789');
      expect(inputProps['aria-label']).toBe('Bank routing number');
      expect(inputProps['aria-invalid']).toBe(false);
    });

    it('should set aria-invalid to true when there is an error', () => {
      const { result } = renderHook(() =>
        useRoutingNumberInput('', {
          hasError: true,
          errorMessage: 'Error',
        })
      );

      expect(result.current.inputProps['aria-invalid']).toBe(true);
      expect(result.current.inputProps['aria-describedby']).toBe('routing-number-error');
    });
  });

  describe('Error State Updates', () => {
    it('should update error state when props change', () => {
      const { result, rerender } = renderHook(
        ({ hasError, errorMessage }) =>
          useRoutingNumberInput('', { hasError, errorMessage }),
        {
          initialProps: { hasError: false, errorMessage: '' },
        }
      );

      expect(result.current.hasError).toBe(false);

      rerender({ hasError: true, errorMessage: 'New error' });

      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('New error');
    });
  });
});
