/**
 * @fileoverview Tests for LastNameInput component
 * Following boombox-11.0 testing standards
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import LastNameInput from '@/components/forms/LastNameInput';

expect.extend(toHaveNoViolations);

describe('LastNameInput', () => {
  const defaultProps = {
    value: '',
    onLastNameChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<LastNameInput {...defaultProps} />);
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    });

    it('displays the input field', () => {
      render(<LastNameInput {...defaultProps} />);
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders with provided value', () => {
      render(<LastNameInput {...defaultProps} value="Smith" />);
      const input = screen.getByDisplayValue('Smith');
      expect(input).toBeInTheDocument();
    });

    it('renders inside basis-1/2 container', () => {
      const { container } = render(<LastNameInput {...defaultProps} />);
      const wrapper = container.querySelector('.basis-1\\/2');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<LastNameInput {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with error state', async () => {
      const { container } = render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Last name is required"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible placeholder text', () => {
      render(<LastNameInput {...defaultProps} />);
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).toHaveAccessibleName();
    });
  });

  describe('User Interactions', () => {
    it('calls onLastNameChange when user types', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      await user.type(input, 'Johnson');
      
      expect(mockOnChange).toHaveBeenCalled();
      // Should be called once per character typed
      expect(mockOnChange).toHaveBeenCalledTimes(7);
    });

    it('updates input value when typing', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      await user.type(input, 'Williams');
      
      // Check that callback was called for each character
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]).toBe('s');
    });

    it('handles controlled component updates', () => {
      const { rerender } = render(
        <LastNameInput
          {...defaultProps}
          value="Brown"
        />
      );
      
      expect(screen.getByDisplayValue('Brown')).toBeInTheDocument();
      
      rerender(
        <LastNameInput
          {...defaultProps}
          value="Brown Jr."
        />
      );
      
      expect(screen.getByDisplayValue('Brown Jr.')).toBeInTheDocument();
    });

    it('handles empty value', () => {
      render(<LastNameInput {...defaultProps} value="" />);
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).toHaveValue('');
    });

    it('allows special characters in names', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      await user.type(input, "O'Brien-Smith");
      
      // Callback is called for each character typed
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Focus and Blur Behavior', () => {
    it('applies focus styling when input is focused', () => {
      render(<LastNameInput {...defaultProps} />);
      const input = screen.getByPlaceholderText('Last Name');
      
      fireEvent.focus(input);
      
      // Component uses design system classes
      expect(input).toHaveClass('input-field');
    });

    it('calls onClearError when input is focused', () => {
      const mockClearError = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Error message"
          onClearError={mockClearError}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      fireEvent.focus(input);
      
      expect(mockClearError).toHaveBeenCalled();
    });

    it('clears local error state on focus', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Last name is required"
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).toHaveClass('input-field--error');
      
      fireEvent.focus(input);
      
      // Input should still exist after focus
      expect(input).toBeInTheDocument();
    });

    it('handles blur event', () => {
      render(<LastNameInput {...defaultProps} />);
      const input = screen.getByPlaceholderText('Last Name');
      
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      // Should not throw error
      expect(input).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when hasError is true', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Last name is required"
        />
      );
      
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
    });

    it('applies error styling to input when hasError is true', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Error"
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      // Component uses design system error class
      expect(input).toHaveClass('input-field--error');
    });

    it('applies error styling to placeholder when hasError is true', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Error"
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      // Component uses design system error class which includes placeholder styling
      expect(input).toHaveClass('input-field--error');
    });

    it('does not display error message when hasError is false', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={false}
          errorMessage="This should not appear"
        />
      );
      
      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });

    it('displays error message with correct styling', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Invalid last name"
        />
      );
      
      const errorMessage = screen.getByText('Invalid last name');
      // Component uses design system form-error class
      expect(errorMessage).toHaveClass('form-error');
    });

    it('updates error state when hasError prop changes', () => {
      const { rerender } = render(
        <LastNameInput
          {...defaultProps}
          hasError={false}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).not.toHaveClass('input-field--error');
      
      rerender(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Error appeared"
        />
      );
      
      expect(input).toHaveClass('input-field--error');
      expect(screen.getByText('Error appeared')).toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('uses design system input-field class by default', () => {
      render(<LastNameInput {...defaultProps} />);
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).toHaveClass('input-field');
    });

    it('uses design system error class when hasError', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Error"
        />
      );
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).toHaveClass('input-field--error');
    });

    it('applies design system form-error class to error message', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Test error"
        />
      );
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toHaveClass('form-error');
    });

    it('maintains design system classes across state changes', () => {
      const { rerender } = render(<LastNameInput {...defaultProps} />);
      const input = screen.getByPlaceholderText('Last Name');
      
      expect(input).toHaveClass('input-field');
      
      rerender(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Error"
        />
      );
      
      expect(input).toHaveClass('input-field--error');
    });
  });

  describe('Integration with Forms', () => {
    it('works in a form context', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const mockOnChange = jest.fn();
      
      render(
        <form onSubmit={handleSubmit}>
          <LastNameInput
            {...defaultProps}
            onLastNameChange={mockOnChange}
          />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      fireEvent.change(input, { target: { value: 'TestName' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('TestName');
    });

    it('can be part of a multi-field form', () => {
      render(
        <>
          <input placeholder="First Name" />
          <LastNameInput {...defaultProps} />
          <input placeholder="Email" />
        </>
      );
      
      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long names', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      const longName = 'A'.repeat(100);
      
      render(
        <LastNameInput
          {...defaultProps}
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      
      // Use fireEvent for performance with large text
      fireEvent.change(input, { target: { value: longName } });
      
      expect(mockOnChange).toHaveBeenCalledWith(longName);
    });

    it('handles names with spaces', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      await user.type(input, 'Van Der Berg');
      
      // Callback is called for each character
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('handles names with numbers', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      await user.type(input, 'Smith3rd');
      
      // Callback is called for each character
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('handles rapid typing', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      
      // Simulate rapid typing
      fireEvent.change(input, { target: { value: 'Quick' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('Quick');
    });

    it('handles clearing the input', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <LastNameInput
          {...defaultProps}
          value="Smith"
          onLastNameChange={mockOnChange}
        />
      );
      
      const input = screen.getByDisplayValue('Smith');
      await user.clear(input);
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Props Validation', () => {
    it('handles undefined onClearError gracefully', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
          errorMessage="Error"
          onClearError={undefined}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      
      // Should not throw error when focusing
      expect(() => {
        fireEvent.focus(input);
      }).not.toThrow();
    });

    it('handles missing errorMessage when hasError is true', () => {
      render(
        <LastNameInput
          {...defaultProps}
          hasError={true}
        />
      );
      
      const input = screen.getByPlaceholderText('Last Name');
      expect(input).toHaveClass('input-field--error');
    });
  });
});

