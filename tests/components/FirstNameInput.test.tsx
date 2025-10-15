/**
 * @fileoverview Test suite for FirstNameInput component
 * @source boombox-10.0/src/app/components/reusablecomponents/firstnameinput.tsx
 * 
 * Tests cover:
 * - Component rendering and props
 * - User interactions (typing, focus, blur)
 * - Validation behavior
 * - Error state handling
 * - Accessibility features
 * - Design system integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FirstNameInput from '@/components/forms/FirstNameInput';

// Mock the useNameInput hook for controlled testing
jest.mock('@/hooks/useNameInput');

describe('FirstNameInput', () => {
  const mockOnFirstNameChange = jest.fn();
  const mockOnClearError = jest.fn();

  // Mock implementation of useNameInput hook
  const mockUseNameInput = {
    isFocused: false,
    hasError: false,
    errorMessage: '',
    handleFocus: jest.fn(),
    handleBlur: jest.fn(),
    handleChange: jest.fn(),
    handleKeyDown: jest.fn(),
    validateName: jest.fn(),
    clearError: jest.fn(),
    getInputClasses: jest.fn(() => 'input-field'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    const { useNameInput } = require('@/hooks/useNameInput');
    useNameInput.mockReturnValue(mockUseNameInput);
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'First Name');
      expect(input).toHaveAttribute('id', 'firstName');
    });

    it('renders with custom props', () => {
      render(
        <FirstNameInput
          value="John"
          onFirstNameChange={mockOnFirstNameChange}
          placeholder="Enter your first name"
          required
          disabled
          id="customFirstName"
          className="custom-class"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('John');
      expect(input).toHaveAttribute('placeholder', 'Enter your first name');
      expect(input).toHaveAttribute('id', 'customFirstName');
      expect(input).toBeRequired();
      expect(input).toBeDisabled();
      expect(input).toHaveClass('custom-class');
    });

    it('applies design system classes correctly', () => {
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input-field');
    });
  });

  describe('User Interactions', () => {
    it('calls onFirstNameChange when user types', async () => {
      const user = userEvent.setup();
      
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'John');

      // userEvent.type triggers onChange for each character
      expect(mockOnFirstNameChange).toHaveBeenCalledTimes(4);
      
      // Based on the actual behavior observed, userEvent.type with an empty input 
      // triggers individual character events, not cumulative values
      expect(mockOnFirstNameChange).toHaveBeenNthCalledWith(1, 'J');
      expect(mockOnFirstNameChange).toHaveBeenNthCalledWith(2, 'o');
      expect(mockOnFirstNameChange).toHaveBeenNthCalledWith(3, 'h');
      expect(mockOnFirstNameChange).toHaveBeenNthCalledWith(4, 'n');
    });

    it('calls hook methods on focus and blur', async () => {
      const user = userEvent.setup();
      
      render(
        <FirstNameInput
          value="John"
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const input = screen.getByRole('textbox');
      
      await user.click(input); // Focus
      expect(mockUseNameInput.handleFocus).toHaveBeenCalled();

      await user.tab(); // Blur
      expect(mockUseNameInput.handleBlur).toHaveBeenCalledWith('John');
    });

    it('handles keyboard events correctly', () => {
      render(
        <FirstNameInput
          value="John"
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockUseNameInput.handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Enter' }),
        'John'
      );
    });
  });

  describe('Error State Handling', () => {
    it('displays error message when hasError is true', () => {
      // Mock error state
      const { useNameInput } = require('@/hooks/useNameInput');
      useNameInput.mockReturnValue({
        ...mockUseNameInput,
        hasError: true,
        errorMessage: 'Please enter a valid name',
      });

      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      expect(screen.getByText('Please enter a valid name')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('applies error styling when hasError is true', () => {
      // Mock error state with error classes
      const { useNameInput } = require('@/hooks/useNameInput');
      useNameInput.mockReturnValue({
        ...mockUseNameInput,
        hasError: true,
        errorMessage: 'Invalid name',
        getInputClasses: jest.fn(() => 'input-field input-field--error'),
      });

      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input-field--error');
    });

    it('does not display error message when hasError is false', () => {
      render(
        <FirstNameInput
          value="John"
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles external error props correctly', () => {
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
          hasError={true}
          errorMessage="External error message"
          onClearError={mockOnClearError}
        />
      );

      // Verify external props are passed to the hook
      const { useNameInput } = require('@/hooks/useNameInput');
      expect(useNameInput).toHaveBeenCalledWith({
        required: false,
        validateOnChange: false,
        hasError: true,
        errorMessage: 'External error message',
        onClearError: mockOnClearError,
      });
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
          required
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'First name (required)');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('autoComplete', 'given-name');
      expect(input).toHaveAttribute('autoCapitalize', 'words');
    });

    it('sets custom ARIA label', () => {
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
          aria-label="Custom first name label"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Custom first name label');
    });

    it('associates error message with input via aria-describedby', () => {
      // Mock error state
      const { useNameInput } = require('@/hooks/useNameInput');
      useNameInput.mockReturnValue({
        ...mockUseNameInput,
        hasError: true,
        errorMessage: 'Error message',
      });

      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
          id="testFirstName"
        />
      );

      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByRole('alert');
      
      expect(errorMessage).toHaveAttribute('id', 'testFirstName-error');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('testFirstName-error'));
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports custom aria-describedby', () => {
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
          aria-describedby="custom-description"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('custom-description'));
    });

    it('has proper error message accessibility attributes', () => {
      // Mock error state
      const { useNameInput } = require('@/hooks/useNameInput');
      useNameInput.mockReturnValue({
        ...mockUseNameInput,
        hasError: true,
        errorMessage: 'Error message',
      });

      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Hook Integration', () => {
    it('initializes useNameInput hook with correct options', () => {
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
          required={true}
          validateOnChange={true}
          hasError={false}
          errorMessage=""
          onClearError={mockOnClearError}
        />
      );

      const { useNameInput } = require('@/hooks/useNameInput');
      expect(useNameInput).toHaveBeenCalledWith({
        required: true,
        validateOnChange: true,
        hasError: false,
        errorMessage: '',
        onClearError: mockOnClearError,
      });
    });

    it('calls hook handleChange when input value changes', async () => {
      const user = userEvent.setup();
      
      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'J');

      expect(mockUseNameInput.handleChange).toHaveBeenCalledWith('J');
    });
  });

  describe('Form Integration', () => {
    it('maintains proper form semantics', () => {
      render(
        <form>
          <FirstNameInput
            value="John"
            onFirstNameChange={mockOnFirstNameChange}
            required
          />
        </form>
      );

      const input = screen.getByRole('textbox');
      expect(input.closest('form')).toBeInTheDocument();
      expect(input).toBeRequired();
    });

    it('handles form submission correctly', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <FirstNameInput
            value="John"
            onFirstNameChange={mockOnFirstNameChange}
          />
          <button type="submit">Submit</button>
        </form>
      );

      const submitButton = screen.getByRole('button');
      fireEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Design System Integration', () => {
    it('applies basis-1/2 wrapper class for layout', () => {
      const { container } = render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const wrapper = container.querySelector('.basis-1\\/2');
      expect(wrapper).toBeInTheDocument();
    });

    it('uses form-error class for error messages', () => {
      // Mock error state
      const { useNameInput } = require('@/hooks/useNameInput');
      useNameInput.mockReturnValue({
        ...mockUseNameInput,
        hasError: true,
        errorMessage: 'Error message',
      });

      render(
        <FirstNameInput
          value=""
          onFirstNameChange={mockOnFirstNameChange}
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveClass('form-error');
    });
  });
});

describe('FirstNameInput Integration Tests', () => {
  // Mock the actual hook for integration tests to avoid complexity
  const mockOnFirstNameChange = jest.fn();

  // Mock implementation for integration tests
  const integrationMockUseNameInput = {
    isFocused: false,
    hasError: false,
    errorMessage: '',
    handleFocus: jest.fn(),
    handleBlur: jest.fn(),
    handleChange: jest.fn(),
    handleKeyDown: jest.fn(),
    validateName: jest.fn(),
    clearError: jest.fn(),
    getInputClasses: jest.fn(() => 'input-field'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates name input behavior with mocked validation', async () => {
    // Mock error state for invalid input
    const { useNameInput } = require('@/hooks/useNameInput');
    useNameInput.mockReturnValueOnce({
      ...integrationMockUseNameInput,
      hasError: true,
      errorMessage: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)',
    });
    
    const { rerender } = render(
      <FirstNameInput
        value="123"
        onFirstNameChange={mockOnFirstNameChange}
        required
        validateOnChange
      />
    );

    // Check that error is displayed for invalid input
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid name (letters, spaces, hyphens, and apostrophes only)')).toBeInTheDocument();

    // Mock success state for valid input
    useNameInput.mockReturnValueOnce({
      ...integrationMockUseNameInput,
      hasError: false,
      errorMessage: '',
    });

    // Rerender with valid input
    rerender(
      <FirstNameInput
        value="John"
        onFirstNameChange={mockOnFirstNameChange}
        required
        validateOnChange
      />
    );

    // Check that error is cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles required field validation behavior', async () => {
    // Mock error state for required field
    const { useNameInput } = require('@/hooks/useNameInput');
    useNameInput.mockReturnValue({
      ...integrationMockUseNameInput,
      hasError: true,
      errorMessage: 'This field is required',
    });
    
    render(
      <FirstNameInput
        value=""
        onFirstNameChange={mockOnFirstNameChange}
        required
      />
    );

    // Check that required field error is displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});
